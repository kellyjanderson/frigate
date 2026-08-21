# V4L2 Camera-Control Validated Write And Read-Back Revision 1

Date: 2026-08-19
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-ccaa55e8-fe8c-4918-bf1e-48a381db513f`
Review pass addressed: `v4l2-validated-write-readback-pass-1`

## Bounded Revision

- Replaced the split-required provider-foundation parent as a prerequisite with the two exact final child paths defined by `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`.
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`
- Updated candidate dependencies, ownership exclusions, reuse routes, fixture sources, progression handling, and paired-test dependencies to distinguish transaction/identity authority from descriptor/live-read authority.
- Preserved the readiness failure truth under concurrent authoring: the transaction/identity candidate now exists with status `awaiting_independent_review`, while the descriptor/live-read final specification remains absent. Both must be independently approved and implemented in dependency order before this write child.
- Recorded the downstream contract boundary: `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md` must consume `V4L2ControlWriteResult` without redefining it.
- Created no new leaves and changed no architecture, implementation, review-pass evidence, or other candidate ledger record.

## Authoring Score

- Provisional author Review Score: 23.
- Scoring interpretation: the independent pass's implementation counts survive adversarial recount, and one missing-prerequisite event remains for the absent descriptor/live-read specification. The score stays in the explicit split-review band, while the write candidate remains cohesive as one exactly-once mutation, mandatory read-back, and result-construction transaction.
- Independent approval claimed: none.

## Pinned Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Fingerprints verified before revision scoring: yes.

## Files Changed

- `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`
- `project/specs/camera-controls/tests/v4l2-camera-control-validated-write-readback.test-spec.md`
- `project/specs/camera-controls/review-ledger/v4l2-camera-control-validated-write-readback-candidate.md`
- `project/specs/camera-controls/review-ledger/v4l2-camera-control-validated-write-readback-revision-1.md`
