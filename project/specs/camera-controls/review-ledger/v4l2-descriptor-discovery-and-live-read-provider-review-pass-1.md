# V4L2 Descriptor Discovery And Live-Read Provider Independent Review Pass 1

Date: 2026-08-19
Pass identifier: `v4l2-descriptor-discovery-live-read-pass-1`
Result: `approved`

## Candidate And Artifacts Reread

- Candidate: `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/v4l2-descriptor-discovery-and-live-read-provider.test-spec.md`
- Candidate provenance record: `project/specs/camera-controls/review-ledger/v4l2-descriptor-discovery-and-live-read-provider-candidate.md`
- Direct parent split record, read only for inherited responsibility and coverage: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`
- Direct sibling prerequisite, read only for ownership and dependency: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
- Write-contract authority, read only for ownership and dependency: `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`
- Architecture anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`

## Pinned Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b` (verified)
- Scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a` (verified)

## Independent Review Score

The author's score of 21 was treated as untrusted and every category was recounted from the current candidate. The candidate explicitly owns two public methods, two descriptor/menu models, the transaction foundation and Linux query/read dependencies, two public result shapes, four reused foundation contract groups, one addition to the existing shared module, one transaction/cancellation concurrency boundary, one trusted-device/redaction concern, and one enumeration/read-bound concern. Adapter identity, transaction execution, cache substrate, physical writes, write results, HTTP/API, and UI behavior remain assigned outside this candidate.

- Functions/methods: 2 x 2 = 4
- Data structures/models: 2 x 1 = 2
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 2 x 1 = 2
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 4 x 0.5 = 2
- Adding code to an existing library/module: 1 x 1 = 1
- Creating a new reusable library/module: 0 x 3 = 0
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **21**

The fresh total matches the author's score because adversarial review found no omitted candidate-owned responsibility. Adapter query/menu/read support extends the prerequisite's single injected generic ioctl seam and is not a separately exposed provider method or new model.

## Split Decision

- Split required: no.
- New leaves: none.
- Cohesion reason: descriptor discovery, descriptor metadata caching, and live reads share the same immutable descriptor vocabulary, validated device transaction, cache generation, grouped extended-control operations, failure boundary, and public provider fixture. Splitting discovery from reads would divide one mutually dependent provider contract and duplicate cache, adapter-trace, and route verification without creating independently useful implementation boundaries.
- Split plan: none.

## Parent Coverage And Ownership

- Parent coverage status: 100% covered.
- This candidate owns descriptor/menu models, query and menu discovery, descriptor conversion and cache content, full and bounded live reads, and read-specific deterministic verification.
- The transaction/identity sibling exclusively owns configured-device identity, the adapter/error primitives, transaction and lock lifetime, cache-slot substrate, invalidation, reconnect, cancellation mechanics, and base fixtures.
- The validated-write/read-back authority exclusively owns validation, try/set behavior, physical mutation, mandatory post-write read-back, conditional layout refresh, and `V4L2ControlWriteResult`.
- Uncovered parent responsibilities: none.
- Duplicated implementation responsibility: none.

## Findings And Gates

- Findings: no candidate revision is required. Routing, defaults, data ownership, concurrency, errors, performance bounds, public library routes, test fixtures, and acceptance criteria are concrete.
- Evidence gap: none.
- Architecture gap: none. The ACD defines descriptor discovery, live reads, cache invalidation, safe errors, async isolation, and performance boundaries, and the current-runtime anchor confirms live Linux V4L2 enumeration.
- Readiness gate: none for specification approval.
- Dependency gate: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` must be independently approved and implemented before this candidate is implemented.
- Dependency consistency fact: the write-contract authority preserves exclusive write ownership, but its own prerequisite-status prose still says this descriptor/live-read candidate must be written. That sibling text predates the now-existing candidate and does not make this candidate's ownership or contract ambiguous.
- Paired verification gate: satisfied. The paired test specification covers both public provider methods, full descriptor and sparse-menu behavior, grouped and selected reads, identity-generation cache behavior, cancellation and concurrency inherited through the shared transaction, bounded calls, safe failures, and production-data independence.
