# V4L2 Descriptor Discovery And Live-Read Provider Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`
Feature spec canonical status: Split child awaiting independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify complete V4L2 descriptor and sparse-menu discovery, authoritative full and bounded live reads, metadata-cache refresh behavior, lossless value representation, and provider-level safe failures through both public async read methods. Reuse the transaction/identity sibling's real `CameraConfig` route, injected adapter, lock/lifetime behavior, invalidation, cancellation, and base fixture without issuing any physical write.

## Application Integration Under Test

- App type: library-only.
- User/caller surface: authenticated camera-control read API and validated-write provider leaf.
- Invocation route: public async provider methods receive real validated `CameraConfig` fixtures and run through the sibling's transaction executor and deterministic injected adapter.
- Wiring owner/module: `frigate/camera/v4l2_controls.py`.
- Observable result: complete ordered descriptors with current values, one ordered bounded canonical-ID/value mapping, or a specified foundation-compatible categorized error.
- Integration validation: `frigate/test/test_v4l2_controls.py` exercises `V4L2ControlProvider.get_controls` and `V4L2ControlProvider.get_control_values`, not private helpers.

## Manual Smoke

- In a disposable Linux environment with a configured stable V4L2 by-id device, call `get_controls`, select up to 64 returned canonical IDs, call `get_control_values`, and compare both results with direct read-only `v4l2-ctl` output while capture remains active. This optional evidence never issues a try or set request and is not required by the deterministic automated suite.

## Automated Smoke Tests

- Build a real minimal `CameraConfig` with a stable `v4l2_device`, return one mocked integer descriptor and value, call `get_controls`, and assert every public descriptor field plus the live value.
- Call `get_control_values` with that descriptor's canonical ID and assert one ordered result, one selected extended-control read, metadata-cache reuse, and no descriptor re-enumeration.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Iterate `VIDIOC_QUERY_EXT_CTRL` with `V4L2_CTRL_FLAG_NEXT_CTRL | V4L2_CTRL_FLAG_NEXT_COMPOUND`, treat terminal `EINVAL` as normal completion, and preserve driver enumeration order.
  - Expand ordinary and integer menus across inclusive minimum and maximum indexes, skip sparse-index `EINVAL`, and preserve index, integer value, and label.
  - Carry numeric and canonical serialized IDs, name, class, type, bounds, step, default/current values, menu items, all reported flags, element size/count/dimensions, and derived active, writable, and read-support state.
  - Read all representable current values for `get_controls` in control-class groups. Keep unknown, payload-bearing, compound, and array descriptors inspectable and use `None` with `read_supported=false` only when lossless representation is unavailable.
  - For `get_control_values`, prove the 1 and 64 boundaries, unique canonical-ID validation, request-order preservation, descriptor resolution, and exactly one selected `VIDIOC_G_EXT_CTRLS` request.
  - Reject empty, duplicate, malformed, and 65-ID collections as `invalid_control_ids`, and absent canonical IDs as `control_not_found`, before value I/O.
  - Map nonterminal query, menu, conversion, and read failures to `device_io`; preserve sibling `device_disconnected` behavior and assert safe messages contain no device path, raw ioctl data, payload content, raw errno text, or string value.
  - Assert first-access cache population, metadata reuse with fresh current values, explicit refresh, identity-replacement eviction, disconnect eviction, and matching-reconnect re-enumeration.
  - Extend the sibling adapter fixture to record query, menu, read, thread, lifetime, overlap, and injected-failure behavior. Prove same-identity serialization, distinct-identity concurrency, off-event-loop calls, close before lock release, and next-call re-enumeration/reread after cancellation.
- Integrated route behavior:
  - Use real validated camera-config fixtures to invoke both public async methods through the actual provider, sibling transaction executor, and injected adapter, then assert public results and adapter traces.
- Failure and stale-result behavior, if applicable:
  - Simulate removal during discovery and selected read, restore the stable reference with matching physical identity, and assert the failed operation emits no partial result while the next call revalidates, re-enumerates, and rereads.
  - Simulate cancellation after worker submission and assert the cancelled call emits no success; the next call does not use cancelled-work metadata or values.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - not applicable; endpoint, authorization, wire, and OpenAPI proof belong to API specifications.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - `frigate/test/test_v4l2_controls.py` calls both public provider methods with real `CameraConfig` fixtures through the exact shared foundation contracts consumed downstream.

## Fixtures And Data

- Real minimal `CameraConfig` fixtures with stable, disconnected, matching-reconnected, and identity-mismatched configured-device cases supplied by the transaction/identity sibling.
- The sibling-owned deterministic `V4L2Adapter` fake extended with query, sparse-menu, descriptor, grouped/selected value-read, and call-recording behavior. It is extended in place rather than duplicated.
- Descriptor fixtures covering boolean, integer, integer64, menu, integer-menu, button, string, bitmask, unknown, payload-bearing, compound, and array controls; every driver flag; dimensions; ordinary and integer menu holes; representable and unrepresentable current values.
- Synchronization gates from the sibling fixture that deterministically hold discovery or read work while a same-device or distinct-device call enters.
- Production-data rule: tests use temporary identities and mocked driver behavior and require no production configuration, physical camera, or database.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while independent review is pending.
- [ ] Route-level proof exists for the library-only app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Complete descriptor, sparse-menu, grouped full-read, and bounded ordered selected-read results are asserted.
- [ ] Metadata cache, explicit refresh, disconnect/reconnect, replacement, cancellation, concurrency, call bounds, and failure redaction are covered through the shared foundation route.
- [ ] `V4L2ControlWriteResult` is not defined or asserted here, and no test performs `VIDIOC_TRY_EXT_CTRLS`, `VIDIOC_S_EXT_CTRLS`, or physical control mutation.
