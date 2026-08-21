# V4L2 Camera-Control Validated Write And Read-Back Independent Review Pass 1

Date: 2026-08-19
Pass identifier: `v4l2-validated-write-readback-pass-1`
Result: `revision_required`

## Candidate And Artifacts Reread

- Candidate: `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/v4l2-camera-control-validated-write-readback.test-spec.md`
- Candidate provenance record: `project/specs/camera-controls/review-ledger/v4l2-camera-control-validated-write-readback-candidate.md`
- Direct parent, read only for inherited responsibility and coverage: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
- Parent split record, read only for lineage and coverage: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-review-pass-1.md`
- Foundation prerequisite: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
- Foundation prerequisite review record: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`
- Direct API sibling, read only for consumer-contract ownership: `project/specs/camera-controls/authenticated-camera-control-api.spec.md`
- Direct API sibling split record, read only for consumer-contract ownership: `project/specs/camera-controls/review-ledger/authenticated-camera-control-api-review-pass-1.md`
- Architecture anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`

## Pinned Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b` (verified)
- Scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a` (verified)

## Independent Review Score

The author's score of 21 was treated as untrusted and every category was recounted from the current candidate. The implementation responsibility counts survive adversarial review. The candidate now has one missing-prerequisite event worth two points: its named foundation candidate has independently received `split_required`, while the exact final transaction/identity and descriptor/live-read prerequisite specifications defined by that review do not exist on disk. That is different from a final prerequisite spec that merely awaits implementation.

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
- If total matches prior score, adversarial survival reason: not applicable; the fresh score is two points higher because current prerequisite review state disproves the candidate's final-prerequisite claim.

The score is in the pinned policy's 16 through 24 explicit split-review band. The candidate may remain whole: effective-writability and value validation, optional driver try, exactly-once set, mandatory authoritative read-back, conditional descriptor refresh, and `V4L2ControlWriteResult` construction form one per-device transaction with one mutation and failure boundary. Splitting validation or result construction from that transaction would duplicate the write contract and weaken exactly-once and partial-success verification.

## Split And Coverage Facts

- Split required: `no`.
- New leaves: `none`.
- Split plan: `none`.
- Direct parent coverage: `100%`; this child retains all validation, try/set, mandatory write read-back, modify-layout refresh, write-result, write-failure, and write-verification responsibilities assigned by `v4l2-control-provider-pass-1`.
- Parent responsibilities uncovered: `none`.
- Ownership overlap: `none`; foundation work owns device identity, adapter, transaction/lock, descriptor/read, cache, disconnect, and cancellation contracts, while this candidate owns physical mutation behavior.

## Findings And Gates

- Revision finding: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md` is no longer a final implementable prerequisite. Its independent pass result is `split_required`, and its proposed transaction/identity and descriptor/live-read children have not been written. The candidate's prerequisite list, dependency route, reuse references, progression handling, and paired-test fixture dependencies therefore do not yet point to final prerequisite contracts.
- Consumer contract fact: the API split record assigns the write consumer to a proposed write-API child, but that child does not yet exist. The retained API parent still describes `set_control` as returning one `V4L2ControlDescriptor`, so it is not authority for the candidate's newer `V4L2ControlWriteResult`. This is a downstream dependency fact, not ownership transferred into this candidate.
- Write-result contract: internally complete for this candidate. It names the target descriptor, complete authoritative post-write descriptor snapshot, and descriptor-refresh flag, with target membership and failure behavior covered by the paired test specification.
- Architecture gap: `none`; the ACD defines validated writes, serialized access, mandatory driver read-back, modify-layout refresh, trusted device routing, and safe failure boundaries.
- Evidence gap: `none`; deterministic mocked-adapter verification is sufficient for this library leaf, while physical-camera smoke remains optional and bounded.
- Readiness gate: failed because the named prerequisite is a split-required parent and the final prerequisite leaf specifications are absent.
- Dependency gate: final transaction/identity and descriptor/live-read specifications must exist, be independently approved, and be implemented before this write child can be implemented; the downstream API write contract must consume the finalized `V4L2ControlWriteResult` without redefining it.
- Revision required: `yes`.
