# V4L2 Camera-Control Provider Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
Feature spec canonical status: Split child pending independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify the reusable provider contract for stable configured-device resolution, complete V4L2 descriptor and current-value reads, validated write/read-back transactions, per-device async isolation, cache lifecycle, and stable categorized failures without physical hardware.

## Application Integration Under Test

- App type: library-only.
- User/caller surface: authenticated camera-control API sibling described by ACD leaf 3.
- Invocation route: public async provider methods receive a real validated `CameraConfig` fixture and call an injected mocked V4L2 adapter.
- Wiring owner/module: `frigate/camera/v4l2_controls.py`.
- Observable result: descriptors with live values, a post-write descriptor, or the specified categorized provider error.
- Integration validation: `frigate/test/test_v4l2_controls.py` exercises both public methods, not private helpers, with deterministic adapter behavior.

## Manual Smoke

- In a disposable Linux test environment with a configured stable V4L2 by-id device, call `get_controls`, change one harmless writable control with `set_control`, verify the returned value matches a direct driver read, restore the original value through `set_control`, and confirm capture remains active. This smoke is optional evidence and is not required by the automated suite.

## Automated Smoke Tests

- Build a real `CameraConfig` with a stable `v4l2_device`, return one mocked integer descriptor/current value, invoke `get_controls`, and assert the public result fields.
- Invoke `set_control` for that descriptor and assert the adapter call order is try, set, get and the returned value is the mocked post-write value.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Iterate `VIDIOC_QUERY_EXT_CTRL` with both required next flags and treat terminal `EINVAL` as completion.
  - Expand menu indexes across the declared range, skip sparse-index `EINVAL`, and preserve integer menu values and labels.
  - Carry numeric and serialized IDs, name, class, type, bounds, step, default/current values, flags, element size/count/dimensions, and derived active/writable/write-support state.
  - Validate booleans, integers, menus, strings, bitmasks, and buttons before set; reject out-of-range, off-step, absent-menu, read-only, inactive, grabbed, unknown, payload, compound, and unsupported-array writes without a set call.
  - Prove try/set/get ordering, read-back of driver clamping and coupled changes, and no cache-derived success.
  - Map all specified provider failure categories and assert caller-safe messages contain no resolved device path or raw ioctl payload.
  - Assert cache reuse, explicit refresh, disconnect eviction, identity-mismatch eviction, and fresh enumeration after reconnect.
  - Assert same-identity operations do not overlap, distinct-identity operations can overlap, and blocking adapter calls run off the event-loop thread.
- Integrated route behavior:
  - Use a real validated camera-config fixture to invoke both public async methods through the injected adapter seam and assert observable provider results.
- Failure and stale-result behavior, if applicable:
  - Simulate removal during discovery and during write, then restore the stable path with matching identity. Assert the failed operation returns `device_disconnected`, cached metadata is removed, and the next successful operation revalidates identity and re-enumerates.
  - Simulate cancellation after worker submission and assert no success is returned from the cancelled call; the next operation rereads driver state before reporting a value.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - not applicable; endpoint and authorization proof belongs to the sibling API specification.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - `frigate/test/test_v4l2_controls.py` calls `V4L2ControlProvider.get_controls` and `V4L2ControlProvider.set_control` using `CameraConfig`, the exact boundary consumed by the named sibling API.

## Fixtures And Data

- A minimal valid `CameraConfig` fixture with `v4l2_device` absent, stable, unstable, disconnected, and identity-mismatched variants.
- An injected deterministic V4L2 adapter that records thread ID, open/close lifetime, query/read/try/set calls, file-descriptor overlap, returned descriptors, sparse menu errors, and injected errno failures.
- Synchronization gates that deterministically hold one mocked ioctl transaction while a second same-device or different-device call enters.
- Production-data rule: tests use temporary identities and mocked driver behavior and do not require production configuration, camera hardware, or databases.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while split coverage is incomplete.
- [ ] Route-level proof exists for the app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Observable result is asserted or manually checked.
- [ ] Failure behavior is covered where applicable.
