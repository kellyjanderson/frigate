# Camera-Control API Shared Foundation Candidate Record

Date: 2026-08-19
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-8ee703ca-ae37-4573-a6e9-fcfde3580ed9`

## Candidate

- Candidate path: `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md`
- Paired test-spec path: `project/specs/camera-controls/tests/camera-control-api-shared-foundation.test-spec.md`
- Lineage/source body: child 1 of `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`, assigned by independent split record `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-api-review-pass-1.md` pass `authenticated-camera-control-read-api-pass-1`.
- Assigned responsibility: shared camera-control API router and administrator dependency, configured-camera guard, common wire/error contracts, complete provider-error translation, provider composition/acquisition and one-call delegation seam, response/log redaction, camera-router inclusion, OpenAPI/auth annotation foundation, and deterministic shared tests. Descriptor and selected-value GET behavior, mutations, provider implementation, and frontend work are excluded.

## Authorities And Gates

- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Final provider prerequisites:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - independently approved and not yet implemented.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - independently approved and not yet implemented.
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority verification: both supplied fingerprints matched the files read during authoring.
- Architecture gap: none identified in the bounded independent review facts or this authoring pass.
- Evidence gap: none identified; the ACD, current runtime, parent candidate/test, split record, and final provider leaves define the assigned contract.

## Authoring Result

- Provisional author Review Score: `21.5`.
- Parent independent review fact: `26.5`, result `split_required`, pass `authenticated-camera-control-read-api-pass-1`.
- Split coverage: `100%` assigned across this shared-foundation child and `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`; no parent responsibility is unassigned.
- Cohesion fact: the score is in the explicit split-review range, and the candidate remains one shared API foundation because router/auth/configured-camera/provider acquisition/error translation are jointly consumed and verified by both endpoint families.
- Inter-child dependency: the read-endpoint sibling consumes this child's router, provider instance, configured-camera resolver, administrator convention, error envelope, and translation operation without redefining them; its bounded-value handler must call `V4L2ControlProvider.get_control_values`.
- Separate ownership: write endpoints and write-route proof remain outside this child; the earlier original-parent write sibling was absent during the prior review pass.
- Independent approval: not claimed; this record is awaiting a fresh independent review.

## Files Changed

- `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md`
- `project/specs/camera-controls/tests/camera-control-api-shared-foundation.test-spec.md`
- `project/specs/camera-controls/review-ledger/camera-control-api-shared-foundation-candidate.md`
