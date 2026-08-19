"""Safe serialized transactions for configured Linux V4L2 devices."""

from __future__ import annotations

import asyncio
import errno
import fcntl
import hashlib
import os
import re
import struct
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal, TypeVar

from frigate.config.camera import CameraConfig

_VIDIOC_QUERYCAP = 0x80685600
_V4L2_CAPABILITY_SIZE = 104
_VOLATILE_VIDEO_NODE = re.compile(r"^/dev/video\d+$")
_DISCONNECTED_ERRNOS = {
    errno.ENODEV,
    errno.ENOENT,
    errno.ENXIO,
    errno.EIO,
    errno.ESHUTDOWN,
}

V4L2ErrorCategory = Literal[
    "not_configured",
    "unstable_device_identity",
    "device_disconnected",
    "device_io",
]
T = TypeVar("T")


class _IdentityChangedError(Exception):
    """Indicate that identity changed without exposing its raw components."""


@dataclass(frozen=True, slots=True)
class _ResolvedV4L2Device:
    """A resolved device whose physical key excludes its transient node."""

    configured_reference_digest: str
    device_node: str
    udev_serial: str
    udev_path: str
    bus_info: str
    driver: str
    card: str
    capabilities: int

    @property
    def physical_key(self) -> str:
        """Return the stable physical identity used by the registry."""
        return "\0".join(
            (
                self.udev_serial,
                self.udev_path,
                self.bus_info,
                self.driver,
                self.card,
            )
        )

    @property
    def physical_identity_digest(self) -> str:
        """Return a caller-safe digest for ordering and diagnostics."""
        return hashlib.sha256(self.physical_key.encode()).hexdigest()


class V4L2Adapter:
    """Blocking Linux V4L2 access seam used by the transaction executor."""

    def resolve_device(
        self, configured_reference: str, configured_reference_digest: str
    ) -> _ResolvedV4L2Device:
        """Resolve and probe one configured stable device reference."""
        device_node = os.path.realpath(configured_reference)
        os.stat(device_node)
        properties = self._udev_properties(device_node)
        fd = self.open_device(device_node)
        try:
            capabilities = self.query_capabilities(fd)
        finally:
            self.close_device(fd)
        return self._resolved_device(
            configured_reference_digest,
            device_node,
            properties,
            capabilities,
        )

    def open_device(self, device_node: str) -> int:
        """Open a V4L2 device for downstream read and write ioctls."""
        return os.open(device_node, os.O_RDWR | os.O_NONBLOCK)

    def validate_open_device(
        self,
        fd: int,
        configured_reference: str,
        configured_reference_digest: str,
    ) -> _ResolvedV4L2Device:
        """Re-resolve and validate identity for an already opened descriptor."""
        device_node = os.path.realpath(configured_reference)
        if os.stat(device_node).st_rdev != os.fstat(fd).st_rdev:
            raise _IdentityChangedError
        properties = self._udev_properties(device_node)
        capabilities = self.query_capabilities(fd)
        return self._resolved_device(
            configured_reference_digest,
            device_node,
            properties,
            capabilities,
        )

    def query_capabilities(self, fd: int) -> tuple[str, str, str, int]:
        """Return driver, card, bus, and capability data from QUERYCAP."""
        buffer = bytearray(_V4L2_CAPABILITY_SIZE)
        fcntl.ioctl(fd, _VIDIOC_QUERYCAP, buffer, True)
        driver, card, bus_info, _version, capabilities, device_caps = struct.unpack(
            "16s32s32sIII", buffer[:92]
        )
        effective_capabilities = (
            device_caps if capabilities & 0x80000000 else capabilities
        )
        return (
            self._decode_c_string(driver),
            self._decode_c_string(card),
            self._decode_c_string(bus_info),
            effective_capabilities,
        )

    def ioctl(
        self,
        fd: int,
        request: int,
        argument: Any = 0,
        mutate_flag: bool = True,
    ) -> Any:
        """Issue a downstream ioctl against the validated open descriptor."""
        return fcntl.ioctl(fd, request, argument, mutate_flag)

    def close_device(self, fd: int) -> None:
        """Close a transaction-owned descriptor."""
        os.close(fd)

    @staticmethod
    def _decode_c_string(value: bytes) -> str:
        return value.split(b"\0", 1)[0].decode("utf-8", errors="replace")

    @classmethod
    def _udev_properties(cls, device_node: str) -> dict[str, str]:
        stat_result = os.stat(device_node)
        database_path = Path(
            f"/run/udev/data/c{os.major(stat_result.st_rdev)}:"
            f"{os.minor(stat_result.st_rdev)}"
        )
        try:
            lines = database_path.read_text().splitlines()
        except FileNotFoundError:
            return cls._sysfs_identity(stat_result.st_rdev)

        properties = {
            key: value
            for line in lines
            if line.startswith("E:") and "=" in line
            for key, value in [line[2:].split("=", 1)]
        }
        if properties.get("ID_SERIAL") and properties.get("ID_PATH"):
            return properties
        return cls._sysfs_identity(stat_result.st_rdev)

    @staticmethod
    def _sysfs_identity(device_number: int) -> dict[str, str]:
        device_path = Path(
            f"/sys/dev/char/{os.major(device_number)}:{os.minor(device_number)}/device"
        ).resolve(strict=True)
        for parent in (device_path, *device_path.parents):
            if parent == Path("/sys"):
                break
            serial_path = parent / "serial"
            try:
                serial = serial_path.read_text().strip()
            except (FileNotFoundError, NotADirectoryError, PermissionError):
                continue
            if serial:
                physical_path = os.path.relpath(parent, "/sys/devices")
                return {
                    "ID_SERIAL": serial,
                    "ID_PATH": f"sysfs:{physical_path}",
                }
        raise _IdentityChangedError

    @staticmethod
    def _resolved_device(
        configured_reference_digest: str,
        device_node: str,
        properties: dict[str, str],
        capabilities: tuple[str, str, str, int],
    ) -> _ResolvedV4L2Device:
        udev_serial = properties.get("ID_SERIAL", "")
        udev_path = properties.get("ID_PATH", "")
        if not udev_serial or not udev_path:
            raise _IdentityChangedError
        driver, card, bus_info, capability_bits = capabilities
        if not driver or not card or not bus_info:
            raise _IdentityChangedError
        return _ResolvedV4L2Device(
            configured_reference_digest=configured_reference_digest,
            device_node=device_node,
            udev_serial=udev_serial,
            udev_path=udev_path,
            bus_info=bus_info,
            driver=driver,
            card=card,
            capabilities=capability_bits,
        )


class V4L2ControlError(Exception):
    """A stable categorized V4L2 failure safe for callers and normal logs."""

    def __init__(
        self,
        category: V4L2ErrorCategory,
        camera_name: str,
        operation: str,
        *,
        identity_digest: str | None = None,
        private_cause: Exception | None = None,
    ) -> None:
        self.category = category
        self.camera_name = camera_name
        self.operation = operation
        self.identity_digest = identity_digest
        self.private_cause = private_cause
        super().__init__(
            f"V4L2 {operation} failed for camera {camera_name}: {category}"
        )


@dataclass(slots=True)
class _V4L2DeviceState:
    """Serialized state and payload-agnostic cache for one physical device."""

    physical_key: str
    identity_digest: str
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    generation: int = 0
    cache_slots: dict[str, object] = field(default_factory=dict)
    leases: int = 0
    stale: bool = False
    requires_revalidation: bool = True

    def invalidate(self) -> None:
        """Invalidate all derived state after uncertain device work."""
        self.generation += 1
        self.cache_slots.clear()
        self.requires_revalidation = True


@dataclass(slots=True)
class _IdentityBinding:
    physical_key: str
    version: int
    rejected_candidate_digest: str | None = None


@dataclass(frozen=True, slots=True)
class _RegistryLease:
    reference_digest: str
    candidate_key: str
    binding_version: int
    prior_key: str | None
    states: tuple[_V4L2DeviceState, ...]


class _V4L2IdentityRegistry:
    """Own configured-reference bindings and lease-safe physical states."""

    def __init__(self) -> None:
        self._mutex = asyncio.Lock()
        self._bindings: dict[str, _IdentityBinding] = {}
        self._states: dict[str, _V4L2DeviceState] = {}

    async def lease(
        self, reference_digest: str, candidate: _ResolvedV4L2Device
    ) -> _RegistryLease:
        """Lease all states needed for one binding decision."""
        async with self._mutex:
            binding = self._bindings.get(reference_digest)
            prior_key = binding.physical_key if binding else None
            keys = {candidate.physical_key}
            if prior_key is not None:
                keys.add(prior_key)
            states = tuple(
                sorted(
                    (self._state_for(key) for key in keys),
                    key=lambda state: state.identity_digest,
                )
            )
            for state in states:
                state.leases += 1
            return _RegistryLease(
                reference_digest=reference_digest,
                candidate_key=candidate.physical_key,
                binding_version=binding.version if binding else 0,
                prior_key=prior_key,
                states=states,
            )

    async def snapshot_is_current(self, lease: _RegistryLease) -> bool:
        """Confirm the binding did not change while device locks were acquired."""
        async with self._mutex:
            binding = self._bindings.get(lease.reference_digest)
            return (binding.version if binding else 0) == lease.binding_version and (
                binding.physical_key if binding else None
            ) == lease.prior_key

    async def accept_or_reject(
        self, lease: _RegistryLease, candidate: _ResolvedV4L2Device
    ) -> bool | None:
        """Bind, reject, or require a retry when the snapshot changed."""
        async with self._mutex:
            binding = self._bindings.get(lease.reference_digest)
            if (binding.version if binding else 0) != lease.binding_version or (
                binding.physical_key if binding else None
            ) != lease.prior_key:
                return None
            if binding is None:
                self._bindings[lease.reference_digest] = _IdentityBinding(
                    physical_key=candidate.physical_key,
                    version=1,
                )
                self._states[candidate.physical_key].stale = False
                return True
            if binding.physical_key == candidate.physical_key:
                return True

            prior_state = self._states[binding.physical_key]
            prior_state.invalidate()
            binding.version += 1
            binding.rejected_candidate_digest = candidate.physical_identity_digest
            candidate_state = self._states[candidate.physical_key]
            if not self._is_bound(candidate.physical_key):
                candidate_state.cache_slots.clear()
                candidate_state.stale = True
                candidate_state.requires_revalidation = True
            return False

    async def release(self, lease: _RegistryLease) -> None:
        """Release state leases and retire only safe unbound stale entries."""
        async with self._mutex:
            for state in lease.states:
                state.leases -= 1
            for state in lease.states:
                if (
                    state.stale
                    and state.leases == 0
                    and not state.cache_slots
                    and not self._is_bound(state.physical_key)
                ):
                    self._states.pop(state.physical_key, None)

    def _state_for(self, physical_key: str) -> _V4L2DeviceState:
        state = self._states.get(physical_key)
        if state is None:
            identity_digest = hashlib.sha256(physical_key.encode()).hexdigest()
            state = _V4L2DeviceState(physical_key, identity_digest)
            self._states[physical_key] = state
        return state

    def _is_bound(self, physical_key: str) -> bool:
        return any(
            binding.physical_key == physical_key for binding in self._bindings.values()
        )


V4L2Operation = Callable[[V4L2Adapter, int, _ResolvedV4L2Device, _V4L2DeviceState], T]


class V4L2DeviceTransactionExecutor:
    """Run complete blocking device transactions under physical-device locks."""

    def __init__(self, adapter: V4L2Adapter | None = None) -> None:
        self._adapter = adapter or V4L2Adapter()
        self._registry = _V4L2IdentityRegistry()

    async def run(
        self,
        camera_config: CameraConfig,
        operation: V4L2Operation[T],
        *,
        operation_name: str = "device_transaction",
    ) -> T:
        """Resolve, serialize, execute, and close one V4L2 transaction."""
        camera_name = camera_config.name or "unnamed"
        configured_reference = camera_config.v4l2_device
        if configured_reference is None:
            raise V4L2ControlError("not_configured", camera_name, operation_name)
        if not self._is_stable_reference(configured_reference):
            raise V4L2ControlError(
                "unstable_device_identity", camera_name, operation_name
            )

        reference_digest = hashlib.sha256(configured_reference.encode()).hexdigest()
        candidate = await self._resolve_candidate(
            configured_reference,
            reference_digest,
            camera_name,
            operation_name,
        )

        while True:
            lease = await self._registry.lease(reference_digest, candidate)
            acquired: list[_V4L2DeviceState] = []
            try:
                for state in lease.states:
                    await state.lock.acquire()
                    acquired.append(state)
                if not await self._registry.snapshot_is_current(lease):
                    continue
                decision = await self._registry.accept_or_reject(lease, candidate)
                if decision is None:
                    continue
                if not decision:
                    raise V4L2ControlError(
                        "unstable_device_identity",
                        camera_name,
                        operation_name,
                        identity_digest=candidate.physical_identity_digest,
                    )

                candidate_state = next(
                    state
                    for state in lease.states
                    if state.physical_key == candidate.physical_key
                )
                worker = asyncio.create_task(
                    asyncio.to_thread(
                        self._blocking_transaction,
                        configured_reference,
                        reference_digest,
                        candidate,
                        candidate_state,
                        operation,
                    )
                )
                try:
                    result = await asyncio.shield(worker)
                except asyncio.CancelledError as cancellation:
                    while not worker.done():
                        try:
                            await asyncio.shield(worker)
                        except asyncio.CancelledError:
                            continue
                        except BaseException:
                            break
                    candidate_state.invalidate()
                    raise cancellation
                except Exception as error:
                    candidate_state.invalidate()
                    raise self._safe_error(
                        error,
                        camera_name,
                        operation_name,
                        candidate.physical_identity_digest,
                    ) from None

                candidate_state.requires_revalidation = False
                return result
            except V4L2ControlError:
                raise
            finally:
                for state in reversed(acquired):
                    state.lock.release()
                await self._registry.release(lease)

    async def _resolve_candidate(
        self,
        configured_reference: str,
        reference_digest: str,
        camera_name: str,
        operation_name: str,
    ) -> _ResolvedV4L2Device:
        try:
            candidate = await asyncio.to_thread(
                self._adapter.resolve_device,
                configured_reference,
                reference_digest,
            )
        except Exception as error:
            raise self._safe_error(error, camera_name, operation_name) from None
        if candidate.configured_reference_digest != reference_digest:
            raise V4L2ControlError(
                "unstable_device_identity", camera_name, operation_name
            )
        return candidate

    def _blocking_transaction(
        self,
        configured_reference: str,
        reference_digest: str,
        candidate: _ResolvedV4L2Device,
        state: _V4L2DeviceState,
        operation: V4L2Operation[T],
    ) -> T:
        fd = self._adapter.open_device(candidate.device_node)
        operation_error: Exception | None = None
        try:
            validated = self._adapter.validate_open_device(
                fd,
                configured_reference,
                reference_digest,
            )
            if (
                validated.configured_reference_digest != reference_digest
                or validated.physical_key != candidate.physical_key
            ):
                raise _IdentityChangedError
            return operation(self._adapter, fd, validated, state)
        except Exception as error:
            operation_error = error
            raise
        finally:
            try:
                self._adapter.close_device(fd)
            except Exception:
                if operation_error is None:
                    raise

    @staticmethod
    def _is_stable_reference(configured_reference: str) -> bool:
        return os.path.isabs(
            configured_reference
        ) and not _VOLATILE_VIDEO_NODE.fullmatch(configured_reference)

    @staticmethod
    def _safe_error(
        error: Exception,
        camera_name: str,
        operation_name: str,
        identity_digest: str | None = None,
    ) -> V4L2ControlError:
        if isinstance(error, V4L2ControlError):
            return error
        if isinstance(error, _IdentityChangedError):
            category: V4L2ErrorCategory = "unstable_device_identity"
        elif isinstance(error, OSError) and error.errno in _DISCONNECTED_ERRNOS:
            category = "device_disconnected"
        else:
            category = "device_io"
        return V4L2ControlError(
            category,
            camera_name,
            operation_name,
            identity_digest=identity_digest,
            private_cause=error,
        )
