# V4L2 Device Transaction And Identity Foundation Independent Review Pass 1

Date: 2026-08-19
Pass identifier: `v4l2-device-transaction-identity-pass-1`
Result: `revision_required`

## Candidate And Artifacts Reread

- Candidate: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/v4l2-device-transaction-and-identity-foundation.test-spec.md`
- Candidate provenance record: `project/specs/camera-controls/review-ledger/v4l2-device-transaction-and-identity-foundation-candidate.md`
- Direct parent, read only for inherited responsibility and coverage: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
- Parent split record, read only for ownership and coverage: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`
- Proposed direct sibling: `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` (not present on disk during this pass)
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

The author's 21.5 score was treated as untrusted. The implementation-responsibility counts survive adversarial review, including one generic executor method, four explicit models or seams, one cohesive concurrency boundary, and no physical-control write. One readiness blocker is added because the required replacement and invalidation behavior lacks a complete authoritative registry/lifetime contract.

- Functions/methods: 1 x 2 = 2
- Data structures/models: 4 x 1 = 4
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
- Total: **23.5**

## Split Decision And New Leaves

- Split required: `no`.
- New leaves: `none`.
- Cohesion finding: at 23.5 the candidate requires explicit split review. It should remain one leaf because stable identity resolution, per-identity state selection, open/revalidate/operation/close lifetime, cancellation recovery, and invalidation form one transaction-safety invariant and one independently testable public executor boundary. Splitting that invariant would introduce a second ownership boundary inside the same critical section without reducing an independently deliverable responsibility.

## Parent Coverage

- Planned parent coverage: 100% in `v4l2-provider-foundation-pass-1`; every implementation and paired-verification responsibility is assigned exactly once between this candidate and the proposed descriptor-discovery/live-read sibling.
- Current durable child-artifact coverage: incomplete because `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` and its paired test specification were not present on disk during this pass.
- This candidate's ownership coverage: complete for the transaction/identity portion, with no descriptor/read or physical-write responsibility overlap found.
- Uncovered responsibility in the recorded split plan: `none`.

## Findings And Gates

- Revision finding: the candidate requires a stable reference that resolves to changed udev or capability identity to be rejected as a replacement and to invalidate the previous identity state. It defines `_V4L2DeviceState` only as a registry entry keyed by physical identity. Because replacement changes that key, the specification does not define the authoritative configured-reference-digest to prior-physical-identity binding needed to find the old state, the atomic update and lock ordering when old and newly resolved identities differ, or when stale state/locks are retired. An implementation would have to invent concurrency and lifetime behavior for this shared foundation contract.
- Verification impact: the paired test specification requires replacement invalidation and deterministic cache-generation traces, but it cannot assert the missing binding, atomicity, and retirement contract without choosing implementation semantics absent from the feature specification.
- Split fact: no split is required at the independent score of 23.5; the readiness defect is within the cohesive shared state/transaction contract.
- Architecture gap: `none`; the ACD requires stable identity, serialized access, replacement safety, disconnect invalidation, and reconnect validation but leaves this implementation-level registry contract to the specification.
- Evidence gap: `none`; the issue is specification completeness, not missing runtime or hardware evidence.
- Readiness gate: one unresolved implementation-contract blocker; the candidate is not approved.
- Dependency gate: descriptor/read and validated-write consumers depend on this shared identity, state, locking, invalidation, and fixture contract. The descriptor/read sibling artifact was absent during this pass.
