# V4L2 Camera-Control Validated Write And Read-Back Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`
Feature spec canonical status: Split child pending independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify that the shared V4L2 provider validates and applies exactly one supported control write, serializes the full device transaction, and returns authoritative target, coupled-value, and descriptor-refresh state without physical hardware.

## Application Integration Under Test

- App type: library-only.
- User/caller surface: authenticated camera-control write API consumer.
- Invocation route: public `V4L2ControlProvider.set_control` receives a real validated `CameraConfig`, serialized control ID, and scalar/button value and executes through the final transaction/identity prerequisite's injected mocked V4L2 adapter and the final descriptor/live-read provider contract.
- Wiring owner/module: `frigate/camera/v4l2_controls.py`.
- Observable result: `V4L2ControlWriteResult` with the authoritative target, complete post-write control snapshot, and descriptor-refresh flag, or a transaction/identity-compatible categorized error. The downstream API write contract consumes this result without redefining it.
- Integration validation: `frigate/test/test_v4l2_controls.py` exercises the public write method, not private helpers, and asserts both the result and complete adapter trace.

## Manual Smoke

- In a disposable Linux test environment with an idle-safe configured V4L2 control, read and retain the original value, call public `set_control` with one harmless valid value, confirm its result matches direct driver state and capture remains active, restore the retained value through `set_control`, and confirm the restoration with another direct read. Stop and restore immediately if capture stability changes. This optional smoke does not replace automated acceptance.

## Automated Smoke Tests

- Build a real `CameraConfig` fixture and one writable integer descriptor, invoke public `set_control`, and assert try, set, and grouped get order plus a result whose target and snapshot contain the mocked post-write value.
- Mark that descriptor `modify-layout`, invoke the same public route, and assert set, descriptor re-enumeration, grouped read-back, and `descriptors_refreshed=true`.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Accept valid boolean, integer/integer64, menu/integer-menu, button, string, and bitmask values and reject wrong types, boolean-as-integer, range, step, absent-menu, embedded-NUL, encoded-length, negative-bitmask, and outside-mask failures before set.
  - Reject disabled, inactive, read-only, and grabbed controls as `control_not_writable`, unknown IDs as `control_not_found`, and payload, compound, array, and unknown encodings as `unsupported_control_type`, all without set.
  - Prove try-supported and adapter-confirmed try-unavailable paths, map try rejection without set, and assert exactly one set for every success.
  - Prove mandatory grouped read-back, target clamping, automatic-mode coupled changes, target membership in the returned snapshot, and no cache-derived success.
  - Prove `modify-layout` cache eviction, descriptor re-enumeration before result construction, fresh values, and the true refresh flag; ordinary writes preserve metadata and return false.
  - Map write-stage driver rejection, device I/O, disconnection, and read-back failure to stable categories while excluding device paths, ioctl payloads, errno text, and submitted string values from caller-visible data and normal logs.
- Integrated route behavior:
  - Use the transaction/identity prerequisite's real `CameraConfig`, error, mocked-adapter, temporary-identity, and transaction-executor fixtures together with the descriptor/live-read prerequisite's descriptor, cache, and value-read fixtures to invoke public `set_control`; assert the observable result and adapter order rather than testing only validation helpers.
  - Hold a write transaction with the transaction/identity prerequisite's synchronization gates. Assert a second operation on the same identity cannot overlap, an operation on another identity can proceed, and adapter work runs off the event-loop thread.
- Failure and stale-result behavior, if applicable:
  - Remove the device during set and during mandatory read-back. Assert `device_disconnected`, cache eviction, no success result, and fresh identity validation and live read on the next call.
  - Cancel after worker submission. Assert no partial success is returned, the transaction releases safely, no duplicate set occurs, and the next operation rereads authoritative driver state.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - not applicable; HTTP mutation, authorization, wire mapping, and OpenAPI proof belong to the API write child.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - `frigate/test/test_v4l2_controls.py` calls `V4L2ControlProvider.set_control` using the final transaction/identity and descriptor/live-read contracts consumed by `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md`. That downstream contract must consume `V4L2ControlWriteResult` without redefining it.

## Fixtures And Data

- Reuse `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` fixtures for real minimal `CameraConfig`, temporary stable and disconnected identities, mocked-adapter trace, and same-device/different-device synchronization gates.
- Reuse `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` fixtures for complete scalar/control descriptors, cache behavior, grouped value reads, and descriptor/read call recording.
- Extend the shared mocked adapter only with deterministic try-supported, try-unavailable, try-rejected, set-rejected, set-success, clamped read-back, coupled-value, modify-layout, removal, and read-failure scenarios.
- Prerequisite gate: the transaction/identity candidate exists but must receive independent approval and be implemented; the descriptor/live-read final specification must be authored, independently approved, and implemented next before this paired test contract can be implemented.
- Production-data rule: tests use temporary identities and mocked driver behavior and do not require production configuration, a physical camera, or a database.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while split coverage is incomplete.
- [ ] Route-level proof exists for the app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Observable result is asserted or manually checked.
- [ ] Failure behavior is covered where applicable.
