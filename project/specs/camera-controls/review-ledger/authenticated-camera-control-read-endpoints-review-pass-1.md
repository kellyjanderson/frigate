# Authenticated Camera-Control Read Endpoints Independent Review Pass 1

Date: 2026-08-20
Pass identifier: `authenticated-camera-control-read-endpoints-pass-1`
Result: `split_required`

## Candidate And Artifacts Reread

- Candidate: `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/authenticated-camera-control-read-endpoints.test-spec.md`
- Candidate provenance record: `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-endpoints-candidate.md`
- Direct parent: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- Parent split record: `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-api-review-pass-1.md`
- Implemented direct sibling: `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md`
- Provider prerequisite contracts:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`
- Architecture anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Implemented shared-foundation evidence reread from exact merged head `eb59f3d6bb0a5d6a12c4fb2621bb6b3be88e7b5d`:
  - `frigate/api/camera_control.py`
  - `frigate/api/defs/response/camera_control_response.py`

## Pinned Scoring Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Supplied template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Verified template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Supplied scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Verified scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority status: exact match; scoring is valid.

## Independent Review Score

The provisional author score of 23 was treated as an untrusted claim. The fresh recount identifies two independently implemented and verified performance responsibilities, not one: descriptor enumeration is bounded by default metadata reuse and explicit refresh, while selected-value reads have a separate 1-through-64 limit and one selected provider read. The candidate also has one readiness blocker. It directly places provider-owned `V4L2ControlDescriptor` objects in the HTTP response, but that provider DTO permits `current_value` to be `bytes` or a tuple for losslessly represented payload and array controls. The candidate simultaneously prohibits exposing raw payloads and defines neither an API-owned JSON projection nor deterministic encode, omit, or reject behavior for those variants. Its paired test fixtures cover only scalar descriptor values, so the real response schema, serialization behavior, and redaction contract remain ambiguous.

- Functions/methods: 2 x 2 = 4
- Data structures/models: 2 x 1 = 2
- Dependencies/services: 3 x 1 = 3
- Returns/outputs/signals: 2 x 1 = 2
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 4 x 0.5 = 2
- Adding code to an existing library/module: 2 x 1 = 2
- Creating a new reusable library/module: 0 x 3 = 0
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 2 x 2 = 4
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 1 x 2 = 2
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **27**

The fresh score is at or above the policy's forced-split threshold of 25.

## Exact Split Plan

### Proposed child 1: Authenticated Camera-Control Descriptor Read Endpoint

- Proposed responsibility:
  - Own `GET /cameras/{camera_name}/controls`, `refresh=false` by default, exact explicit-refresh forwarding, one `V4L2ControlProvider.get_controls(camera_config, refresh=...)` call, and provider enumeration-order preservation.
  - Own `CameraControlsResponse` and the complete descriptor HTTP wire contract. Define an API-safe JSON projection for every provider descriptor field and every allowed `current_value` variant, including deterministic handling of `bytes`, tuple, unsupported, payload-bearing, compound, and array values without leaking raw payload content.
  - Own descriptor-operation use of the inherited administrator, configured-camera, safe-error, cancellation, no-retry, and response-sanitization contracts.
  - Own descriptor-route registration, success/error schemas, generated administrator-auth OpenAPI proof, and generated-artifact refresh caused by this route.
- Candidate coverage:
  - Covers descriptor retrieval, explicit refresh, descriptor success output, descriptor ordering, descriptor-specific response safety, one-call behavior, route reachability, and descriptor OpenAPI responsibilities.
- Paired verification ownership:
  - Route-test admin success and viewer/anonymous denial, default/false/true refresh, exact provider arguments and one awaited call, enumeration order, stable read failures, cancellation/no retry, and descriptor-route registration.
  - Serialize descriptors containing every provider-supported scalar and non-scalar `current_value` shape, including invalid UTF-8 bytes and tuple values, and prove the exact safe JSON projection and sensitive-payload exclusion.
  - Assert this GET operation's generated success/error schemas and administrator classification.

### Proposed child 2: Authenticated Camera-Control Selected-Values Read Endpoint

- Proposed responsibility:
  - Own `GET /cameras/{camera_name}/controls/values`, required repeated `control_id` query parsing, and unchanged delegation to exactly one `V4L2ControlProvider.get_control_values(camera_config, control_ids)` call.
  - Own `CameraControlValuesResponse`, direct ordered scalar mapping projection, HTTP 200 behavior, and propagation of provider-owned canonical-ID, uniqueness, 1-through-64 bound, missing-ID, ordering, and selected-read failures without reimplementation.
  - Own selected-values use of the inherited administrator, configured-camera, safe-error, cancellation, no-retry, and response-sanitization contracts.
  - Own values-route registration, success/error schemas, generated administrator-auth OpenAPI proof, and generated-artifact refresh caused by this route.
- Candidate coverage:
  - Covers repeated-query parsing, bounded selected-value delegation, ordered scalar output, values-specific failures, one-call behavior, route reachability, and values OpenAPI responsibilities.
- Paired verification ownership:
  - Route-test admin success and viewer/anonymous denial, missing query shape, unchanged repeated-ID passthrough, exact provider arguments and one awaited call, ordered boolean/integer/string/null output, provider-owned invalid/missing-ID failures, cancellation/no retry, sanitization, and values-route registration.
  - Assert this GET operation's generated success/error schemas and administrator classification.

### Coverage And Dependencies

- Proposed coverage of this candidate: **100%**. Every implementation and paired-test responsibility is assigned exactly once between the two proposed children.
- Uncovered candidate responsibilities: `none`.
- Inter-child dependencies: `none`; both consume the same implemented shared API foundation and the same provider prerequisite contracts. Each owns only its own route, success model, response projection, route proof, and generated-artifact change.
- Shared authoritative API contracts: `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` and merged head `eb59f3d6bb0a5d6a12c4fb2621bb6b3be88e7b5d` own the router, provider getter, configured-camera guard, administrator dependency, operation helper, safe error envelope, translation, cancellation, logging, redaction, and single camera-router inclusion.
- Shared authoritative provider contracts: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` owns identity, transaction lifetime, locking, cancellation recovery, and foundation failures; `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` owns provider descriptor/value types, enumeration, live reads, selected-ID validation, ordering, caching, and categorized read failures.
- Existing parent coverage: 100% remains assigned across the implemented shared-foundation sibling and these two proposed endpoint children. Mutation/write behavior remains outside this parent and this split.

## Findings And Gates

- Split finding: two endpoint-specific performance contracts raise the independent responsibility score above the author's count; with the wire-contract readiness blocker, the fresh score is 27 and forces the exact split above.
- Readiness finding: the descriptor endpoint lacks an unambiguous, privacy-safe JSON projection for provider `current_value` variants that include `bytes` and tuples, and its paired tests omit those shapes.
- Parent coverage status: 100% under the exact split plan; uncovered responsibilities `none`.
- New leaf definitions: the descriptor-read endpoint child and selected-values-read endpoint child defined above; no child artifact was created in this pass.
- Architecture gap: `none`; the ACD supplies the administrator, configured-camera, trusted-path, async, safe-error, descriptor-read, selected-value-read, and authenticated OpenAPI boundaries.
- Evidence gap: `none`; the parent split record, exact merged shared-foundation head, provider contracts, paired test specification, and architecture anchors provide sufficient review evidence.
- Readiness gate: the descriptor wire projection is unresolved, and the proposed final leaves have no independent approval; neither endpoint is implementation-ready.
- Dependency gates: transaction/identity and descriptor/live-read provider specifications remain unimplemented prerequisites; the shared API foundation is approved and merged in PR #6 from exact head `eb59f3d6bb0a5d6a12c4fb2621bb6b3be88e7b5d`.
