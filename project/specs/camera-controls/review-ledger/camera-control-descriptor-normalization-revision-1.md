# Camera-Control Descriptor Normalization Revision 1

Date: 2026-08-19
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-12fe8d01-86f2-4ad5-9ace-7182f22fa73f`
Revision source: `project/specs/camera-controls/review-ledger/camera-control-descriptor-normalization-review-pass-1.md`
Pass identifier: `camera-control-descriptor-normalization-pass-1`

## Bounded Revision

- Candidate: `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md`
- Paired test specification reread: `project/specs/camera-controls/tests/camera-control-descriptor-normalization.test-spec.md`; no test-contract change was required.
- Assigned child responsibility: unchanged and 100% specified. This candidate owns only wire normalization, effective-state derivation, safe unsupported metadata, and normalization-level verification.
- Direct-parent allocation: unchanged and 100% allocated across the two child definitions recorded in `project/specs/camera-controls/review-ledger/camera-control-descriptor-contracts-review-pass-1.md`.
- Active direct-parent child-artifact coverage: incomplete because `project/specs/camera-controls/camera-control-value-policy.spec.md` is absent.
- Responsibilities uncovered in active child artifacts: editor-kind selection; value validation; validation result and stable-code contracts; commit-intent callback contracts; unknown-bit preservation; and their paired verification.
- Boundary preservation: the normalization candidate does not absorb any absent-sibling responsibility, create another leaf, or change its API, architecture, module, DTO, function, privacy, or verification contract.

## Authorities And Gates

- Architecture anchors: `project/architecture/acd/usb-v4l2-camera-controls.md` and `project/architecture/current-camera-runtime.md`.
- Architecture gap: none.
- Evidence gap: none.
- Shared API dependency: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`; its independently accepted and implemented generated schema must precede final frontend schema binding.
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`, verified SHA-256 `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`.
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`, verified SHA-256 `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`.

## Authoring Result

- Provisional author Review Score: 20.
- Responsibility subtotal: 18.
- Readiness blocker: 1 x 2 = 2 because the exact assigned value-policy sibling artifact is absent and active direct-parent child-artifact coverage is therefore incomplete.
- Cohesion: one pure raw-descriptor-to-normalized-result seam; no independently reachable UI or service route is bundled.
- Split required by this revision: no.
- New leaves: none.
- Independent approval claim: none.

## Files Changed

- `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md`
- `project/specs/camera-controls/review-ledger/camera-control-descriptor-normalization-candidate.md`
- `project/specs/camera-controls/review-ledger/camera-control-descriptor-normalization-revision-1.md`
