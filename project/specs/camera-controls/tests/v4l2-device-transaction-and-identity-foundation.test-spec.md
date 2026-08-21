# V4L2 Device Transaction And Identity Foundation Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
Feature spec canonical status: Split child pending independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify the reusable configured-device identity and transaction foundation: trusted `CameraConfig` routing, stable physical identity, injected adapter behavior, per-device serialization, open/close lifetime, cache-state invalidation, matching reconnect, replacement rejection, cancellation recovery, and caller-safe failures. Tests perform no descriptor/menu enumeration, control-value read, try, set, or physical mutation.

## Application Integration Under Test

- App type: library-only.
- User/caller surface: operations owned by `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` and the validated-write/read-back provider candidate in `frigate/camera/v4l2_controls.py`.
- Invocation route: a public `V4L2DeviceTransactionExecutor.run` call receives a real validated `CameraConfig` and one deterministic synchronous operation and executes through an injected `V4L2Adapter`.
- Wiring owner/module: `frigate/camera/v4l2_controls.py`.
- Observable result: the operation's typed sentinel after validated open/close completion, or the specified categorized `V4L2ControlError`, plus an adapter trace proving identity, thread, overlap, and lifetime behavior.
- Integration validation: `frigate/test/test_v4l2_controls.py` exercises the public executor with real `CameraConfig` fixtures and the shared deterministic adapter, not private helpers alone.

## Manual Smoke

- In a disposable Linux environment with a configured stable V4L2 by-id reference, run a read-only sentinel operation that performs capability inspection only. Confirm identity validation, one open/close pair, continued capture, and no resolved path in caller output or normal logs. This optional smoke is not required by the automated suite.

## Automated Smoke Tests

- Build a real `CameraConfig` with a stable by-id reference, configure the adapter to return matching udev and capability identity, invoke `V4L2DeviceTransactionExecutor.run` with a sentinel operation, and assert the sentinel is returned after exactly one open and close on a non-event-loop thread.
- Invoke two gated operations for the same physical identity and assert the second cannot enter its open-device operation until the first closes and releases; invoke a third operation for a distinct identity and assert it can enter independently while the first is gated and no registry mutex is held during the device-lock wait.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Cover `v4l2_device=None`, relative references, bare `/dev/videoN`, accepted `/dev/v4l/by-id/` references, stable alternate absolute references with udev serial/path identity, disconnected targets, matching reconnects, node renumbering, same-device aliases, and udev or capability replacement.
  - Assert the physical key uses stable udev serial/path and `VIDIOC_QUERYCAP` bus/driver/card identity, not camera name or resolved node, and that candidate resolution is repeated under the selected lock before operation execution.
  - Record adapter thread ID, resolve/open/querycap/generic-operation/close order, descriptor overlap, returned identity, injected stage failures, and cache generation/invalidation events.
  - Assert each accepted transaction owns one file descriptor, closes it in all completion and failure paths, and closes before the same-device lock can be reused.
  - Assert missing configuration fails before adapter device access; unstable, disconnected, replacement, and other I/O failures use the exact stable categories.
  - Assert caller-visible errors and normal logs exclude configured/resolved paths, udev record dumps, raw capability/ioctl structures, payloads, raw errno text, and submitted values.
  - Assert disconnect, replacement, and post-submission cancellation increment generation and clear all payload-agnostic cache slots under the device lock; matching reconnect starts with fresh identity validation.
  - Bind one configured-reference digest to identity A, then race matching identity A and replacement identity B resolutions. Assert leased prior/candidate states are locked in ascending identity-digest order, the binding-version recheck occurs before open, no deadlock or partial registry update occurs, and no operation executes for B.
  - Retry identity B after replacement rejection and assert it remains rejected because the authoritative reference binding still names A. Restore A under a renumbered node and assert it reuses the same retained state/lock only after fresh validation.
  - Hold concurrent leases on rejected unbound identity B and assert its stale state/lock is not retired while a waiter or transaction remains. After the final lease, assert retirement occurs only when cache slots are empty and no reference binding points to B; assert the invalidated A state remains because its binding is still authoritative.
  - Assert no test adapter call or synchronous operation runs on the event-loop thread.
- Integrated route behavior:
  - Use real validated `CameraConfig` fixtures to call `V4L2DeviceTransactionExecutor.run` through the injected adapter and assert the returned sentinel or stable error plus the full lifetime trace.
  - Use the same shared adapter fake, temporary identity builder, operation trace, and synchronization gates that the descriptor/read and write children consume, so sibling tests extend rather than duplicate the foundation fixture.
- Failure and stale-result behavior, if applicable:
  - Inject removal during candidate resolution, open, under-lock capability validation, operation execution, and close. Assert `device_disconnected`, no success result, state invalidation, and successful fresh validation after a matching reconnect.
  - Replace the target with different udev or capability identity and assert `unstable_device_identity`, old-state invalidation, and no operation execution.
  - Cancel after worker submission while the operation is gated. Assert the cancelled call waits internally for worker completion and close while retaining the device lock, emits no sentinel, performs no retry or duplicate operation, invalidates state, and allows the next operation only after fresh validation.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - not applicable; endpoint, authorization, wire, and OpenAPI proof belong to API candidates.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - `frigate/test/test_v4l2_controls.py` calls the exact public transaction executor with real `CameraConfig` fixtures and the adapter/error contracts consumed by downstream provider operations.

## Fixtures And Data

- Minimal valid `CameraConfig` fixtures with absent, stable by-id, stable alternate, relative, volatile, disconnected, matching-reconnected, renumbered, aliased, and identity-mismatched device variants.
- A deterministic injected `V4L2Adapter` fake that records thread ID, stable-reference and udev resolution, open/querycap/generic-operation/close order, file-descriptor lifetime and overlap, physical identity, registry binding versions, state leases and retirement, sorted lock acquisition, injected stage errors, and redaction-sensitive values.
- Temporary stable references and identity records representing initial attachment, aliasing, node renumbering, removal, matching reconnection, and mismatched replacement without accessing a physical device.
- Synchronization gates that hold one worker transaction while same-device, same-device-alias, distinct-device, and cancellation cases enter deterministically.
- Payload-agnostic cache sentinels used only to prove generation and invalidation. No descriptor or current-value fixture is owned by this test specification.
- Production-data rule: tests use temporary identities and mocked device behavior and do not require production configuration, camera hardware, `/dev` mutation, or databases.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while independent review is pending.
- [ ] Route-level proof exists for the library-only app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Stable identity, real configuration routing, adapter injection, typed result, and categorized failure output are asserted.
- [ ] Open/close lifetime, same-device serialization, alias serialization, distinct-device concurrency, off-event-loop execution, atomic reference binding, sorted replacement lock ordering, invalidation, matching reconnect, repeated replacement rejection, lease-safe retirement, and cancellation behavior are covered deterministically.
- [ ] No test enumerates descriptors or menus, reads control values, calls try/set ioctls, or mutates physical hardware.
