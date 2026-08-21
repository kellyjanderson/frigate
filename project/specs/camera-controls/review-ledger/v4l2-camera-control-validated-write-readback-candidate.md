# V4L2 Camera-Control Validated Write And Read-Back Candidate Record

Date: 2026-08-19
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-ccaa55e8-fe8c-4918-bf1e-48a381db513f`

## Candidate

- Candidate path: `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`
- Paired test-spec path: `project/specs/camera-controls/tests/v4l2-camera-control-validated-write-readback.test-spec.md`
- Lineage/source body: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`, split by `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-review-pass-1.md` pass `v4l2-control-provider-pass-1`
- Assigned responsibility: extend the final descriptor/live-read provider with individual-control validation, optional driver try, exactly-once set, serialized mandatory read-back, clamping and coupled-state propagation, modify-layout refresh, write failure categories, and deterministic write-route tests; reuse and do not redefine the final transaction/identity or descriptor/live-read contracts; exclude HTTP/API behavior.
- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Final prerequisite paths defined by `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`
- Downstream API write contract: `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md` must consume `V4L2ControlWriteResult` without redefining it.
- Parent coverage: 100% planned across this child and the two final foundation children; uncovered parent responsibilities: none.

## Pinned Scoring Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Fingerprints verified before author scoring: yes.

## Authoring Result

- Provisional author Review Score: 23.
- Authoring interpretation: explicit split review is required for a score from 16 through 24. The child is presented as cohesive because validation, exactly-once set, mandatory read-back, and the write result are one serialized transaction and failure boundary. This is an authoring aid, not independent approval.
- Architecture gap: none in the supplied bounded review facts.
- Evidence gap: none in the supplied bounded review facts.
- Dependency gate: the transaction/identity candidate exists with status `awaiting_independent_review` but is unimplemented; the descriptor/live-read final specification remains absent. Both must be independently approved and implemented in order before this child. The downstream API write contract must consume the finalized provider `V4L2ControlWriteResult` without redefining it.
- Candidate status: `awaiting_independent_review`.
- Independent review passes claimed: none.

## Files Changed

- `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`
- `project/specs/camera-controls/tests/v4l2-camera-control-validated-write-readback.test-spec.md`
- `project/specs/camera-controls/review-ledger/v4l2-camera-control-validated-write-readback-candidate.md`
- `project/specs/camera-controls/review-ledger/v4l2-camera-control-validated-write-readback-revision-1.md`
