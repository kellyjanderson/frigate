# Camera-Control Descriptor Wire Normalization And Effective State Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md`
Feature spec canonical status: Split child awaiting independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify that the public frontend normalization boundary maps exact authenticated read API descriptor fixtures to safe typed descriptors and capability-reducing effective state, while malformed and unsupported inputs fail closed without exposing sensitive payload content.

## Application Integration Under Test

- App type: library-only.
- User/caller surface: the value-policy and descriptor renderer sibling modules.
- Invocation route: one exact API-shaped nested descriptor passes through `normalizeCameraControlDescriptor`, then a public-contract consumer branches on the discriminated result and reads normalized descriptor/effective-state data only from the success branch.
- Wiring owner/module: `web/src/utils/cameraControlDescriptors.ts`, with contracts in `web/src/types/cameraControls.ts`.
- Observable result: one complete safe normalized descriptor with effective active/writable/read-supported state or one privacy-safe unsupported result with no writable capability.
- Integration validation: `web/src/utils/cameraControlDescriptors.test.ts` invokes the exported function and a type-checked consumer harness with fixtures derived from the implemented generated nested API schema.

## Manual Smoke

- In the deterministic consumer harness, normalize one supported integer descriptor and inspect its canonical ID, scalar/range metadata, and writable effective state. Repeat with one payload-bearing descriptor and confirm the result is unsupported, has no writable capability, and contains no raw payload or device-path data.

## Automated Smoke Tests

- Normalize one boolean, integer, sparse menu, and bitmask API fixture and assert exact safe identity, scalar/menu metadata, structural support, and effective state.
- Normalize disabled, inactive, read-only, grabbed, and backend-nonwritable variants and assert every contradiction reduces capability.
- Normalize one unknown payload-bearing descriptor and assert the safe unsupported reason/metadata contract, raw payload omission, and absence of writable capability.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Verify every required API field and scalar encoding for boolean, integer, menu, integer-menu, button, string, bitmask, integer64, unknown, payload-bearing, compound, and array descriptors.
  - Verify canonical serialized IDs; finite safe integer requirements; nullable/applicable bounds, defaults and current values; sparse menu indexes and integer-menu values; complete flags; element size/count; dimensions; and backend active/writable/read-supported fields.
  - Verify effective active/writable/read-supported and explicit disabled/inactive/read-only/grabbed reasons for every applicable backend/flag combination, including contradictory inputs.
  - Verify malformed required fields, duplicate or malformed menu entries, unsafe numbers, contradictory scalar/type pairs, unsupported families, and unrepresentable values fail closed with stable normalization reasons.
- Integrated route behavior:
  - Pass exact implemented generated-schema fixtures through the exported function and a public type-only consumer. Prove the value-policy sibling can import and consume successful descriptors without redefining the wire schema, and prove both result branches are handled.
- Failure and stale-result behavior, if applicable:
  - Assert unsupported results expose no writable capability and omit raw byte/compound/array payloads, device paths, ioctl content, authentication details, and raw server exceptions.
  - Stale-result behavior is not applicable because normalization is synchronous, pure, stateless, and owns no request lifecycle.

## App-Type Proof

- GUI proof:
  - not applicable; visible components belong to renderer siblings.
- Console proof:
  - not applicable.
- API/service proof:
  - not applicable; the API owns server routes and its generated nested descriptor schema supplies fixtures here.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - tests invoke the exported function and public contracts through the exact raw-descriptor-to-normalized-result seam consumed by the value-policy and renderer siblings. Private parser tests cannot satisfy this proof.

## Fixtures And Data

- Exact `CameraControlsResponse` nested descriptor fixtures derived from the implemented generated OpenAPI schema, covering every supported and unsupported control family.
- Boundary variants for lower and upper safe integers, nullable/applicable scalar metadata, sparse menu holes, duplicate indexes, all relevant flags, contradictory backend capability fields, dimensions, element metadata, and malformed values.
- Privacy fixtures containing raw byte, compound, array, device-path, ioctl, authentication, and raw exception-like content that must not survive normalization.
- A consumer harness that imports only the public normalization contracts and contains no API mock, React component, editor policy, timer, request state, or physical-device behavior.
- Production-data rule: tests use deterministic synthetic descriptors and require no production configuration, database, camera, recording, API server, or device path.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while independent split-child review remains outstanding.
- [ ] Route-level proof exists for the library-only app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Both normalized-success and unsupported observable results are asserted or manually checked.
- [ ] Effective-state contradictions, malformed/unsupported handling, and privacy omissions are covered.
