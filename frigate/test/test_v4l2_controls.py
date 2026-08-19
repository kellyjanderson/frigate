"""Tests for configured V4L2 identity and transaction handling."""

from __future__ import annotations

import asyncio
import errno
import hashlib
import threading
import unittest
from collections.abc import Callable

from frigate.camera.v4l2_controls import (
    V4L2Adapter,
    V4L2ControlError,
    V4L2DeviceTransactionExecutor,
    _ResolvedV4L2Device,
)
from frigate.config.camera import CameraConfig


def _camera(reference: str | None) -> CameraConfig:
    return CameraConfig(
        name="front_door",
        ffmpeg={
            "inputs": [
                {
                    "path": "rtsp://example.invalid/camera",
                    "roles": ["detect"],
                }
            ]
        },
        v4l2_device=reference,
    )


def _identity(
    reference: str,
    digest: str,
    *,
    serial: str = "serial-a",
    path: str = "pci-a-usb-a",
    node: str = "/dev/video10",
    bus: str = "usb-a",
    driver: str = "uvcvideo",
    card: str = "camera-a",
) -> _ResolvedV4L2Device:
    return _ResolvedV4L2Device(
        configured_reference_digest=digest,
        device_node=node,
        udev_serial=serial,
        udev_path=path,
        bus_info=bus,
        driver=driver,
        card=card,
        capabilities=0x04000001,
    )


class FakeV4L2Adapter(V4L2Adapter):
    """Deterministic adapter with traceable identity and lifetime behavior."""

    def __init__(self) -> None:
        self.identities: dict[str, _ResolvedV4L2Device] = {}
        self.trace: list[tuple[object, ...]] = []
        self.thread_ids: set[int] = set()
        self.failures: dict[str, BaseException] = {}
        self._fd_nodes: dict[int, str] = {}
        self._next_fd = 100
        self._mutex = threading.Lock()
        self.after_open: Callable[[], None] | None = None

    def add_identity(self, reference: str, **changes: object) -> None:
        digest = hashlib.sha256(reference.encode()).hexdigest()
        self.identities[reference] = _identity(reference, digest, **changes)

    def resolve_device(
        self, configured_reference: str, configured_reference_digest: str
    ) -> _ResolvedV4L2Device:
        self._record("resolve", configured_reference_digest)
        self._fail("resolve")
        identity = self.identities.get(configured_reference)
        if identity is None:
            raise FileNotFoundError(errno.ENOENT, "secret missing path")
        return identity

    def open_device(self, device_node: str) -> int:
        self._record("open")
        self._fail("open")
        with self._mutex:
            fd = self._next_fd
            self._next_fd += 1
            self._fd_nodes[fd] = device_node
        if self.after_open is not None:
            self.after_open()
            self.after_open = None
        return fd

    def validate_open_device(
        self,
        fd: int,
        configured_reference: str,
        configured_reference_digest: str,
    ) -> _ResolvedV4L2Device:
        self._record("validate", fd, configured_reference_digest)
        self._fail("validate")
        identity = self.identities.get(configured_reference)
        if identity is None:
            raise FileNotFoundError(errno.ENOENT, "secret missing path")
        return identity

    def close_device(self, fd: int) -> None:
        self._record("close", fd)
        with self._mutex:
            self._fd_nodes.pop(fd, None)
        self._fail("close")

    def _record(self, *event: object) -> None:
        with self._mutex:
            self.thread_ids.add(threading.get_ident())
            self.trace.append(event)

    def _fail(self, stage: str) -> None:
        failure = self.failures.get(stage)
        if failure is not None:
            raise failure


class TestV4L2DeviceTransactions(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.reference = "/dev/v4l/by-id/usb-camera-a-video-index0"
        self.adapter = FakeV4L2Adapter()
        self.adapter.add_identity(self.reference)
        self.executor = V4L2DeviceTransactionExecutor(self.adapter)
        self.loop_thread_id = threading.get_ident()

    async def test_public_route_returns_after_validation_operation_and_close(
        self,
    ) -> None:
        def operation(adapter, fd, resolved, state):
            self.adapter._record(
                "operation", fd, resolved.physical_identity_digest, state.generation
            )
            return ("sentinel", resolved.capabilities)

        result = await self.executor.run(_camera(self.reference), operation)

        self.assertEqual(("sentinel", 0x04000001), result)
        self.assertEqual(
            ["resolve", "open", "validate", "operation", "close"],
            [event[0] for event in self.adapter.trace],
        )
        self.assertNotIn(self.loop_thread_id, self.adapter.thread_ids)
        self.assertEqual({}, self.adapter._fd_nodes)

    async def test_missing_and_unstable_references_fail_before_adapter_access(
        self,
    ) -> None:
        for reference, category in (
            (None, "not_configured"),
            ("relative/device", "unstable_device_identity"),
            ("/dev/video4", "unstable_device_identity"),
        ):
            with self.subTest(reference=reference):
                with self.assertRaises(V4L2ControlError) as caught:
                    await self.executor.run(_camera(reference), lambda *_: None)
                self.assertEqual(category, caught.exception.category)
        self.assertEqual([], self.adapter.trace)

    async def test_alternate_absolute_reference_with_stable_identity_is_accepted(
        self,
    ) -> None:
        reference = "/run/frigate/camera-control-device"
        self.adapter.add_identity(reference)

        result = await self.executor.run(_camera(reference), lambda *_: "accepted")

        self.assertEqual("accepted", result)

    async def test_node_renumbering_reuses_physical_state(self) -> None:
        first_state = None

        def first_operation(_adapter, _fd, _resolved, state):
            nonlocal first_state
            first_state = state
            state.cache_slots["descriptor"] = "cached"
            return "first"

        await self.executor.run(_camera(self.reference), first_operation)
        current = self.adapter.identities[self.reference]
        self.adapter.identities[self.reference] = _identity(
            self.reference,
            current.configured_reference_digest,
            node="/dev/video27",
        )

        second_state = None

        def second_operation(_adapter, _fd, _resolved, state):
            nonlocal second_state
            second_state = state
            return state.cache_slots["descriptor"]

        result = await self.executor.run(_camera(self.reference), second_operation)

        self.assertEqual("cached", result)
        self.assertIs(first_state, second_state)

    async def test_same_identity_and_alias_serialize_while_distinct_identity_overlaps(
        self,
    ) -> None:
        alias = "/dev/v4l/by-id/usb-camera-a-alias-video-index0"
        other = "/dev/v4l/by-id/usb-camera-b-video-index0"
        self.adapter.add_identity(alias, node="/dev/video22")
        self.adapter.add_identity(
            other,
            serial="serial-b",
            path="pci-b-usb-b",
            node="/dev/video30",
            bus="usb-b",
            card="camera-b",
        )
        first_entered = threading.Event()
        release_first = threading.Event()
        alias_entered = threading.Event()
        other_entered = threading.Event()

        def first(*_args):
            first_entered.set()
            release_first.wait(3)
            return "first"

        def alias_operation(*_args):
            alias_entered.set()
            return "alias"

        def other_operation(*_args):
            other_entered.set()
            return "other"

        first_task = asyncio.create_task(
            self.executor.run(_camera(self.reference), first)
        )
        self.assertTrue(await asyncio.to_thread(first_entered.wait, 2))
        alias_task = asyncio.create_task(
            self.executor.run(_camera(alias), alias_operation)
        )
        other_task = asyncio.create_task(
            self.executor.run(_camera(other), other_operation)
        )

        self.assertTrue(await asyncio.to_thread(other_entered.wait, 2))
        self.assertFalse(alias_entered.is_set())
        release_first.set()

        self.assertEqual(
            ["first", "alias", "other"],
            await asyncio.gather(first_task, alias_task, other_task),
        )
        self.assertTrue(alias_entered.is_set())

    async def test_replacement_invalidates_without_rebinding_and_matching_reconnects(
        self,
    ) -> None:
        bound_state = None

        def prime(_adapter, _fd, _resolved, state):
            nonlocal bound_state
            bound_state = state
            state.cache_slots["descriptor"] = object()
            return None

        await self.executor.run(_camera(self.reference), prime)
        original = self.adapter.identities[self.reference]
        replacement = _identity(
            self.reference,
            original.configured_reference_digest,
            serial="serial-replacement",
            path="pci-replacement",
            node="/dev/video40",
            bus="usb-replacement",
            card="camera-replacement",
        )
        self.adapter.identities[self.reference] = replacement

        for _attempt in range(2):
            with self.assertRaises(V4L2ControlError) as caught:
                await self.executor.run(
                    _camera(self.reference),
                    lambda *_: self.fail("replacement operation executed"),
                )
            self.assertEqual("unstable_device_identity", caught.exception.category)

        self.assertGreaterEqual(bound_state.generation, 2)
        self.assertEqual({}, bound_state.cache_slots)
        reference_digest = hashlib.sha256(self.reference.encode()).hexdigest()
        binding = self.executor._registry._bindings[reference_digest]
        self.assertEqual(original.physical_key, binding.physical_key)
        self.assertNotIn(replacement.physical_key, self.executor._registry._states)

        self.adapter.identities[self.reference] = _identity(
            self.reference,
            original.configured_reference_digest,
            node="/dev/video55",
        )
        reconnected_state = None

        def reconnect(_adapter, _fd, _resolved, state):
            nonlocal reconnected_state
            reconnected_state = state
            return state.generation

        generation = await self.executor.run(_camera(self.reference), reconnect)
        self.assertIs(bound_state, reconnected_state)
        self.assertGreaterEqual(generation, 2)

    async def test_under_lock_identity_change_closes_without_running_operation(
        self,
    ) -> None:
        original = self.adapter.identities[self.reference]

        def replace_after_open() -> None:
            self.adapter.identities[self.reference] = _identity(
                self.reference,
                original.configured_reference_digest,
                serial="serial-b",
                path="path-b",
                bus="bus-b",
                card="card-b",
            )

        self.adapter.after_open = replace_after_open
        with self.assertRaises(V4L2ControlError) as caught:
            await self.executor.run(
                _camera(self.reference),
                lambda *_: self.fail("operation executed after identity change"),
            )

        self.assertEqual("unstable_device_identity", caught.exception.category)
        self.assertEqual("close", self.adapter.trace[-1][0])
        self.assertEqual({}, self.adapter._fd_nodes)

    async def test_disconnect_at_each_stage_is_categorized_and_invalidates(
        self,
    ) -> None:
        for stage in ("resolve", "open", "validate", "close"):
            with self.subTest(stage=stage):
                adapter = FakeV4L2Adapter()
                adapter.add_identity(self.reference)
                adapter.failures[stage] = OSError(
                    errno.ENODEV, f"raw errno and secret path at {stage}"
                )
                executor = V4L2DeviceTransactionExecutor(adapter)
                with self.assertRaises(V4L2ControlError) as caught:
                    await executor.run(_camera(self.reference), lambda *_: "success")
                self.assertEqual("device_disconnected", caught.exception.category)
                self.assertNotIn(self.reference, str(caught.exception))
                self.assertNotIn("raw errno", str(caught.exception))

        adapter = FakeV4L2Adapter()
        adapter.add_identity(self.reference)
        executor = V4L2DeviceTransactionExecutor(adapter)
        state = None

        def disconnected_operation(_adapter, _fd, _resolved, device_state):
            nonlocal state
            state = device_state
            state.cache_slots["payload"] = "secret submitted value"
            raise OSError(errno.ENODEV, "raw ioctl payload and secret path")

        with self.assertRaises(V4L2ControlError) as caught:
            await executor.run(_camera(self.reference), disconnected_operation)
        self.assertEqual("device_disconnected", caught.exception.category)
        self.assertEqual({}, state.cache_slots)
        self.assertEqual(1, state.generation)

    async def test_other_io_failure_is_redacted(self) -> None:
        self.adapter.failures["open"] = OSError(
            errno.EACCES, f"cannot access {self.reference}: submitted=1234"
        )

        with self.assertRaises(V4L2ControlError) as caught:
            await self.executor.run(
                _camera(self.reference), lambda *_: None, operation_name="read_controls"
            )

        self.assertEqual("device_io", caught.exception.category)
        self.assertEqual("read_controls", caught.exception.operation)
        self.assertNotIn(self.reference, str(caught.exception))
        self.assertNotIn("1234", str(caught.exception))

    async def test_post_submission_cancellation_waits_for_close_and_invalidates(
        self,
    ) -> None:
        entered = threading.Event()
        release = threading.Event()
        state = None
        operation_count = 0

        def operation(_adapter, _fd, _resolved, device_state):
            nonlocal state, operation_count
            state = device_state
            operation_count += 1
            device_state.cache_slots["descriptor"] = object()
            entered.set()
            release.wait(3)
            return "must not escape"

        transaction = asyncio.create_task(
            self.executor.run(_camera(self.reference), operation)
        )
        self.assertTrue(await asyncio.to_thread(entered.wait, 2))
        transaction.cancel()
        await asyncio.sleep(0.05)
        self.assertFalse(transaction.done())

        follower_entered = threading.Event()
        follower = asyncio.create_task(
            self.executor.run(
                _camera(self.reference),
                lambda *_: follower_entered.set() or "fresh",
            )
        )
        await asyncio.sleep(0.05)
        self.assertFalse(follower_entered.is_set())
        release.set()

        with self.assertRaises(asyncio.CancelledError):
            await transaction
        self.assertEqual("fresh", await follower)
        self.assertEqual(1, operation_count)
        self.assertEqual({}, state.cache_slots)
        self.assertEqual(1, state.generation)
        close_index = max(
            index
            for index, event in enumerate(self.adapter.trace)
            if event[0] == "close"
        )
        self.assertGreater(close_index, 0)

    async def test_rejected_state_retires_only_after_final_lease(self) -> None:
        await self.executor.run(_camera(self.reference), lambda *_: None)
        original = self.adapter.identities[self.reference]
        replacement = _identity(
            self.reference,
            original.configured_reference_digest,
            serial="serial-b",
            path="path-b",
            bus="bus-b",
            card="card-b",
        )
        registry = self.executor._registry
        reference_digest = original.configured_reference_digest
        first = await registry.lease(reference_digest, replacement)
        second = await registry.lease(reference_digest, replacement)
        for state in first.states:
            await state.lock.acquire()
        try:
            self.assertTrue(await registry.snapshot_is_current(first))
            self.assertFalse(await registry.accept_or_reject(first, replacement))
        finally:
            for state in reversed(first.states):
                state.lock.release()

        ordered_digests = [state.identity_digest for state in first.states]
        self.assertEqual(sorted(ordered_digests), ordered_digests)
        await registry.release(first)
        self.assertIn(replacement.physical_key, registry._states)
        await registry.release(second)
        self.assertNotIn(replacement.physical_key, registry._states)
        self.assertIn(original.physical_key, registry._states)

    async def test_binding_version_change_retries_with_both_states_locked(self) -> None:
        reference_digest = hashlib.sha256(self.reference.encode()).hexdigest()
        candidate_a = self.adapter.identities[self.reference]
        candidate_b = _identity(
            self.reference,
            reference_digest,
            serial="serial-b",
            path="path-b",
            bus="bus-b",
            card="card-b",
        )
        registry = self.executor._registry
        lease_a = await registry.lease(reference_digest, candidate_a)
        stale_lease_b = await registry.lease(reference_digest, candidate_b)

        for state in lease_a.states:
            await state.lock.acquire()
        try:
            self.assertTrue(await registry.snapshot_is_current(lease_a))
            self.assertTrue(await registry.accept_or_reject(lease_a, candidate_a))
        finally:
            for state in reversed(lease_a.states):
                state.lock.release()
            await registry.release(lease_a)

        self.assertIsNone(await registry.accept_or_reject(stale_lease_b, candidate_b))
        await registry.release(stale_lease_b)

        retry = await registry.lease(reference_digest, candidate_b)
        self.assertEqual(2, len(retry.states))
        self.assertEqual(
            sorted(state.identity_digest for state in retry.states),
            [state.identity_digest for state in retry.states],
        )
        await registry.release(retry)


if __name__ == "__main__":
    unittest.main()
