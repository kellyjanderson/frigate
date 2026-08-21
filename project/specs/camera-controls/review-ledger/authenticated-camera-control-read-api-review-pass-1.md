# Authenticated Camera-Control Read API Independent Review Pass 1

Date: 2026-08-19
Pass identifier: `authenticated-camera-control-read-api-pass-1`
Result: `split_required`

## Candidate And Artifacts Reread

- Candidate: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/authenticated-camera-control-read-api.test-spec.md`
- Candidate provenance record: `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-api-candidate.md`
- Direct parent: `project/specs/camera-controls/authenticated-camera-control-api.spec.md`
- Parent split record: `project/specs/camera-controls/review-ledger/authenticated-camera-control-api-review-pass-1.md`
- Proposed write sibling: `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md` (not present on disk during this pass)
- Provider prerequisite reference: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
- Current provider review and read-contract evidence:
  - `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-review-pass-1.md`
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
  - `project/specs/camera-controls/review-ledger/v4l2-device-transaction-and-identity-foundation-review-pass-4.md`
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`
  - `project/specs/camera-controls/review-ledger/v4l2-descriptor-discovery-and-live-read-provider-review-pass-1.md`
- Architecture anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`

## Pinned Scoring Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Supplied template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Verified template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Supplied scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Verified scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority status: exact match; scoring is valid.

## Independent Review Score

The author's 24.5 score was treated as an untrusted claim. The implementation-responsibility counts survive the fresh recount, but one readiness blocker was omitted. The candidate and paired test route bounded value refresh through `V4L2ControlProvider.get_controls(...)` and assign unique-ID validation, ordered selected projection, and missing-ID rejection to the API. The current independently approved provider read contract instead owns those behaviors in `V4L2ControlProvider.get_control_values(camera_config, serialized_ids)`. The candidate still links the split-required provider parent rather than the current final provider leaves. An implementer would have to choose between duplicating provider-owned behavior and violating the candidate's one-call response contract.

- Functions/methods: 3 x 2 = 6
- Data structures/models: 3 x 1 = 3
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 3 x 1 = 3
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 3 x 0.5 = 1.5
- Adding code to an existing library/module: 1 x 1 = 1
- Creating a new reusable library/module: 0 x 3 = 0
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 1 x 2 = 2
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **26.5**

The score is at or above the policy's forced-split threshold of 25.

## Exact Split Plan

### Proposed child 1: Camera-Control API Shared Foundation

- Proposed responsibility:
  - Own `frigate/api/camera_control.py` router construction, process-local provider composition point, configured-camera resolution, the common async route-support operation, and inclusion from `frigate/api/camera.py`.
  - Own `CameraControlErrorResponse` and the complete provider-category-to-safe-HTTP translation table used by both read and write API operations, including unexpected-exception sanitization and permitted logging fields.
  - Own the common administrator dependency convention, trusted configured-camera boundary, absence of client-supplied device paths, and shared router/error registration proof.
  - Own the exact provider prerequisite references and callable vocabulary consumed by API children: `V4L2DeviceTransactionExecutor` and safe foundation errors from `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`, plus `V4L2ControlProvider.get_controls(...)`, `V4L2ControlProvider.get_control_values(...)`, `V4L2ControlDescriptor`, and read failures from `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`. Write-specific provider symbols remain dependency facts for the separate write API sibling.
- Candidate coverage:
  - Covers the common router, provider lifecycle, administrator/configured-camera/trusted-path contracts, safe error envelope, full shared error translation, common observability, and top-level route inclusion currently assigned to this candidate.
- Paired verification ownership:
  - Unit-test the complete common provider-category-to-status/code table and unexpected-exception sanitization.
  - Prove configured-camera rejection before provider access, path redaction, shared provider patching/composition, router inclusion, and the common administrator dependency convention without claiming either GET operation's success contract.

### Proposed child 2: Authenticated Camera-Control Read Endpoints

- Proposed responsibility:
  - Own `GET /cameras/{camera_name}/controls`, `CameraControlsResponse`, `refresh=false` by default, explicit refresh, one `V4L2ControlProvider.get_controls(camera_config, refresh=...)` call, and provider descriptor-order preservation.
  - Own `GET /cameras/{camera_name}/controls/values` and `CameraControlValuesResponse`, delegating the 1 through 64 unique serialized-ID contract, order preservation, selected live read, and missing-control failure to exactly one `V4L2ControlProvider.get_control_values(camera_config, control_ids)` call. The API owns only FastAPI query-shape parsing and the typed HTTP projection; it must not reimplement provider-owned canonical-ID validation or selected-read semantics.
  - Own GET-specific authorization application, success and read-failure responses, cancellation/no-retry behavior, response observability, and the one-call performance bound.
  - Own GET route registration assertions, response-schema assertions, generated admin-auth OpenAPI assertions, and generated artifact refresh for the two GET operations.
- Candidate coverage:
  - Covers descriptor retrieval, bounded value refresh, the two read success models, GET integration, and every read-side acceptance and verification responsibility currently assigned to this candidate.
- Paired verification ownership:
  - Route-test admin success and viewer/anonymous denial, exact provider method and arguments, one awaited call, descriptor refresh default/override, ordered selected values, provider-owned missing-ID propagation, stable read failures, cancellation/no retry, response sanitization, route reachability, and generated GET schemas/admin annotations.

### Coverage And Dependencies

- Proposed coverage of this candidate: **100%**. Every implementation and paired-test responsibility is assigned exactly once between the two proposed children.
- Uncovered candidate responsibilities: `none`.
- Inter-child dependency: the read-endpoint child consumes the shared foundation's router, provider instance, configured-camera resolver, administrator convention, error envelope, and translation operation without redefining them.
- Shared authoritative contracts: the shared-foundation child owns the API-local router/auth/configured-camera/error conventions; the two approved current provider leaves named above own device transaction, descriptors, full reads, bounded selected reads, provider ordering, validation, and categorized failures.
- External write ownership: physical mutation, write DTOs, update result, PUT handler, and write-route verification remain excluded to the parent split's proposed write sibling.
- Original parent planned coverage: 100% in `authenticated-camera-control-api-pass-1` across the read/shared and write definitions.
- Current durable original-parent child-artifact coverage: incomplete because `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md` and its paired test are not present on disk during this pass. No original-parent responsibility is absent from the recorded split plan.

## Findings And Gates

- Primary finding: the candidate's bounded-values handler conflicts with the current approved provider contract by assigning provider-owned selection, bound, ordering, and missing-ID semantics to an API-side projection over `get_controls(...)`.
- Prerequisite finding: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md` is a split-required parent, not the final provider dependency. The candidate must reference the final transaction/identity and descriptor/live-read leaves and their exact public methods.
- Split fact: the independent score is 26.5, so the pinned scoring policy requires the exact split above. New leaves are the two proposed definitions; no child artifact was created in this pass.
- Architecture gap: `none`; the ACD sufficiently defines the administrator-only camera-scoped API, trusted path, async boundary, safe errors, and OpenAPI requirement.
- Evidence gap: `none`; the current provider artifacts and accepted review records establish the callable contract directly.
- Readiness gate: one provider/API callable-contract blocker plus the forced split; the candidate is not approved.
- Dependency gate: both proposed children require implementation of the approved transaction/identity and descriptor/live-read provider leaves before API integration. The separate write sibling remains outside this pass.
