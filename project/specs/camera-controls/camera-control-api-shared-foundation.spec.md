# Camera-Control API Shared Foundation Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-api-review-pass-1.md`
Split provenance: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`, child 1 of the exact split plan in independent review pass `authenticated-camera-control-read-api-pass-1`
Canonical status: Split child
Review Score: 21.5
Prerequisites:
- `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - independently approved and must be implemented first because it owns configured-device identity, `V4L2ControlError`, trusted transaction behavior, and safe foundation failures
- `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - independently approved and must be implemented first because it owns `V4L2ControlProvider`, descriptor/read methods, selected-read validation, and read failures
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines the administrator-only, configured-camera, trusted-device, safe-error, async, and authenticated OpenAPI boundary

## Source Field Carryover

- Source purpose:
  - Establish the shared API foundation consumed by camera-control read and write operations without owning either operation family's endpoint behavior.
- Source responsibilities by category:
  - Functions/methods: one provider acquisition seam and one common async route-support operation for configured-camera resolution, provider delegation, safe failure translation, and redacted observability.
  - Data structures/models: the common error response and an operation-kind discriminator needed to translate `device_io` safely for reads and writes.
  - Dependencies/services: Frigate administrator authorization plus the final transaction/identity and descriptor/live-read provider leaves.
  - Returns/outputs/signals: one process-local provider instance and either the delegated typed result or a stable safe HTTP error response.
  - UI surfaces/components: not applicable; UI behavior is owned by separate camera-control UI specifications.
  - UI fields/elements: not applicable.
  - Reusable code plan: reuse `require_role`, the HTTP authentication test harness, and the generated auth-aware OpenAPI classifier; expose one resource-family router, provider getter, route-support operation, and error response to API siblings.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: await exactly one supplied provider operation; provider thread offload, device locking, cancellation recovery, and physical-device lifetime remain provider-owned.
  - Destructive/write behavior: not applicable; this child never invokes a provider write operation and performs no physical mutation.
  - Security/privacy-sensitive behavior: require administrators at the shared router, reject camera names absent from active configuration before provider access, accept no device path, and redact provider and unexpected failures from responses and logs.
  - Performance-sensitive behavior: acquire one process-local provider and add no retry, polling, cache, device I/O, or per-control provider loop.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - The administrator convention is a router-level FastAPI dependency, domain failures use one fixed error envelope, and `device_io` translation is selected by an explicit read/write operation kind. The provider's private message and cause never cross the API or logging boundary.
- Source split/provenance notes:
  - Independent review scored the parent 26.5 and required two children: this shared foundation and `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`. The exact split assigns 100% of the parent's responsibilities. The read sibling exclusively owns the two GET operations and their success contracts. A separately owned write API sibling remains outside this split child's implementation boundary.

## Purpose

Provide one safe, administrator-only camera-control API foundation so endpoint children share the same router, provider instance, configured-camera boundary, error envelope, error translation, redaction, and OpenAPI authentication convention. This child contains no descriptor-read, bounded-value-read, mutation, provider, or frontend behavior.

## Scope

Owns:

- `frigate/api/camera_control.py` router construction with a router-level `require_role(["admin"])` dependency and one process-local provider composition point.
- Provider acquisition and common async delegation after active configured-camera resolution.
- `CameraControlErrorResponse`, the operation-kind discriminator, and the complete API-local provider-category-to-status/code/message translation shared by read and write API operations.
- Safe logging fields, response redaction, child-router inclusion from the existing camera router, and the foundation required for generated admin-auth annotations.
- Deterministic tests for router/auth metadata, configured-camera short-circuiting, provider acquisition/delegation, the complete error table, sanitization, redaction, and inclusion wiring.

Does not own:

- `GET /cameras/{camera_name}/controls`, `GET /cameras/{camera_name}/controls/values`, their success DTOs, query parsing, `get_controls`, `get_control_values`, GET schemas, or GET-specific OpenAPI assertions; `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md` owns them.
- PUT/PATCH endpoints, request DTOs, control validation, success results, physical mutation, read-back, or write-route tests.
- Provider construction internals, discovery, ioctl operations, descriptor conversion, selected-value semantics, caching, stable-device resolution, locking, disconnect recovery, or cancellation mechanics.
- Frontend rendering, browser refresh behavior, deployment, physical-camera validation, or capture restart policy.

## Split Coverage

- Parent spec: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- Parent coverage status: 100% assigned by `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-api-review-pass-1.md` across this child and the planned read-endpoint sibling; this child remains a split candidate until independent review records its status.
- Parent responsibilities owned by this child:
  - Shared router, provider composition/acquisition, administrator and configured-camera boundary, common error envelope and complete translation table, redacted observability, inclusion wiring, and deterministic shared-foundation verification.
- Parent responsibilities still missing from children:
  - none; descriptor and bounded-value GET behavior is assigned exclusively to `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-api-review-pass-1.md` | 1 | `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` | this child and `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md` | continue pending independent child review |

## Implementation Routing

- Primary modules/files:
  - `frigate/api/camera_control.py` - own the child router, router-level administrator dependency, process-local provider, provider getter, common route-support operation, operation kind, and provider-failure translation.
  - `frigate/api/defs/response/camera_control_response.py` - own `CameraControlErrorResponse` as the common camera-control error wire model.
- Supporting modules/files:
  - `frigate/api/camera.py` - include `camera_control.router` exactly once so runtime and generated-OpenAPI applications receive the same child routes.
  - `docs/static/frigate-api.yaml` - generated output only; endpoint-owning children regenerate it with `python3 generate_api_auth_spec.py`, and no implementation edits it by hand.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/api/camera_control.py` - expose `router`, `get_camera_control_provider`, `CameraControlOperationKind`, and `run_camera_control_operation` to camera-control API siblings only.
  - `frigate/api/defs/response/camera_control_response.py` - expose `CameraControlErrorResponse` to those API siblings.
  - `frigate/camera/v4l2_controls.py` - prerequisite-owned provider and categorized-error boundary; this child imports public symbols without extending provider behavior.
- Tests:
  - `frigate/test/http_api/test_http_camera_control_foundation.py` - deterministic shared router, auth metadata, provider getter, configured-camera guard, delegation, error-table, logging/redaction, and inclusion-wiring coverage.
  - `generate_api_auth_spec.py` classifier helpers - verify a probe operation attached to the shared router is classified `admin`; actual endpoint artifact refresh and operation assertions remain endpoint-child responsibilities.

## Chosen Defaults / Parameters

- `router` uses `APIRouter(tags=[Tags.camera], dependencies=[Depends(require_role(["admin"]))])`; endpoint children do not repeat or weaken this dependency.
- The module constructs exactly one process-local `V4L2ControlProvider`; `get_camera_control_provider()` returns that same instance and is the sole provider acquisition seam for API children and deterministic test replacement.
- `run_camera_control_operation` accepts `camera_name`, `operation_name`, `operation_kind`, an optional stable control ID for safe context, and one async callable that receives the validated `CameraConfig` and provider.
- The helper performs no retry, timeout substitution, cache lookup, stale-result substitution, or second provider call. Cancellation propagates unchanged after provider-owned cleanup.
- Domain failures use `{"success": false, "code": "<stable_code>", "message": "<fixed_safe_message>"}`. API-owned fixed messages are used instead of provider exception text.
- Expected categorized failures log at warning or error according to status family using only camera name, operation name, operation kind, stable control ID when supplied, and stable public category. Unexpected failures log category `camera_control_internal_error` with the same safe context and no exception interpolation or traceback.

## Data Ownership

- Source of truth: `request.app.frigate_config.cameras` owns permitted camera names and their `CameraConfig`; the process-local prerequisite provider owns live hardware access and typed categorized failures.
- Read ownership: API children acquire the provider through `get_camera_control_provider` and delegate through `run_camera_control_operation` only after configured-camera validation.
- Write ownership: this child writes no configuration, database, cache, or physical control. A write endpoint child may pass one write operation through the shared helper but retains all mutation ownership.
- Derived/cache data: the API foundation owns no cache. The process-local provider instance may use only provider-owned identity and descriptor state.
- Privacy/logging constraints: requests cannot submit a host path, resolved path, file descriptor, adapter request, or raw provider context. Responses and logs exclude device paths, authentication headers, submitted values, raw ioctl structures or payloads, raw errno text, provider messages/private causes, and unexpected exception text or traceback.

## Dependencies And Routes

- Domain/service dependencies:
  - `frigate.api.auth.require_role(["admin"])` supplies the shared router authorization marker recognized by FastAPI and `generate_api_auth_spec.py`.
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` supplies `CameraConfig.v4l2_device`, `V4L2ControlError`, trusted device identity/transaction semantics, and redacted foundation categories.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` supplies `V4L2ControlProvider`, `get_controls`, `get_control_values`, descriptors, selected-read validation, and read categories consumed by endpoint children.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable.
- Background/concurrency route, if applicable:
  - An accepted HTTP child route enters the shared router's administrator dependency, passes its request context and one provider callable to `run_camera_control_operation`, resolves the configured camera, acquires the single provider, and awaits the callable once. Blocking work, device locks, submitted-work cancellation, and disconnect invalidation remain inside the provider prerequisites.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already records the administrator, configured-camera, trusted-path, async, safe-error, and authenticated OpenAPI boundary.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - verifies the deployed stable V4L2 video route and control enumeration evidence.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - implement before API integration.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - implement after its transaction/identity prerequisite and before API integration.
- Progression handling:
  - prerequisite implementation must run first; this candidate remains `awaiting_independent_review` and makes no implementation-readiness claim.

## Application Integration

- App type: API-service.
- User/caller surface: the shared foundation beneath camera-scoped camera-control HTTP operations; this child exposes no standalone HTTP success operation.
- Invocation route: child HTTP operation, inherited router-level administrator dependency, shared configured-camera/provider helper, exactly one supplied async provider callable, typed success result or common safe error response.
- Wiring owner/module: `frigate/api/camera_control.py`, included exactly once by `frigate/api/camera.py`.
- Observable result: API children inherit administrator enforcement, cannot access an unconfigured camera or client-supplied path, receive the same provider instance, and emit the same stable error envelope and redacted logging behavior.
- Integration validation: `AuthTestClient` drives a test-only probe operation using the shared router/helper; module tests assert provider identity and one awaited delegation, while route-table/auth-classifier checks prove inclusion wiring and inherited admin metadata without asserting a GET or mutation success contract.
- Incomplete status risk: designed; this foundation requires prerequisite provider implementation, independent review, wiring, and its shared-route tests before API children can treat it as integrated.

App-type-specific proof:

- API/service: prove the inherited administrator dependency, configured-camera short-circuit, provider acquisition and one-call delegation, exact error status/code/message table, side-effect-free foundation behavior, safe observability, child-router inclusion, and generated-auth classifier recognition through a deterministic test-only probe.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `frigate.api.auth.require_role` - existing administrator enforcement and generated-auth marker.
  - `frigate.test.http_api.base_http_test.AuthTestClient` and `BaseTestHttp` - existing authenticated FastAPI route harness and minimal camera configuration.
  - `generate_api_auth_spec.py` - existing classifier and sole generator/checker for the authenticated OpenAPI artifact.
- Current reuse readiness:
  - authorization, test harness, and auth classifier are reusable as-is; provider public symbols arrive through the two final prerequisites.
- Extraction/wrapping needed:
  - none; the shared route-support operation wraps only API-local configured-camera, delegation, translation, and redaction behavior and does not wrap provider internals.
- Additions to existing library/modules:
  - `frigate/api/camera.py` - include the resource-specific child router once.
- New reusable modules to expose:
  - none; the new API and response modules are resource-specific integration boundaries, not general device libraries.
- One-off code justification, if any:
  - none; both modules are shared by camera-control API children.

## Required DTOs / Functions / Components

- DTOs/models:
  - `CameraControlErrorResponse` - `success: Literal[False] = False`, stable `code: str`, and fixed caller-safe `message: str`.
  - `CameraControlOperationKind` - API-local `read` or `write` discriminator used only to select `device_io` translation and safe operation context; it does not authorize or perform mutation.
- Functions/methods:
  - `get_camera_control_provider() -> V4L2ControlProvider` - return the module's single process-local provider instance; API siblings use this seam and tests replace the instance deterministically.
  - `run_camera_control_operation(request, camera_name, operation_name, operation_kind, operation, control_id=None) -> T | JSONResponse` - reject a camera absent from active configuration before provider acquisition, await the supplied operation once with the validated `CameraConfig` and provider, propagate cancellation, and translate categorized or unexpected failures into the common safe response while logging only permitted context.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- One process-local provider is reused by all camera-control API children; accepted operations perform one provider acquisition and one supplied async call.
- Configured-camera lookup and error translation are bounded in-memory operations. This child introduces no database query, device open, ioctl, retry, polling loop, per-control loop, or per-frame work.
- The shared helper does not offload or lock independently. Provider-owned async/thread and per-device serialization contracts remain the only blocking-I/O boundary.

## Error And State Behavior

- Existing authentication behavior returns HTTP 401 for anonymous callers and HTTP 403 for authenticated non-administrators before the child handler or provider runs.
- A camera absent from `request.app.frigate_config.cameras` returns HTTP 404, code `camera_not_configured`, message `Camera is not configured`, before provider acquisition.
- Provider category `invalid_control_ids` returns HTTP 422, code `invalid_control_ids`, message `Invalid control identifiers`; `control_not_found` returns HTTP 404, code `control_not_found`, message `Camera control was not found`.
- Provider category `not_configured` returns HTTP 409, code `camera_controls_not_configured`, message `Camera controls are not configured`.
- Provider categories `unstable_device_identity` and `device_disconnected` return HTTP 503, code `device_unavailable`, message `Camera control device is unavailable`.
- Provider category `device_io` returns HTTP 502 and either code `control_read_failed`, message `Camera control read failed`, for operation kind `read`, or code `control_write_failed`, message `Camera control write failed`, for operation kind `write`.
- Provider category `invalid_value` returns HTTP 422, code `invalid_control_value`, message `Invalid camera control value`; `unsupported_control_type` returns HTTP 422, code `unsupported_control_type`, message `Camera control type is unsupported`.
- Provider category `control_not_writable` returns HTTP 409, code `control_not_writable`, message `Camera control is not writable`; `driver_rejected` returns HTTP 409, code `control_conflict`, message `Camera control update was rejected`.
- Any unrecognized provider category and any unexpected exception returns HTTP 500, code `camera_control_internal_error`, message `Camera control operation failed`. Neither the response nor logs contain the exception message, traceback, private cause, raw payload, errno text, or path.
- `asyncio.CancelledError` is re-raised and produces no translated response, retry, or second call. All failures return no partial success and do not substitute cached values.

## Test Strategy

- Unit tests:
  - Assert the router carries one `require_role(["admin"])` dependency, the provider getter returns the identical process-local instance, configured and unconfigured camera resolution behaves deterministically, and the supplied `AsyncMock` is awaited exactly once only for a configured camera.
  - Parameterize every categorized failure and both `device_io` operation kinds to assert exact status, code, fixed message, and `success=false`; assert unknown categories and unexpected exceptions use the sanitized internal-error response.
  - Capture logs for every failure and assert only camera, operation, operation kind, optional stable ID, and stable public category appear. Seed forbidden path, authorization, value, ioctl, errno, provider-message, private-cause, and unexpected-exception sentinels and assert none appear in response or logs.
- Service/DB tests:
  - Use `BaseTestHttp.minimal_config`, a deterministic process-local provider replacement, and async callables; no database, physical device, or production configuration is required.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Attach a test-only probe operation to a router using the shared router dependencies and helper, mount it through a test FastAPI app, and use `AuthTestClient` to prove admin execution plus viewer/anonymous denial with zero provider calls.
  - Assert `frigate/api/camera.py` includes `camera_control.router` exactly once. Feed the probe route to the existing authenticated OpenAPI classifier and assert `admin`; endpoint siblings own generated artifact refresh and actual operation schema assertions.
- Production-data rule:
  - Tests must not require the user's production database, production configuration, physical C930e, or `/dev` access.

## Acceptance Criteria

- Every camera-control child route inherits one administrator dependency from the shared router, and a test-only probe is classified `admin` by the existing auth-aware OpenAPI machinery.
- The existing camera router includes the camera-control router exactly once, while endpoint-owning siblings remain the only owners of HTTP success operations and generated operation schemas.
- An unconfigured camera is rejected before provider acquisition; an accepted operation receives the active `CameraConfig` and the identical process-local provider and is awaited exactly once.
- Every documented provider category and unexpected failure maps to the exact stable status, code, and fixed safe message, including operation-specific read/write `device_io` mapping.
- Responses and captured logs contain only permitted context and exclude every seeded sensitive sentinel; cancellation propagates without translation, retry, partial success, or duplicate provider access.
- Deterministic shared foundation tests pass without production data, hardware, device paths, database access, or provider implementation details.

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
- Prior recorded score: 26.5 from independent parent review `authenticated-camera-control-read-api-pass-1`; adversarial input, not trusted for this split child.
- Adversarial rescore basis: recounted every category from this shared-foundation child only. Two functions, two API-local models, administrator plus two final-provider dependencies, provider acquisition and delegated-result/error outputs, three reused facilities, one existing-module addition, one async delegation boundary, one combined authorization/trusted-path/redaction concern, and one bounded shared-operation concern are counted. Both GET handlers and success models, selected-read semantics, mutation handlers and DTOs, physical writes, provider implementation, generated endpoint schemas, and frontend behavior are excluded. At 21.5, the candidate is in the policy's explicit split-review range; it remains cohesive because router/auth/configured-camera/provider acquisition/error translation are one inseparable API foundation used by both endpoint families and are verified through one deterministic foundation suite.
- Functions/methods: 2 x 2 = 4
- Data structures/models: 2 x 1 = 2
- Dependencies/services: 3 x 1 = 3
- Returns/outputs/signals: 2 x 1 = 2
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
- Total: 21.5
- If total matches prior score, adversarial survival reason: not applicable; the parent independent score was 26.5.
