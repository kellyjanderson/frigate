# Camera-Control Descriptor Contracts Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
Feature spec canonical status: Split child pending independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify that the public frontend descriptor contracts map exact authenticated read API fixtures to safe effective state, deterministic editor discrimination, validated scalar commit values, and fail-closed unsupported results without components or network behavior.

## Application Integration Under Test

- App type: library-only.
- User/caller surface: the accessible value-editor and descriptor-setting-row sibling components.
- Invocation route: one exact API-shaped fixture passes through normalization, editor-kind discrimination, and candidate validation before a consumer invokes the typed commit callback.
- Wiring owner/module: `web/src/utils/cameraControlDescriptors.ts`, with contracts in `web/src/types/cameraControls.ts`.
- Observable result: a normalized descriptor or unsupported result, exact editor kind, typed validation result, effective capability state, and exact callback tuple.
- Integration validation: `web/src/utils/cameraControlDescriptors.test.ts` invokes the exported public functions and a type-checked consumer harness using generated-schema-shaped fixtures.

## Manual Smoke

- In the deterministic consumer harness, normalize one integer descriptor from a captured generated-schema fixture, validate an aligned value, and inspect the recorded canonical-ID/integer callback tuple. Repeat with one payload-bearing descriptor and confirm there is no editable kind or commit value. This supplements automated coverage.

## Automated Smoke Tests

- Normalize one boolean, integer, sparse menu, and bitmask API fixture and assert exact safe identity, value, effective state, and editor kind.
- Validate one correct integer value and assert the consumer records one canonical serialized ID and integer callback value.
- Normalize one unknown payload-bearing descriptor and assert `unsupported`, safe metadata retention, raw payload omission, and no valid commit result.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Verify every required API field and scalar encoding for boolean, integer, menu, integer-menu, button, string, bitmask, integer64, unknown, payload-bearing, compound, and array descriptors.
  - Verify canonical IDs, finite safe integers, nullable/applicable bounds, sparse menu indexes and integer-menu values, flag combinations, dimensions, backend active/writable/read-supported fields, and capability-reducing contradictions.
  - Verify editor kinds for every supported type and `unsupported` for malformed, integer64, payload, element-array, compound, unknown, or unrepresentable values.
  - Verify inclusive range, step relative to minimum, default step normalization, ordinary/integer-menu membership, string constraints, boolean exactness, button null, decimal/hex bitmasks, safe-integer limits, and preservation of unknown set bits.
- Integrated route behavior:
  - Pass an exact generated-schema-shaped fixture through all three exported functions and a public `DescriptorCommitCallback` harness. Assert one exact tuple only for `{ok: true, value}` and prove the named renderer consumers can import the same contracts without redefining them.
- Failure and stale-result behavior, if applicable:
  - Assert stable local failure codes and absence of a commit value for malformed fields, unsafe integers, mismatched scalar types, out-of-range/off-step/absent-menu candidates, invalid strings/bitmasks, denied effective state, and unsupported type.
  - Assert raw byte/compound payloads, device paths, ioctl content, and raw server exceptions never appear in normalized or validation results.

## App-Type Proof

- GUI proof:
  - not applicable; concrete visible components belong to renderer siblings.
- Console proof:
  - not applicable.
- API/service proof:
  - not applicable; the API owns server routes, while its generated nested descriptor schema supplies fixtures here.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - tests invoke the exported contracts and functions through the exact normalization-to-callback consumer route used by the named renderer siblings. Private helper-only tests cannot satisfy this proof.

## Fixtures And Data

- Exact `CameraControlsResponse` nested descriptor fixtures derived from the implemented generated OpenAPI schema, covering every supported and unsupported control family.
- Boundary variants for lower/upper safe integers, minimum/maximum, positive/missing/non-positive step, sparse menu holes, integer-menu value versus index, string length, unknown bitmask bits, every effective flag, contradictory backend state, dimensions, and malformed values.
- A consumer harness that imports only public contracts, records callback tuples, and contains no API mock, React component, timer, or mutable request state.
- Production-data rule: tests use synthetic generated-schema-shaped descriptors and require no production configuration, database, camera, recording, API server, or physical device.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while aggregate split review remains recorded by the parent review process.
- [ ] Route-level proof exists for the app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Observable result is asserted or manually checked.
- [ ] Failure behavior is covered where applicable.
