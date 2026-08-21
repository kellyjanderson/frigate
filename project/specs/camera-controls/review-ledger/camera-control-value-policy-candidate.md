# Camera-Control Value Policy Candidate Record

Date: 2026-08-19
Status: `awaiting_independent_review`

- Candidate path: `project/specs/camera-controls/camera-control-value-policy.spec.md`
- Lineage/source body: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`, child 2 from `project/specs/camera-controls/review-ledger/camera-control-descriptor-contracts-review-pass-1.md`
- Assigned responsibility: editor-kind selection for normalized supported descriptor types; scalar/menu/bitmask/string/button representation and validation; stable validation result/codes; synchronous canonical-ID/value commit intent; caller-supplied pending/success/error result state; authoritative driver-value reconciliation; unknown-bit preservation; and deterministic policy tests.
- Consumed sibling authority: `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md` owns wire types, normalized descriptor/value/menu/effective-state/result contracts, and normalization utilities; this candidate does not redefine them.
- Architecture anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Scoring authority:
  - Template: `../.agents/process/templates/implementation-spec-template.md`
  - Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
  - Scoring policy: `../.agents/process/specification-review-scoring-policy.md`
  - Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Provisional author Review Score: 19.5
- Paired test specification: `project/specs/camera-controls/tests/camera-control-value-policy.test-spec.md`
- Dependencies/gates:
  - Independent acceptance and implementation of `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md` precede this module extension.
  - Independent acceptance and implementation of the generated descriptor schema owned by `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` precede final frontend schema binding.
  - This author score is an authoring aid only and is not independent approval.
- Architecture gaps: none.
- Evidence gaps: none.
- Parent coverage: 100% across this candidate and the normalization sibling under the recorded two-child allocation.
- Files changed:
  - `project/specs/camera-controls/camera-control-value-policy.spec.md`
  - `project/specs/camera-controls/tests/camera-control-value-policy.test-spec.md`
  - `project/specs/camera-controls/review-ledger/camera-control-value-policy-candidate.md`
