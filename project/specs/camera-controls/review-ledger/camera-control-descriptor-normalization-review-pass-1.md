# Camera-Control Descriptor Normalization Independent Review Pass

Date: 2026-08-19
Pass identifier: `camera-control-descriptor-normalization-pass-1`
Result: `revision_required`
Candidate: `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md`

## Artifacts Reread

- Candidate: `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/camera-control-descriptor-normalization.test-spec.md`
- Candidate record: `project/specs/camera-controls/review-ledger/camera-control-descriptor-normalization-candidate.md`
- Direct parent: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
- Direct parent split record: `project/specs/camera-controls/review-ledger/camera-control-descriptor-contracts-review-pass-1.md`
- Shared API contract dependency: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- Assigned value-policy sibling: `project/specs/camera-controls/camera-control-value-policy.spec.md` (absent from disk during this pass)
- Architecture anchor: `project/architecture/acd/usb-v4l2-camera-controls.md`
- Current-runtime anchor: `project/architecture/current-camera-runtime.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`

## Pinned Scoring Authorities

- Template path: `../.agents/process/templates/implementation-spec-template.md`
- Supplied template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Verified template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Scoring-policy path: `../.agents/process/specification-review-scoring-policy.md`
- Supplied scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Verified scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority status: exact match; scoring is valid.

## Independent Review Score

The candidate's recorded 18 was treated as an untrusted claim. The independent recount confirms the candidate's responsibility inventory but adds one readiness blocker because the exact assigned value-policy sibling does not exist on disk. The candidate therefore cannot substantiate its claim that the direct parent's responsibilities are 100% covered by active children.

- Functions/methods: 1 x 2 = 2
  - `normalizeCameraControlDescriptor`
- Data structures/models: 5 x 1 = 5
  - `CameraControlValue`
  - `CameraControlMenuItem`
  - `CameraControlDescriptor`
  - `DescriptorControlState`
  - `DescriptorNormalizationResult`
- Dependencies/services: 1 x 1 = 1
  - authenticated read API descriptor contract
- Returns/outputs/signals: 1 x 1 = 1
  - discriminated normalization result
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 0 x 0.5 = 0
- Adding code to an existing library/module: 0 x 1 = 0
- Creating a new reusable library/module: 2 x 3 = 6
  - `web/src/types/cameraControls.ts`
  - `web/src/utils/cameraControlDescriptors.ts`
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 0 x 3 = 0
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
  - fail-closed unsafe input handling and omission of raw payload, path, ioctl, authentication, and exception content
- Performance-sensitive behavior: 0 x 2 = 0
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 1 x 2 = 2
  - direct-parent coverage cannot be verified while the exact assigned value-policy sibling is absent
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **20**
- Prior-score survival result: the responsibility-only subtotal remains 18; the current total is 20 because the parent-coverage readiness claim is not supported by the current sibling artifact set.

## Split And Cohesion Decision

- Split required: no.
- New leaves: none.
- Cohesion: the normalization function, five public contracts, effective-state derivation, privacy boundary, and their fixtures form one independently testable raw-descriptor-to-normalized-result seam. The two new modules are jointly required by that seam, and no independently reachable UI or service route is bundled into this candidate.
- Score-band decision: the score is in the policy's 16 through 24 explicit-review band, but another split would separate contracts that must change and be verified together. The readiness defect is parent-coverage evidence, not excessive implementation scope.

## Parent Coverage

- Assigned child responsibility coverage: 100% of wire normalization and effective-state derivation is specified by this candidate and its paired test specification.
- Direct-parent allocation: the parent split record assigns 100% of the parent responsibilities between this candidate and the value-policy child definition.
- Active direct-parent artifact coverage: incomplete. `project/specs/camera-controls/camera-control-value-policy.spec.md` was the exact sibling path supplied for this pass and was absent from disk.
- Uncovered direct-parent responsibilities in active child artifacts: editor-kind selection, value validation, validation result and stable-code contracts, commit-intent callback contracts, unknown-bit preservation, and their paired verification.
- Original UI-parent aggregate coverage: remains incomplete/ambiguous outside this candidate's bounded ownership, as recorded by the direct parent split record. It does not add another score event to this child.

## Findings And Gates

- Revision finding: the candidate's `Split Coverage` and source-provenance statements claim 100% direct-parent coverage across this child and `camera-control-value-policy.spec.md`, but that sibling artifact does not exist. The claim is not truthful against the current files.
- Architecture gate: sufficient. The ACD defines descriptor metadata, driver authority, capability-reducing state, and fail-closed handling.
- Evidence gate: no factual evidence gap blocks deterministic normalization verification.
- Readiness gate: not satisfied because active direct-parent child coverage is incomplete.
- Dependency gate: the authenticated read API is specified and remains an explicit unimplemented prerequisite whose independently accepted and implemented generated schema must precede final frontend schema binding.
- Verification gate: the paired test specification covers the public library route, effective-state contradictions, malformed and unsupported inputs, exact schema fixtures, and privacy omission without production data.
- Architecture gaps: none.
- Evidence gaps: none.
