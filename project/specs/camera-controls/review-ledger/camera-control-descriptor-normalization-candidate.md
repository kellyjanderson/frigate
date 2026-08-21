# Camera-Control Descriptor Wire Normalization And Effective State Candidate Record

Date: 2026-08-19
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-06a8b627-53ee-4fc0-9cb9-330f7cec5e4a`

## Candidate

- Candidate path: `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md`
- Paired test-spec path: `project/specs/camera-controls/tests/camera-control-descriptor-normalization.test-spec.md`
- Lineage/source body: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
- Parent paired test specification: `project/specs/camera-controls/tests/camera-control-descriptor-contracts.test-spec.md`
- Split-plan record: `project/specs/camera-controls/review-ledger/camera-control-descriptor-contracts-review-pass-1.md`
- Earlier renderer split record: `project/specs/camera-controls/review-ledger/descriptor-control-renderer-review-pass-1.md`
- Assigned responsibility: own the authoritative frontend descriptor, menu-item, scalar, effective-state, and normalization-result contracts derived from the final authenticated read API schema; supported/unsupported structural discrimination; exact API-wire normalization; capability-reducing active/writable/read-supported state; fail-closed malformed and unsupported handling; privacy-safe unsupported results; and normalization/effective-state tests. Editor-kind selection, value validation, commit contracts, components, API orchestration, and camera-view composition are excluded.

## Architecture And Dependencies

- Architecture anchor: `project/architecture/acd/usb-v4l2-camera-controls.md`
- Current-runtime anchor: `project/architecture/current-camera-runtime.md`
- Shared API contract dependency: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`; final frontend schema binding follows its independent acceptance and implementation.
- Assigned child responsibility coverage: 100% of normalization and effective-state behavior is specified by this candidate and its paired test specification.
- Direct-parent allocation: 100% remains allocated across this candidate and the exact value-policy sibling definition in the recorded two-child split plan.
- Active direct-parent child-artifact coverage: 100% across this candidate and the existing independently approved `project/specs/camera-controls/camera-control-value-policy.spec.md` sibling.
- Uncovered responsibilities in active child artifacts: none. The approved sibling owns editor-kind selection, value validation, validation result and stable-code contracts, commit-intent callback contracts, unknown-bit preservation, and their paired verification.
- Original UI-parent aggregate coverage is outside this assigned child body and does not alter the complete two-child coverage of this candidate's direct parent.
- Parent independent review fact: score 28, result `split_required`, pass `camera-control-descriptor-contracts-pass-1`.
- Review finding carried forward: four named public result/kind/callback contracts were omitted from the unsplit parent's author recount; the exact split assigns only `DescriptorNormalizationResult` to this child and assigns editor-kind, validation-result, and callback contracts to the value-policy sibling.
- Architecture gap: none reported by the bounded independent review or found in this authoring pass.
- Evidence gap: none reported by the bounded independent review or found for deterministic schema-shaped normalization verification.

## Pinned Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Implementation-spec template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Specification-review scoring policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority verification: both local files matched the supplied fingerprints before authoring and scoring.

## Authoring Result

- Provisional author Review Score: 18
- Author split-threshold result: explicit 16 through 24 cohesion review is recorded in the candidate; no further author-side split was created.
- Candidate coverage: 100% of the assigned normalization/effective-state responsibility and 100% active direct-parent coverage together with the independently approved value-policy sibling.
- Uncovered assigned responsibilities: none.
- Independent approval claim: none. This candidate awaits fresh independent review.

## Files Changed

- `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md`
- `project/specs/camera-controls/review-ledger/camera-control-descriptor-normalization-candidate.md`
- `project/specs/camera-controls/review-ledger/camera-control-descriptor-normalization-revision-2.md`
