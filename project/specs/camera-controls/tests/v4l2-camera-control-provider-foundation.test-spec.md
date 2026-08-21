# V4L2 Camera-Control Provider Foundation Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
Feature spec canonical status: Split child pending independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify the reusable foundation contract for stable configured-device resolution, complete V4L2 descriptor and menu discovery, full and bounded live-value reads, per-device async isolation, descriptor-cache lifecycle, reconnect recovery, and stable caller-safe failures without physical hardware or any control write.

## Application Integration Under Test

- App type: library-only.
- User/caller surface: authenticated camera-control read API and validated-write provider sibling.
- Invocation route: public async provider methods receive real validated `CameraConfig` fixtures and call an injected deterministic V4L2 adapter.
- Wiring owner/module: `frigate/camera/v4l2_controls.py`.
- Observable result: complete descriptors with live values, an ordered bounded stable-ID/value mapping, or a specified categorized provider error.
- Integration validation: `frigate/test/test_v4l2_controls.py` exercises `get_controls` and `get_control_values`, not private helpers, through the exact shared provider boundary.

## Manual Smoke

- In a disposable Linux environment with a configured stable V4L2 by-id device, call `get_controls`, select up to 64 returned stable IDs, call `get_control_values`, and compare both results with direct read-only `v4l2-ctl` output while capture remains active. This smoke is optional evidence and is not required by the automated suite.

## Automated Smoke Tests

- Build a real `CameraConfig` with a stable `v4l2_device`, return one mocked integer descriptor/current value, invoke `get_controls`, and assert every public descriptor field.
- Invoke `get_control_values` with that descriptor's stable ID and assert one ordered result, one bounded extended-control read, and no descriptor re-enumeration while the cache remains valid.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Validate absolute stable paths and capability identity; reject missing configuration, bare volatile nodes, disappeared targets, and mismatched replacement devices with stable safe categories.
  - Iterate `VIDIOC_QUERY_EXT_CTRL` with both required next flags and treat terminal `EINVAL` as normal completion.
  - Expand menu indexes across the declared range, skip sparse-index `EINVAL`, and preserve ordinary and integer menu fields.
  - Carry numeric and serialized IDs, name, class, type, bounds, step, default/current values, menu items, all reported flags, element size/count/dimensions, and derived active/writable/read-support state.
  - Read full live values for `get_controls`; for `get_control_values`, enforce 1 through 64 unique IDs, preserve request order, reject empty/duplicate/over-limit collections before the value ioctl, reject absent stable IDs, and issue one bounded read transaction.
  - Keep unknown, payload-bearing, compound, and array descriptors inspectable and omit only values the adapter cannot represent losslessly.
  - Map every foundation/read failure category and assert safe messages contain no resolved device path, raw ioctl payload, or raw errno text.
  - Assert cache reuse, explicit refresh, identity-mismatch eviction, disconnect eviction, and fresh enumeration after reconnect.
  - Assert same-identity operations do not overlap, distinct-identity operations can overlap, file descriptors close before lock release, and adapter calls run off the event-loop thread.
- Integrated route behavior:
  - Use real validated camera-config fixtures to invoke both public async read methods through the injected adapter and assert their observable results.
- Failure and stale-result behavior, if applicable:
  - Simulate removal during discovery and bounded read, restore the stable path with matching identity, and assert the failed operation evicts metadata while the next call revalidates, re-enumerates, and rereads.
  - Simulate cancellation after worker submission and assert the cancelled call emits no success; the next operation rereads driver state before returning a value.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - not applicable; endpoint, authorization, and wire proof belong to the API specifications.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - `frigate/test/test_v4l2_controls.py` calls `V4L2ControlProvider.get_controls` and `V4L2ControlProvider.get_control_values` with real `CameraConfig` fixtures, which is the exact reusable boundary named for downstream consumers.

## Fixtures And Data

- Minimal valid `CameraConfig` fixtures with `v4l2_device` absent, stable, volatile, disconnected, and identity-mismatched variants.
- An injected deterministic V4L2 adapter that records thread ID, open/close lifetime, capability/query/menu/read calls, file-descriptor overlap, returned descriptors/values, sparse-menu errors, and injected errno failures.
- Temporary stable links and capability identities representing initial attachment, removal, matching reconnection, and mismatched replacement without accessing a physical device.
- Synchronization gates that deterministically hold one mocked transaction while a second same-device or distinct-device call enters.
- Production-data rule: tests use temporary identities and mocked driver behavior and do not require production configuration, camera hardware, or databases.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while independent review is pending.
- [ ] Route-level proof exists for the library-only app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Full descriptor and bounded live-value results are asserted.
- [ ] Device identity, disconnect/reconnect, cancellation, concurrency, performance bounds, and failure redaction are covered.
- [ ] No test performs `VIDIOC_TRY_EXT_CTRLS`, `VIDIOC_S_EXT_CTRLS`, or any physical control mutation.
