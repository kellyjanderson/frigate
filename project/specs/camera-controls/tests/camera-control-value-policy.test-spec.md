# Camera-Control Editor Kind, Value Validation, And Commit Intent Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/camera-control-value-policy.spec.md`
Feature spec canonical status: Split child awaiting independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify the public value-policy boundary from a successfully normalized descriptor through editor selection, candidate validation, exact commit intent, and caller-supplied authoritative feedback without components, network behavior, or duplicated wire contracts.

## Application Integration Under Test

- App type: library-only.
- User/caller surface: descriptor value-editor and setting-row consumers plus the separately owned request-state consumer.
- Invocation route: an exact generated-schema-shaped fixture is normalized by the sibling public function, mapped to an editor kind, validated, emitted through the callback only on success, and reconciled through caller-supplied pending/success/error state.
- Wiring owner/module: `web/src/utils/cameraControlDescriptors.ts`, with public policy contracts in `web/src/types/cameraControls.ts`.
- Observable result: exact editor kind, discriminated validation result, zero or one canonical-ID/value callback tuple, and authoritative value retained or replaced according to caller-supplied commit state.
- Integration validation: `web/src/utils/cameraControlDescriptors.test.ts` exercises exported public functions and a type-checked consumer harness using only sibling-owned normalized contracts.

## Manual Smoke

- In the deterministic consumer harness, normalize one integer fixture, validate an aligned value, record its canonical-ID/value tuple, then supply pending and adjusted-success state. Confirm pending keeps the old authoritative value and success displays the driver read-back rather than the candidate. This supplements automated coverage.

## Automated Smoke Tests

- Normalize one descriptor for every supported scalar family and assert its exact editor kind, including labeled and numeric bitmask variants.
- Validate one aligned integer and one sparse menu member, assert one callback tuple for each, and assert invalid or nonwritable candidates emit none.
- Apply pending, adjusted-success, and error commit states and assert the authoritative value is respectively retained, replaced by read-back, and retained.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Verify direct supported-type mappings, labeled versus numeric bitmask selection, defensive `unsupported`, and type-appropriate kind retention when effective state denies editing.
  - Verify `control_not_editable` precedes candidate parsing and every other stable validation code has a deterministic fixture with no failure-branch value.
  - Verify boolean exactness; number finite/integer/safe checks; inclusive integer range and step relative to minimum with default step 1; ordinary-menu index and integer-menu non-null value membership across sparse entries; exact button null; unchanged strings with Unicode code-point length bounds; and bitmask decimal/hex syntax, safe nonnegative range, and bounds.
  - Start with an authoritative labeled bitmask containing unknown set bits, change each known mask in turn, and assert all unknown bits remain unchanged in the whole validated value.
  - Verify callback typing, synchronous return, exact canonical `serialized_id`, exact successful value, and zero calls for denied, unsupported, or invalid results.
  - Verify idle, pending, unchanged success, adjusted success, and error state shapes; success takes caller-supplied read-back, while pending/error preserve the previous authoritative value.
- Integrated route behavior:
  - Pass exact generated-schema-shaped fixtures through `normalizeCameraControlDescriptor`, `getDescriptorEditorKind`, `validateDescriptorValue`, and a public `DescriptorCommitCallback` harness. Assert consumers import normalization-owned types rather than redeclaring them and can consume all public commit-state branches.
- Failure and stale-result behavior, if applicable:
  - Assert malformed or unsupported normalization results never enter the value-policy route; defensive unmapped descriptors fail closed; validation failures expose stable local codes only; commit-state error details omit raw exceptions, device paths, ioctl data, and submitted string values in logs.
  - Assert the public state contract cannot make a pending/failed submitted candidate authoritative. Request identity and stale-result rejection are outside this library child and are represented only by current caller-filtered state input.

## App-Type Proof

- GUI proof:
  - not applicable; concrete visible controls and feedback presentation belong to renderer siblings.
- Console proof:
  - not applicable.
- API/service proof:
  - not applicable; the generated nested descriptor schema supplies fixture authority only.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - tests invoke the exported normalization and value-policy contracts through the exact public consumer route used by named renderer and request-state consumers. Private helper-only tests cannot satisfy this proof.

## Fixtures And Data

- Exact `CameraControlsResponse` nested descriptor fixtures derived from the implemented generated schema and normalized through the sibling public function.
- Successful normalized fixtures for boolean, integer, menu, integer-menu, button, string, labeled bitmask, and numeric bitmask, plus every effective nonwritable condition.
- Boundary variants for non-number, non-finite, fractional, unsafe, minimum/maximum, off-step, missing/non-positive step, sparse-menu holes, integer-menu index/value distinction, button non-null, string code-point length, malformed bitmask syntax, safe integer limits, bounds, and unknown set bits.
- A compile-time/runtime consumer harness that records callback tuples and applies caller-supplied commit states without components, requests, timers, or mutable orchestration state.
- Production-data rule: tests use synthetic generated-schema-shaped descriptors and require no production configuration, database, camera, recording, API server, or physical device.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while independent review is pending.
- [ ] Route-level proof exists for the app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Observable result is asserted or manually checked.
- [ ] Failure behavior is covered where applicable.
