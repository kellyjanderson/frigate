# Authenticated Camera-Control Read API And Shared Contracts Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/authenticated-camera-control-api.spec.md`
Split provenance: `project/specs/camera-controls/review-ledger/authenticated-camera-control-api-review-pass-1.md`, child 1 of the exact split plan
Canonical status: Split child
Review Score: 24.5
Prerequisites:
- `project/specs/camera-controls/v4l2-camera-control-provider.spec.md` - must be independently approved and implemented before API integration because it supplies the provider, descriptor, async, and categorized-failure contracts
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines the administrator-only, camera-scoped, trusted-device API boundary

## Source Field Carryover

- Source purpose:
  - Expose authenticated descriptor and current-value reads while establishing the common router, authorization, configured-camera, response, and provider-error contracts reused by the write child.
- Source responsibilities by category:
  - Functions/methods: two GET handlers and one shared async route-support operation that resolves configured cameras and translates categorized provider failures.
  - Data structures/models: descriptor success, bounded-values success, and common safe error response models; provider descriptors remain the authoritative nested wire type.
  - Dependencies/services: Frigate administrator authorization and the prerequisite `V4L2ControlProvider`.
  - Returns/outputs/signals: descriptor results, ordered bounded current-value results, and stable categorized failures.
  - UI surfaces/components: not applicable; the descriptor-driven UI is a separate specification leaf.
  - UI fields/elements: not applicable.
  - Reusable code plan: reuse `require_role`, the HTTP auth test harness, the generated auth-aware OpenAPI pipeline, and the prerequisite provider DTOs; expose shared route support and error models to the write sibling.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: await exactly one provider operation per accepted GET request; blocking device work and per-device serialization remain provider-owned.
  - Destructive/write behavior: not applicable; this child performs no physical-camera mutation.
  - Security/privacy-sensitive behavior: require administrators, reject names absent from active camera configuration before provider access, and never accept or expose device paths or raw provider causes.
  - Performance-sensitive behavior: bound value refresh to 1 through 64 unique IDs and one provider call; descriptor re-enumeration is explicit.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - Resolved defaults are `refresh=false`, repeated `control_id` query parameters, ordered projection, a maximum of 64 unique IDs, no implicit retries, and one shared safe error envelope.
- Source split/provenance notes:
  - Independent review pass `authenticated-camera-control-api-pass-1` scored the parent 30.5 and assigned read/shared contracts here. The write sibling owns mutation, write DTOs, update success response, and PUT-specific proof. The two children cover 100% of the parent.

## Purpose

Provide administrators with safe camera-scoped descriptor and current-value reads over the V4L2 provider. This child also establishes the shared API contracts that the separate write child must consume without redefining them.

## Scope

Owns:

- Camera-control router construction, one process-local provider composition point, inclusion from the existing camera router, explicit administrator dependency, and configured-camera enforcement.
- Descriptor retrieval and bounded current-value refresh GET routes.
- Common safe error response and provider-error translation, shared by both API children.
- Read response models, deterministic mocked-provider tests, and GET OpenAPI auth/schema proof.

Does not own:

- Control mutation, write request validation, update success responses, destructive behavior, or PUT-specific tests and OpenAPI assertions; those belong to `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md`.
- Provider discovery, ioctl work, caching, device locking, disconnect recovery, or stable-device resolution.
- UI rendering, browser polling lifecycle, deployment, capture restart policy, or physical-hardware validation.

## Split Coverage

- Parent spec: `project/specs/camera-controls/authenticated-camera-control-api.spec.md`
- Parent coverage status: 100% covered by this child and the write child assigned in the same independent split plan.
- Parent responsibilities owned by this child:
  - Common router/auth/configured-camera/error contracts, descriptor GET, bounded values GET, read-side integration, and read/shared verification.
- Parent responsibilities still missing from children:
  - none.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/authenticated-camera-control-api-review-pass-1.md` | 1 | `project/specs/camera-controls/authenticated-camera-control-api.spec.md` | this child and `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md` | continue pending independent child review |

## Implementation Routing

- Primary modules/files:
  - `frigate/api/camera_control.py` - own the router, process-local provider instance, shared route-support operation, and two GET handlers.
  - `frigate/api/defs/response/camera_control_response.py` - own the two read success models and common error model.
- Supporting modules/files:
  - `frigate/api/camera.py` - include `camera_control.router` once so runtime and generated-OpenAPI applications share registration.
  - `docs/static/frigate-api.yaml` - generated output only; regenerate with `python3 generate_api_auth_spec.py` and never edit manually.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/api/camera_control.py` - expose the router, provider composition point, and shared route-support operation consumed by the write child.
  - `frigate/api/defs/response/camera_control_response.py` - expose `CameraControlErrorResponse` to the write child.
  - `frigate/camera/v4l2_controls.py` - prerequisite-owned provider, descriptor, and categorized-error boundary.
- Tests:
  - `frigate/test/http_api/test_http_camera_controls.py` - deterministic GET authorization, validation, delegation, ordering, error, sanitization, and registration coverage.
  - `generate_api_auth_spec.py --check` - generated artifact freshness and GET admin classification proof.

## Chosen Defaults / Parameters

- `GET /cameras/{camera_name}/controls` uses `refresh=false`; `refresh=true` explicitly requests provider re-enumeration.
- `GET /cameras/{camera_name}/controls/values` requires repeated `control_id` query parameters containing 1 through 64 unique stable serialized IDs. Zero, duplicate, or more than 64 IDs return HTTP 422 before provider access.
- Values are projected in request order from the single provider result. If any requested ID is absent, the request returns `control_not_found` rather than a partial success.
- Both success routes return HTTP 200. The API performs no retry, cache substitution, polling loop, or second provider call.
- Common domain failures use `{"success": false, "code": "<stable_code>", "message": "<safe_message>"}` without paths, raw errno text, ioctl payloads, or raw exception messages.

## Data Ownership

- Source of truth: live hardware state and provider-owned descriptors returned by `frigate/camera/v4l2_controls.py`; active `request.app.frigate_config.cameras` owns permitted camera names.
- Read ownership: administrators read through the two GET routes after configured-camera validation.
- Write ownership: no write occurs here; the provider remains the physical-device owner and the write sibling owns the PUT route.
- Derived/cache data: the API stores no descriptor or value cache. Provider cache metadata is recomputable from configured stable identity and hardware discovery.
- Privacy/logging constraints: logs may contain camera name, stable control ID, operation, and stable failure category. They must not contain device paths, authentication headers, submitted string values, raw ioctl structures, or private provider causes.

## Dependencies And Routes

- Domain/service dependencies:
  - `frigate.api.auth.require_role(["admin"])` is explicit on both GET operations.
  - One `V4L2ControlProvider` instance from the approved and implemented prerequisite receives only a validated `CameraConfig`.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable; a separate UI child consumes the HTTP contract.
- Background/concurrency route, if applicable:
  - Each handler validates request shape, then the shared route-support operation resolves the configured camera and awaits one provider call. Provider thread offload and per-device locking remain authoritative. Cancellation causes no API retry or substitute response.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already records the administrator, camera, trusted-path, async, error, and OpenAPI boundaries.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - validates the deployed stable V4L2 video route and hardware control enumeration.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/v4l2-camera-control-provider.spec.md` - independent approval and implementation must precede API integration.
- Progression handling:
  - prerequisite implementation must run first; this candidate remains `awaiting_independent_review` and is not implementation-ready.

## Application Integration

- App type: API-service.
- User/caller surface: `GET /cameras/{camera_name}/controls` and `GET /cameras/{camera_name}/controls/values`.
- Invocation route: authenticated HTTP request, explicit administrator dependency, mounted camera-control router, request/configured-camera validation, one async provider call, typed response.
- Wiring owner/module: `frigate/api/camera_control.py`, included once by `frigate/api/camera.py`.
- Observable result: an administrator receives provider descriptors or the requested descriptors/current values in request order; rejected operations receive a stable safe error.
- Integration validation: route-level `AuthTestClient` tests with a mocked async provider plus `python3 generate_api_auth_spec.py --check` and generated-operation assertions for both GET routes.
- Incomplete status risk: designed; provider integration, router inclusion, generated artifact refresh, and route proof are required before this surface is integrated.

App-type-specific proof:

- API/service: prove exact GET paths, administrator enforcement, query validation, configured-camera restriction, provider call count/arguments, ordered response bodies, stable error bodies, path sanitization, router reachability, and generated admin annotations.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `frigate.api.auth.require_role` - existing administrator enforcement recognized by the auth artifact generator.
  - `frigate.test.http_api.base_http_test.AuthTestClient` and `BaseTestHttp` - established authenticated route test harness.
  - `generate_api_auth_spec.py` - sole generator/checker for `docs/static/frigate-api.yaml`.
- Current reuse readiness:
  - authorization, test harness, and generator are reusable as-is; provider symbols arrive through the prerequisite.
- Extraction/wrapping needed:
  - none; the route-support operation maps the existing provider contract without reimplementing it.
- Additions to existing library/modules:
  - `frigate/api/camera.py` includes the new child router; its existing app registration remains authoritative.
- New reusable modules to expose:
  - none; shared API-child symbols live in the resource-specific router and response module, not a general device library.
- One-off code justification, if any:
  - none; both modules are the stable resource-family boundary reused by the write sibling.

## Required DTOs / Functions / Components

- DTOs/models:
  - `CameraControlsResponse` - `success=true`, `camera`, and the provider descriptor collection.
  - `CameraControlValuesResponse` - `success=true`, `camera`, and requested provider descriptors/current values in request order.
  - `CameraControlErrorResponse` - `success=false`, stable `code`, and caller-safe `message`; shared with the write sibling.
- Functions/methods:
  - `run_camera_control_operation(request, camera_name, operation) -> T` - common async route support that rejects unconfigured cameras before invoking the supplied provider operation and translates `V4L2ControlError` or unexpected failures into the safe public error contract.
  - `get_camera_controls(request, camera_name, refresh=False) -> CameraControlsResponse` - await one `get_controls(camera_config, refresh=refresh)` call and preserve provider descriptor order.
  - `get_camera_control_values(request, camera_name, control_id) -> CameraControlValuesResponse` - enforce the unique 1 through 64 bound, await one `get_controls(camera_config, refresh=False)` call, reject any missing ID, and project requested descriptors/current values in request order.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Ordinary descriptor GETs use `refresh=false`; explicit refresh is the only read-route request for re-enumeration.
- Values GET accepts at most 64 unique IDs and performs one provider call, one bounded lookup, and one ordered projection. It never issues one provider call per ID.
- Device work remains behind the provider async facade, so no open/ioctl work occupies the FastAPI event loop or capture workers.

## Error And State Behavior

- Existing authentication behavior returns HTTP 401 for anonymous callers and HTTP 403 for authenticated non-administrators, with no provider call.
- An absent configured camera returns HTTP 404 `camera_not_configured` before provider access. Invalid ID-list shape returns HTTP 422 `invalid_control_ids` before provider access.
- Provider `not_configured` maps to HTTP 409 `camera_controls_not_configured`; `control_not_found` maps to HTTP 404 `control_not_found`; `unstable_device_identity` and `device_disconnected` map to HTTP 503 `device_unavailable`; read-side `device_io` maps to HTTP 502 `control_read_failed`.
- The shared translation contract also defines write-sibling mappings without owning the PUT route: `invalid_value` to HTTP 422 `invalid_control_value`, `unsupported_control_type` to HTTP 422 `unsupported_control_type`, `control_not_writable` to HTTP 409 `control_not_writable`, `driver_rejected` to HTTP 409 `control_conflict`, and write-side `device_io` to HTTP 502 `control_write_failed`.
- Unexpected provider exceptions are logged with traceback server-side and return HTTP 500 `camera_control_internal_error` without raw exception text. The API performs no implicit retry or stale-value substitution.

## Test Strategy

- Unit tests:
  - Exercise unique-ID bounds, ordered projection, missing-ID rejection, and the complete shared provider-category-to-status/code table using deterministic values.
- Service/DB tests:
  - Patch the process-local provider with an `AsyncMock`; no database, physical device, or production configuration is required.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Exercise both GET routes through `AuthTestClient`; assert admin success, viewer/anonymous denial, exact provider arguments and one-call count, default/explicit refresh, ordered output, configured-camera and validation short-circuits, stable failures, path sanitization, and shared router registration.
  - Regenerate and check `docs/static/frigate-api.yaml`; assert both GET operations reference their schemas and carry admin auth classification.
- Production-data rule:
  - Tests must not require the user's production database, production configuration, or physical C930e.

## Acceptance Criteria

- Both GET routes are reachable through the existing camera router, require administrator role, and appear with admin classification and intended schemas in the regenerated OpenAPI artifact.
- Requests cannot specify a host/device path, and an unconfigured camera is rejected before any provider call.
- Descriptor retrieval forwards `refresh` exactly once, while values refresh enforces 1 through 64 unique IDs, calls the provider once, rejects missing IDs, and returns results in request order.
- Every documented read failure and unexpected exception maps to the stable safe envelope without filesystem, ioctl, authentication, or raw exception details.
- The write sibling can reuse the same router, provider composition point, configured-camera support, administrator convention, error envelope, and provider-error translation without redefining them.
- Deterministic route tests and `python3 generate_api_auth_spec.py --check` prove the real API registration route without production data or hardware.

## Readiness Checklist

- [x] Primary ancestor and architecture ancestor are explicit.
- [x] Review Score appears in the front matter and exactly matches the total in the final Review Score Calculation section.
- [x] The current implementation-spec template was loaded and its source path is recorded in the final Review Score Calculation section.
- [x] Review Score is adversarially recounted from the current spec text; prior scores are challenged instead of trusted.
- [x] Unresolved deferral/gap markers such as future spec, blocker, to be defined/TBD, not done, incomplete, unfinished, deferred, or later are either absent/resolved or counted as 100-point scoring events.
- [x] Source fields are carried into spec sections or preserved as explicit provenance/history.
- [x] Canonical status is explicit.
- [x] Prerequisites are linked, implemented, or marked not applicable.
- [x] Missing or stale prerequisite architecture discovered after the architecting phase has an ACD link, or is marked not applicable.
- [x] Missing prerequisite behavior has a final spec link, or is marked not applicable.
- [x] Split coverage is complete, or marked not applicable.
- [x] Per-request review ledger records the latest new-leaf list for the review round, or is marked not applicable before review.
- [x] Implementation owner/module is named.
- [x] Existing code reuse/extraction decision is explicit.
- [x] Existing library/module additions or new reusable module boundaries are named, or marked not applicable.
- [x] UI fields/elements are listed, or marked not applicable.
- [x] Chosen defaults are explicit.
- [x] Data source of truth and write owner are explicit.
- [x] GUI/concurrency route is explicit, or marked not applicable.
- [x] App type and application integration route are explicit.
- [x] Integrated route validation is named.
- [x] GUI/console/API-service/mixed/library-only proof matches the app type.
- [x] Performance bounds are explicit, or marked not applicable.
- [x] Privacy/logging constraints are explicit, or marked not applicable.
- [x] Test strategy does not depend on production data.
- [x] Acceptance criteria are testable.

## Review Score Calculation

- Template source: `../.agents/process/templates/implementation-spec-template.md` (SHA-256 `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`)
- Prior recorded score: 30.5 for the independently reviewed unsplit parent; adversarial input, not trusted for this child.
- Adversarial rescore basis: recounted every category from this child only. The two handlers and one shared route-support operation are distinct; the three named wire models and three observable output types remain distinct; write-route DTOs, success output, destructive behavior, handler, and proof are excluded. Shared route support, authorization, async delegation, bounded refresh, router inclusion, reuse, provider sequencing, and verification were checked for hidden work.
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
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 24.5
- If total matches prior score, adversarial survival reason: not applicable; the independently reviewed parent score was 30.5.
