# Camera-Control Descriptor Contracts Candidate Record

Date: 2026-08-19
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-156a9baf-6919-4fdc-bba8-790ff675f0c2`

## Candidate

- Candidate path: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/camera-control-descriptor-contracts.test-spec.md`
- Lineage/source body: `project/specs/camera-controls/descriptor-control-renderer.spec.md`
- Split-plan record: `project/specs/camera-controls/review-ledger/descriptor-control-renderer-review-pass-1.md`
- Assigned responsibility: own the frontend typed camera-control descriptor, menu item, value, effective state, supported-type discrimination, editor callback/result contracts, explicit mapping to the final authenticated read/shared API wire contract, normalization, fail-closed unknown/unsupported semantics, and contract-level tests. Concrete editors, row presentation, API orchestration, and camera-view composition are excluded.

## Architecture And Dependencies

- Architecture anchor: `project/architecture/acd/usb-v4l2-camera-controls.md`
- Current-runtime anchor: `project/architecture/current-camera-runtime.md`
- Shared API contract dependency: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- Parent candidate coverage: 100% covered by the three-child split plan.
- Original UI-parent coverage fact: incomplete/ambiguous because no durable split record names every child and composition/orchestration sibling paths are absent from that parent record.
- Architecture gap: none reported by independent pass `descriptor-control-renderer-pass-1`.
- Evidence gap: none reported by independent pass `descriptor-control-renderer-pass-1`.

## Pinned Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Implementation-spec template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Specification-review scoring policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority verification: both local files matched the supplied fingerprints before authoring and scoring.

## Authoring Result

- Provisional author Review Score: 24
- Author split-threshold result: explicit 16 through 24 cohesion review recorded in the candidate; no author-side child split created.
- Independent approval claim: none. The candidate requires a fresh independent review.

## Files Changed

- `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
- `project/specs/camera-controls/tests/camera-control-descriptor-contracts.test-spec.md`
- `project/specs/camera-controls/review-ledger/camera-control-descriptor-contracts-candidate.md`
