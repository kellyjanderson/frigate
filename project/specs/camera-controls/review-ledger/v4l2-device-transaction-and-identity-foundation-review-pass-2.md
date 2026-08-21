# V4L2 Device Transaction And Identity Foundation Independent Review Pass 2

Date: 2026-08-19
Pass identifier: `v4l2-device-transaction-identity-pass-2`
Result: `revision_required`

## Candidate And Artifacts Reread

- Candidate: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/v4l2-device-transaction-and-identity-foundation.test-spec.md`
- Candidate provenance record: `project/specs/camera-controls/review-ledger/v4l2-device-transaction-and-identity-foundation-candidate.md`
- Revision record: `project/specs/camera-controls/review-ledger/v4l2-device-transaction-and-identity-foundation-revision-1.md`
- Prior independent review evidence, treated as untrusted historical input: `project/specs/camera-controls/review-ledger/v4l2-device-transaction-and-identity-foundation-review-pass-1.md`
- Direct parent, read only for inherited responsibility and coverage: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
- Parent split record, read only for ownership and coverage: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`
- Proposed direct sibling: `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` (not present on disk during this pass)
- Proposed sibling paired test: `project/specs/camera-controls/tests/v4l2-descriptor-discovery-and-live-read-provider.test-spec.md` (not present on disk during this pass)
- Existing write sibling, read only for dependency and ownership boundaries: `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`
- Architecture anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`

## Pinned Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b` (verified)
- Scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a` (verified)

## Independent Review Score

The author's 22.5 score and the prior pass's 23.5 score were treated as untrusted. The revised implementation-responsibility counts survive adversarial review: one generic executor method; five explicit foundation models or seams; one cohesive concurrency boundary; and no descriptor, live-read, or physical-control-write responsibility. One readiness blocker is counted because the candidate states that parent coverage is complete and checks the split-coverage readiness item even though the descriptor-discovery/live-read child and its paired test do not exist as durable artifacts.

- Functions/methods: 1 x 2 = 2
- Data structures/models: 5 x 1 = 5
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 1 x 1 = 1
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 1 x 0.5 = 0.5
- Adding code to an existing library/module: 1 x 1 = 1
- Creating a new reusable library/module: 1 x 3 = 3
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 1 x 2 = 2
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **24.5**

## Split Decision And New Leaves

- Split required: `no`.
- New leaves: `none`.
- Cohesion finding: at 24.5 the candidate remains in the explicit split-review band. Stable configured-reference binding, physical-identity state selection, deterministic prior/candidate lock ordering, open/revalidate/operation/close lifetime, cancellation recovery, invalidation, and lease-safe retirement form one transaction-safety invariant behind one independently testable executor boundary. Splitting it would divide one critical-section contract without creating independently deliverable behavior.

## Parent Coverage

- Planned parent coverage: 100% in `v4l2-provider-foundation-pass-1`; every parent implementation and paired-verification responsibility is assigned exactly once in the recorded split plan.
- Current durable child-artifact coverage: incomplete because `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` and `project/specs/camera-controls/tests/v4l2-descriptor-discovery-and-live-read-provider.test-spec.md` are absent.
- This candidate's ownership coverage: complete for configured identity, adapter/error primitives, transaction and lock lifetime, invalidation, reconnect, cancellation, privacy, and shared foundation fixtures.
- Uncovered responsibility in the recorded split plan: `none`; the defect is the candidate's inaccurate claim of complete current child-artifact coverage, not an omitted split-plan responsibility.

## Findings And Gates

- Revision-contract finding: the revised `_V4L2IdentityRegistry` contract resolves the prior pass's implementation ambiguity. It defines the configured-reference digest to accepted physical-identity binding, binding-version snapshot and recheck, ascending prior/candidate device-lock ordering, atomic fail-closed replacement invalidation without rebinding, lease coverage, repeated replacement rejection, and stale unbound state retirement. The paired test specification now deterministically covers these contracts.
- Revision finding: `## Split Coverage`, `## Source Field Carryover`, and the checked split-coverage readiness item represent parent coverage as complete even though the required descriptor-discovery/live-read child and paired test artifacts are absent. The candidate's provenance may retain 100% planned assignment, but its current durable coverage and readiness claims are not truthful.
- Split fact: no split is required at the independent score of 24.5; no new leaf is defined by this pass.
- Architecture gap: `none`; the supplied ACD and current-runtime anchor sufficiently define the stable identity, serialization, failure, and bounded runtime evidence used by this leaf.
- Evidence gap: `none`; artifact absence and the resulting readiness inconsistency are directly verifiable from the current workspace.
- Readiness gate: one parent-coverage truthfulness blocker; the candidate is not approved.
- Dependency gate: descriptor/read and validated-write consumers depend on the revised shared identity, state, locking, invalidation, reconnect, cancellation, and fixture contracts. The descriptor-discovery/live-read child and paired test remain absent.
