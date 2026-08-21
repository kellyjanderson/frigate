# Camera-Control Descriptor Normalization Revision 2

Date: 2026-08-19
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-06a8b627-53ee-4fc0-9cb9-330f7cec5e4a`
Revision source: `project/specs/camera-controls/review-ledger/camera-control-descriptor-normalization-review-pass-3.md`
Pass identifier: `camera-control-descriptor-normalization-pass-3`

## Bounded Revision

- Candidate: `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md`
- Paired test specification reread: `project/specs/camera-controls/tests/camera-control-descriptor-normalization.test-spec.md`; its verification contract remains aligned and required no edit.
- Assigned child responsibility: unchanged and 100% specified. This candidate owns only wire normalization, effective-state derivation, safe unsupported metadata, and normalization-level verification.
- Direct-parent coverage: 100% across this candidate and the existing independently approved `project/specs/camera-controls/camera-control-value-policy.spec.md` sibling under the two-child allocation recorded in `project/specs/camera-controls/review-ledger/camera-control-descriptor-contracts-review-pass-1.md`.
- Responsibilities uncovered in active child artifacts: none.
- Boundary preservation: the approved sibling continues to own editor-kind selection, value validation, validation result and stable-code contracts, commit-intent and feedback contracts, authoritative reconciliation, unknown-bit preservation, and their paired verification. This revision does not absorb those responsibilities, split the normalization seam, or add a leaf.
- Refinement state: pass 3 created no new leaves, so the candidate records the latest fixed-point leaf state while remaining proposed and awaiting fresh independent review.

## Authorities And Gates

- Architecture anchors: `project/architecture/acd/usb-v4l2-camera-controls.md` and `project/architecture/current-camera-runtime.md`.
- Architecture gap: none.
- Evidence gap: none.
- Inter-child dependency: descriptor-normalization independent acceptance and implementation precede the value-policy sibling's extension of the shared modules.
- Shared API dependency: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`; its independently accepted and implemented generated schema must precede final frontend schema binding.
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`, verified SHA-256 `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`.
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`, verified SHA-256 `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`.

## Authoring Result

- Provisional author Review Score: 18.
- Responsibility subtotal: 18.
- Readiness blockers: 0.
- Missing prerequisites: 0 scoring events. The two implementation-order dependencies remain explicit gates.
- Unresolved deferral/gap markers: 0.
- Cohesion: one pure raw-descriptor-to-normalized-result seam in the same two public modules, with no independently reachable UI, service, mutation, or async lifecycle bundled.
- Split required by this revision: no.
- New leaves: none.
- Independent approval claim: none.

## Files Changed

- `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md`
- `project/specs/camera-controls/review-ledger/camera-control-descriptor-normalization-candidate.md`
- `project/specs/camera-controls/review-ledger/camera-control-descriptor-normalization-revision-2.md`
