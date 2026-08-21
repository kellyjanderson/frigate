# Authenticated Camera-Control API Independent Review Pass

Date: 2026-08-19
Pass identifier: `authenticated-camera-control-api-pass-1`
Result: `split_required`
Candidate: `project/specs/camera-controls/authenticated-camera-control-api.spec.md`

## Artifacts Reread

- Candidate: `project/specs/camera-controls/authenticated-camera-control-api.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/authenticated-camera-control-api.test-spec.md`
- Provider prerequisite candidate: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
- Architecture anchor: `project/architecture/acd/usb-v4l2-camera-controls.md`
- Architecture anchor: `project/architecture/current-camera-runtime.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`

No parent candidate or active sibling produced from a written parent split exists. The provider candidate was read only to verify the prerequisite boundary and shared provider contract.

## Pinned Scoring Authorities

- Template path: `../.agents/process/templates/implementation-spec-template.md`
- Supplied template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Verified template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Scoring-policy path: `../.agents/process/specification-review-scoring-policy.md`
- Supplied scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Verified scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority status: exact match; scoring is valid.

## Independent Review Score

The candidate's recorded 24.5 was treated as an untrusted claim. The fresh recount does not collapse the separately named request, three success-response, and error-response models into two model families, nor the three operation results and shared failure result into one output responsibility.

- Functions/methods: 3 x 2 = 6
- Data structures/models: 5 x 1 = 5
  - `CameraControlWriteBody`
  - `CameraControlsResponse`
  - `CameraControlValuesResponse`
  - `CameraControlUpdateResponse`
  - `CameraControlErrorResponse`
- Dependencies/services: 2 x 1 = 2
  - administrator authorization
  - `V4L2ControlProvider`
- Returns/outputs/signals: 4 x 1 = 4
  - descriptor result
  - bounded current-values result
  - update read-back result
  - stable categorized failure result
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 3 x 0.5 = 1.5
  - `require_role`
  - `AuthTestClient` and `BaseTestHttp` test harness
  - `generate_api_auth_spec.py`
- Adding code to an existing library/module: 1 x 1 = 1
  - include the child router from `frigate/api/camera.py`
- Creating a new reusable library/module: 0 x 3 = 0
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 1 x 3 = 3
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **30.5**

Because 30.5 is at or above the policy's forced-split threshold of 25, the candidate cannot remain one final implementation leaf.

## Exact Split Plan

### Proposed child 1: Authenticated Camera-Control Read API And Shared Contracts

- Proposed path: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- Responsibility:
  - Own `frigate/api/camera_control.py` router construction, the process-local provider composition point, configured-camera validation, administrator dependency, safe common error envelope, shared provider-error translation helper, and inclusion from `frigate/api/camera.py`.
  - Own `GET /cameras/{camera_name}/controls`, including `refresh=false` by default and explicit descriptor refresh.
  - Own `GET /cameras/{camera_name}/controls/values`, including 1 through 64 unique repeated `control_id` values, one provider call, ordered projection, and missing-control rejection.
  - Own `CameraControlsResponse`, `CameraControlValuesResponse`, and `CameraControlErrorResponse`.
  - Own read-route cancellation/no-retry behavior, async provider delegation, configured-camera and path-safety enforcement, read error mappings, and GET observability.
  - Own deterministic read-route tests and GET OpenAPI schema/admin assertions. Regenerate the generated OpenAPI artifact after adding the GET routes.
- Parent coverage:
  - Covers descriptor retrieval, bounded value refresh, common router registration, shared authorization/configured-camera guard, shared safe error contract, GET integration, and all read-side verification from the candidate and paired test specification.

### Proposed child 2: Authenticated Camera-Control Write API

- Proposed path: `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md`
- Responsibility:
  - Own `PUT /cameras/{camera_name}/controls/{control_id}` and its exact single-control invocation of `V4L2ControlProvider.set_control`.
  - Own `CameraControlWriteBody` and `CameraControlUpdateResponse`.
  - Own scalar/button-null request validation, individual physical-device write behavior, post-write read-back response, no implicit retry or duplicate write, and write-specific use of the shared categorized-error translation contract.
  - Own deterministic PUT tests for authorization, body validation, provider arguments, one-write delegation, read-back success, every write-side categorized failure, sanitization, and absence of a success envelope after set/read-back failure.
  - Own PUT OpenAPI schema/admin assertions. Regenerate the generated OpenAPI artifact after adding the PUT route.
- Parent coverage:
  - Covers the update route, write DTOs, destructive behavior, write/read-back contract, write failures, PUT integration, and all write-side verification from the candidate and paired test specification.

## Split Coverage And Dependencies

- Proposed parent coverage status: **100% covered** by the two proposed children.
- Parent responsibilities still uncovered: none.
- Inter-child dependency: child 2 depends on child 1's router registration, configured-camera guard, administrator dependency, common safe error envelope, and provider-error translation helper. It must consume those contracts without redefining them.
- Shared authoritative provider contract: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`, specifically `V4L2ControlProvider.get_controls`, `V4L2ControlProvider.set_control`, `V4L2ControlDescriptor`, and `V4L2ControlError`.
- Shared authoritative architecture: `project/architecture/acd/usb-v4l2-camera-controls.md`.
- Shared wire contract owner: proposed child 1 owns the common safe error envelope and shared router/auth/configured-camera conventions. Proposed child 2 owns only the write request and update success response.
- Generated artifact ownership: each child regenerates and verifies `docs/static/frigate-api.yaml` for the operations it adds; neither edits the file manually.
- Paired verification ownership: the current paired test specification must be split so read-route and write-route checks map to the respective child exactly as assigned above. Common auth/configured-camera/error-envelope proof belongs to child 1; child 2 verifies reuse through PUT route assertions.
- Provider prerequisite gate: both children depend on independent approval and implementation of the provider candidate before API integration.

## Findings And Gates

- Primary finding: the candidate undercounts three explicitly named success response models plus the error response as one response family. The exact rubric counts five wire models including the request model.
- Secondary finding: the candidate undercounts four independently observable HTTP output responsibilities as one output/signal.
- Cohesion finding: all three routes share a resource family, but the read routes and physical write route remain independently deliverable and independently failing boundaries. Shared contracts can have one owner without keeping the destructive write in the read leaf.
- Parent coverage gate: satisfied by the exact proposed split; uncovered items are none.
- Architecture gate: sufficient. The ACD defines the administrator-only camera-scoped API, trusted path, async, serialization, error, and OpenAPI boundaries.
- Evidence gate: no evidence gap identified for specification splitting or mocked API-route verification.
- Readiness gate: the unsplit candidate fails the mandatory sizing rule. The provider prerequisite is explicitly identified and sequenced, not missing.
- Dependency gate: provider approval and implementation remain required before either API child can integrate.
- New leaves: the two proposed definitions above; no child files were created in this pass.
