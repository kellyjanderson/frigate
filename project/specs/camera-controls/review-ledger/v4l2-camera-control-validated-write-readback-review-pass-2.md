# V4L2 Camera-Control Validated Write And Read-Back Independent Review Pass 2

Date: 2026-08-19
Pass identifier: `v4l2-validated-write-readback-pass-2`
Result: `revision_required`

## Candidate And Artifacts Reread

- Candidate: `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/v4l2-camera-control-validated-write-readback.test-spec.md`
- Candidate provenance record: `project/specs/camera-controls/review-ledger/v4l2-camera-control-validated-write-readback-candidate.md`
- Revision record: `project/specs/camera-controls/review-ledger/v4l2-camera-control-validated-write-readback-revision-1.md`
- Prior review-pass record, treated only as adversarial history: `project/specs/camera-controls/review-ledger/v4l2-camera-control-validated-write-readback-review-pass-1.md`
- Direct parent, read only for inherited responsibility and coverage: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
- Parent split record, read only for lineage and coverage: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-review-pass-1.md`
- Foundation split record, read only for final prerequisite ownership and coverage: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`
- Existing transaction/identity prerequisite candidate, read only to verify current prerequisite status: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
- Missing descriptor/live-read prerequisite path checked on disk: `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`
- Missing downstream consumer path checked on disk: `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md`
- Architecture anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`

## Pinned Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b` (verified)
- Scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a` (verified)

## Independent Review Score

The revised candidate's score of 23 and every earlier score were treated as untrusted. A fresh recount found no omitted implementation responsibility. The transaction/identity contract, descriptor/live-read contract, and Linux V4L2 operations remain represented by two dependency concerns: the two provider prerequisites form the shared provider dependency boundary, while the Linux operations are accessed through the already-counted reused adapter seam. The unresolved absent descriptor/live-read specification is counted once in the dedicated missing-prerequisite category. It is not counted again as a missing readiness field because the candidate explicitly identifies the exact missing path, dependency order, progression state, and implementation gate.

- Functions/methods: 1 x 2 = 2
- Data structures/models: 1 x 1 = 1
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 1 x 1 = 1
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 6 x 0.5 = 3
- Adding code to an existing library/module: 1 x 1 = 1
- Creating a new reusable library/module: 0 x 3 = 0
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 1 x 3 = 3
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 1 x 2 = 2
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **23**
- If total matches prior score, adversarial survival reason: the revised text preserves the independently reviewed implementation counts, replaces the obsolete split-required foundation prerequisite with the exact final child contracts, and truthfully retains one missing-prerequisite event for the descriptor/live-read specification that is still absent on disk.

The score is in the pinned policy's 16 through 24 explicit split-review band. The candidate remains cohesive because value validation, optional driver try, exactly-once set, mandatory authoritative read-back, conditional descriptor refresh, and `V4L2ControlWriteResult` construction are one serialized physical-device transaction with one mutation and partial-success boundary. Separating any of these responsibilities would duplicate the write contract or make either child independently undeliverable.

## Split And Coverage Facts

- Split required: `no`.
- New leaves: `none`.
- Split plan: `none`.
- Direct parent coverage: `100%`; this child retains all validation, try/set, mandatory write read-back, modify-layout refresh, write-result, write-failure, and write-verification responsibilities assigned by `v4l2-control-provider-pass-1`.
- Parent responsibilities uncovered: `none`.
- Ownership overlap: `none`; transaction/identity owns configured identity, adapter/error primitives, transaction/lock, invalidation, reconnect, cancellation, and shared foundation fixtures; descriptor/live-read owns descriptors, cache, enumeration, grouped reads, and read fixtures; this candidate exclusively owns physical control mutation and its authoritative write result.

## Findings And Gates

- Revision finding resolved: `yes`; the revised candidate and paired test now name the exact transaction/identity and descriptor/live-read final prerequisite paths and assign their ownership, reuse, fixtures, and dependency order consistently.
- Remaining prerequisite fact: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` exists as a proposed split child with status `awaiting_independent_review` and is not implemented.
- Remaining prerequisite gap: `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` does not exist on disk. Its final contract, paired verification, approval, and implementation are therefore unavailable to this dependent write child.
- Downstream contract fact: `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md` does not exist on disk. The candidate truthfully reserves API ownership and requires that eventual consumer to use `V4L2ControlWriteResult` without redefining it.
- Write-result contract: complete within this candidate; it defines the target descriptor, complete authoritative post-write snapshot, descriptor-refresh flag, target membership, categorized failure behavior, and matching paired-test assertions.
- Architecture gap: `none`; the ACD supplies the validated-write, trusted-device, serialization, mandatory read-back, modify-layout refresh, safe-failure, and performance boundaries used here.
- Evidence gap: `none`; deterministic mocked-adapter route verification is sufficient for this library leaf, and the optional hardware smoke is bounded and restorative.
- Readiness gate: failed because a final prerequisite specification is absent and the existing transaction/identity prerequisite is neither independently approved nor implemented.
- Dependency gate: transaction/identity must be independently approved and implemented; descriptor/live-read must exist as a final specification, be independently approved, and be implemented before this write child can be implemented.
- Revision required: `yes`.
