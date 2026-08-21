# Authenticated Camera-Control API Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `dispatch-280945bb-a158-48c8-94a3-a21695661b86` combined provider/API work order and its `specification_sizing_gap`
Split provenance: `dispatch-280945bb-a158-48c8-94a3-a21695661b86`; this child owns ACD Required Specification Leaf 3 only
Canonical status: Split child
Review Score: 24.5
Prerequisites:
- `project/specs/camera-controls/v4l2-camera-control-provider.spec.md` - must define and implement the configured-camera provider contract, typed control DTOs, failure categories, async isolation, and per-device serialization consumed by these routes
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines the administrator-only, camera-scoped API and trusted-device boundary

## Source Field Carryover

- Source purpose:
  - Expose the camera-control provider through a stable administrator-only HTTP contract without absorbing Linux V4L2 discovery or ioctl behavior.
- Source responsibilities by category:
  - Functions/methods: three camera-scoped handlers retrieve descriptors, refresh a bounded set of current values, and update one control.
  - Data structures/models: one write request model and a cohesive response/error model family preserve provider descriptor and value types on the wire.
  - Dependencies/services: Frigate administrator authorization and the sibling V4L2 camera-control provider.
  - Returns/outputs/signals: typed HTTP success envelopes and stable categorized error responses.
  - UI surfaces/components: not applicable; the descriptor-driven UI is a separate child.
  - UI fields/elements: not applicable.
  - Reusable code plan: reuse Frigate route authorization, provider DTOs/failures, the HTTP test harness, and the generated auth-aware OpenAPI pipeline.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: handlers await the provider's async facade; no ioctl or other blocking device operation runs on the FastAPI event loop.
  - Destructive/write behavior: the update route performs one physical-camera control write and returns the provider's read-back value.
  - Security/privacy-sensitive behavior: every route requires the administrator role, accepts only a configured camera name and serialized control ID, and never accepts or exposes a device path.
  - Performance-sensitive behavior: current-value refresh accepts between 1 and 64 unique control IDs; descriptor refresh is explicit rather than per request by default.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - Chosen defaults are individual writes, explicit descriptor refresh, a 64-control refresh bound, and stable provider-to-HTTP error mapping.
- Source split/provenance notes:
  - The sizing prerequisite separated the provider and HTTP API into independently ownable ACD leaves. This child excludes provider implementation; `project/specs/camera-controls/v4l2-camera-control-provider.spec.md` owns it.

## Purpose

Provide administrators with a typed camera-scoped API for discovering, polling, and changing physical camera controls. The slice is the cohesive HTTP boundary over the V4L2 provider and does not implement device resolution, caching, serialization, or ioctl operations.

## Scope

Owns:

- Administrator-only routes for descriptor retrieval, bounded value refresh, and one-control update.
- Camera-name validation, provider delegation, wire DTOs, stable HTTP error mapping, router registration, generated OpenAPI auth metadata, and deterministic mocked-provider route tests.

Does not own:

- V4L2 descriptor discovery, menu expansion, value reads, writes, read-back, device locks, cache invalidation, reconnect handling, or filesystem/udev resolution.
- Descriptor-driven UI, volatile polling lifecycle in the browser, VM/device deployment, capture restart policy, or physical hardware validation.
- Batch or atomic multi-control writes. Individual writes are the chosen API default for this child.

## Split Coverage

- Parent spec: `none`; the source was a combined pre-authoring work order that terminated with a sizing gap before a candidate artifact was written.
- Parent coverage status: not applicable.
- Parent responsibilities owned by this child:
  - Authenticated camera-scoped API, provider routing, HTTP DTOs/errors, OpenAPI regeneration, and mocked route proof.
- Parent responsibilities still missing from children:
  - none; the sibling work order assigns provider responsibilities to `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/authenticated-camera-control-api-candidate.md` | not applicable before independent review | `project/specs/camera-controls/authenticated-camera-control-api.spec.md` | not applicable | not applicable |

## Implementation Routing

- Primary modules/files:
  - `frigate/api/camera_control.py` - own the child router, one process-local `V4L2ControlProvider` instance, three handlers, configured-camera guard, and provider-failure-to-HTTP mapping.
  - `frigate/api/defs/request/camera_control_body.py` - own the scalar/button write request body.
  - `frigate/api/defs/response/camera_control_response.py` - own success envelopes and the stable error-code model.
- Supporting modules/files:
  - `frigate/api/camera.py` - include the child router in the existing camera router already mounted by the runtime app and auth-aware OpenAPI generator.
  - `generate_api_auth_spec.py` - reuse unchanged as the auth-aware generator for the already-registered camera router.
  - `docs/static/frigate-api.yaml` - generated output only; regenerate it with `python3 generate_api_auth_spec.py` and never edit it manually.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/camera/v4l2_controls.py` from the prerequisite - expose `V4L2ControlProvider`, `V4L2ControlDescriptor`, and `V4L2ControlError` through the async `get_controls` and `set_control` boundary used by the API.
- Tests:
  - `frigate/test/http_api/test_http_camera_controls.py` - deterministic administrator, validation, provider-delegation, error-mapping, and returned-read-back route coverage.
  - `generate_api_auth_spec.py --check` - generated artifact freshness and admin classification proof.

## Chosen Defaults / Parameters

- `GET /cameras/{camera_name}/controls` returns cached descriptors when valid; query parameter `refresh=false` is the default and `refresh=true` requests provider re-enumeration.
- `GET /cameras/{camera_name}/controls/values` requires repeated `control_id` query parameters containing 1 through 64 unique stable serialized IDs. Duplicates or an out-of-bound list return HTTP 422 without calling the provider.
- `PUT /cameras/{camera_name}/controls/{control_id}` updates one control. Its body is `{"value": ...}` where value uses the provider's supported scalar wire union; a button action uses `null`.
- Successful descriptor and value reads return HTTP 200. A successful update returns HTTP 200 with the provider descriptor/value produced by post-write read-back.
- Domain failures use `{"success": false, "code": "<stable_code>", "message": "<safe_message>"}`. Filesystem paths, ioctl payloads, and raw errno text are not returned.

## Data Ownership

- Source of truth: live hardware state behind `frigate/camera/v4l2_controls.py`; descriptors and values returned by the API are provider-owned DTOs.
- Read ownership: administrators read through the three camera-scoped routes; the handler resolves only names present in `request.app.frigate_config.cameras` before provider delegation.
- Write ownership: the provider is the sole physical-device write owner; the API validates the camera/control/value wire contract and awaits one provider write.
- Derived/cache data: descriptor cache and disconnect invalidation belong to the provider and can be reconstructed from the configured camera and device.
- Privacy/logging constraints: log camera name, stable control ID, stable failure category, and operation at appropriate levels; do not log device paths, raw ioctl structures, authentication headers, or submitted string control values.

## Dependencies And Routes

- Domain/service dependencies:
  - `frigate.api.camera_control.camera_control_provider` is one process-local instance of the prerequisite's `V4L2ControlProvider`; each handler passes the validated `CameraConfig`, never a client-supplied path. Tests patch this instance with an `AsyncMock`.
  - `require_role(["admin"])` is attached explicitly to all three routes so runtime enforcement and generated auth classification agree.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable; the sibling UI consumes these HTTP contracts.
- Background/concurrency route, if applicable:
  - Each async handler performs validation and then awaits exactly one provider operation. The provider owns thread offload and per-device locking. Request cancellation does not create an API-side retry or second write; the provider write/read-back operation remains the serialization authority.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already records the camera-scoped, administrator-only, trusted-path, async, error, and OpenAPI obligations.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - verifies that Linux owns and exposes the working C930e V4L2 device to Frigate.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none; the workflow reserves `project/specs/camera-controls/v4l2-camera-control-provider.spec.md` for the sibling provider contract.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/v4l2-camera-control-provider.spec.md` - must be independently approved and implemented before this API child can be integrated.
- Progression handling:
  - prerequisite implementation must run first; this candidate remains `awaiting_independent_review` and must not be represented as implementation-ready.

## Application Integration

- App type: API-service.
- User/caller surface: `/cameras/{camera_name}/controls`, `/cameras/{camera_name}/controls/values`, and `/cameras/{camera_name}/controls/{control_id}`.
- Invocation route: authenticated HTTP request to registered FastAPI router, configured-camera validation, async provider call, typed HTTP response.
- Wiring owner/module: `frigate/api/camera_control.py`, included once by `frigate/api/camera.py`; the existing camera router registration carries the child routes into both runtime and generated-OpenAPI apps.
- Observable result: an administrator receives descriptors, refreshed values, or the driver's read-back result; invalid or unavailable operations receive a stable safe error.
- Integration validation: route-level `AuthTestClient` tests with a mocked provider plus `python3 generate_api_auth_spec.py --check` and assertions that all three generated operations are annotated admin.
- Incomplete status risk: designed; child-router inclusion, generated artifact refresh, and route proof are required integration gates.

App-type-specific proof:

- API/service: prove exact paths/methods, administrator enforcement, query/body validation, configured-camera restriction, provider call arguments, stable success/error bodies, single write delegation, read-back response, no raw path disclosure, and generated admin annotations.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `frigate.api.auth.require_role` - explicit administrator enforcement recognized by the auth artifact generator.
  - `frigate.test.http_api.base_http_test.AuthTestClient` and `BaseTestHttp` - established route-level authentication and application fixture.
  - `generate_api_auth_spec.py` - sole generator and checker for `docs/static/frigate-api.yaml`.
  - Provider DTOs and categorized exceptions from `frigate/camera/v4l2_controls.py` - preserve one domain contract across provider and API.
- Current reuse readiness:
  - auth, test harness, and generator are reusable as-is; provider symbols are supplied by the prerequisite.
- Extraction/wrapping needed:
  - none; map provider exceptions to HTTP responses in the API router without wrapping or reimplementing the provider.
- Additions to existing library/modules:
  - `frigate/api/camera.py` includes `camera_control.router`; its existing runtime and generator registrations remain the single top-level route authority.
- New reusable modules to expose:
  - none; the router and wire models are specific to this API surface.
- One-off code justification, if any:
  - `frigate/api/camera_control.py` is an API integration module with one resource family; it is not a general device-control library.

## Required DTOs / Functions / Components

- DTOs/models:
  - `CameraControlWriteBody` - `value: bool | int | str | None`; `None` is accepted only for button controls and domain validation remains provider-authoritative.
  - Camera-control response family - success variants carry `camera`, provider descriptors or value records, and the update read-back descriptor/value; `CameraControlErrorResponse` carries `success=false`, stable `code`, and safe `message`.
- Functions/methods:
  - `get_camera_controls(request, camera_name, refresh=False) -> CameraControlsResponse` - validate configured camera and await `get_controls(camera_config, refresh=refresh)`.
  - `get_camera_control_values(request, camera_name, control_id) -> CameraControlValuesResponse` - enforce 1 through 64 unique IDs, await one `get_controls(camera_config, refresh=False)`, reject requested IDs absent from the result, and project only the requested ID/current-value pairs.
  - `put_camera_control(request, camera_name, control_id, body) -> CameraControlUpdateResponse` - await `set_control(camera_config, control_id, value)` and return its read-back descriptor.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Descriptor enumeration is requested only when `refresh=true`; ordinary descriptor GETs use the provider's valid cache.
- A value refresh contains at most 64 unique IDs and produces one provider call. The API never polls, loops over separate provider calls, or performs per-frame work.
- Device work is awaited through the provider's async facade, so blocking ioctl activity does not occupy the FastAPI event loop or capture workers.

## Error And State Behavior

- HTTP 401 and 403 preserve Frigate's existing authentication and `require_role(["admin"])` response contracts; viewer and anonymous route tests assert both statuses.
- HTTP 404 `camera_not_configured` is returned before provider access when `camera_name` is absent from active Frigate configuration. HTTP 404 `control_not_found` maps provider category `control_not_found`, including a requested refresh ID absent from the returned descriptors.
- HTTP 422 covers FastAPI query/body shape validation and the stable domain codes `invalid_control_ids`, `invalid_control_value`, and `unsupported_control_type`; provider access is not attempted for request-shape failures. Provider categories `invalid_value` and `unsupported_control_type` map to the latter two codes.
- HTTP 409 `camera_controls_not_configured` maps provider category `not_configured`; HTTP 409 `control_not_writable` maps provider category `control_not_writable`; HTTP 409 `control_conflict` maps `driver_rejected`.
- HTTP 503 `device_unavailable` maps `unstable_device_identity` and `device_disconnected`.
- HTTP 502 `control_read_failed` or `control_write_failed` maps provider category `device_io` according to the operation. An update response does not claim success when set or read-back fails.
- Unexpected provider exceptions are logged with traceback server-side and return HTTP 500 `camera_control_internal_error` without raw exception text.
- Each failure response includes only the camera name when useful, stable control ID when useful, stable category, and safe message. Retry timing is caller-controlled; the API performs no implicit retry, cache substitution, or duplicate write.

## Test Strategy

- Unit tests:
  - Validate the query bound/deduplication and complete provider-failure-to-status/code table without a physical device.
- Service/DB tests:
  - Use a deterministic async mocked provider installed on the test app; no database migration or production camera is required.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Exercise all three HTTP routes through `AuthTestClient`, assert administrator access and viewer/anonymous denial, exact provider call arguments, success bodies, no call for malformed/unconfigured requests, and every stable provider error mapping.
  - Generate/check `docs/static/frigate-api.yaml` and assert each operation's admin access annotation and request/response schema references.
- Production-data rule:
  - Tests must not require the user's production database or physical C930e.

## Acceptance Criteria

- All three routes are included through the existing camera router, explicitly require administrator role, and appear as admin in the regenerated OpenAPI artifact.
- Requests cannot specify a host/device path; an unconfigured camera is rejected before the provider is called.
- Descriptor retrieval, bounded value refresh, and one-control update each await exactly one corresponding mocked-provider operation with the specified arguments.
- Update success returns the provider's post-write read-back result, and every specified provider failure maps to the documented stable status/code without exposing raw filesystem or ioctl details.
- Query/body bounds, viewer/anonymous denial, malformed input, unavailable device, non-writable control, write failure, and unexpected failure are covered by deterministic route tests without production data or hardware.
- `python3 generate_api_auth_spec.py --check` succeeds after the generated artifact is regenerated.

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
- Prior recorded score: source combined-body floor 27; adversarial input, not trusted for this split child.
- Adversarial rescore basis: recounted every category from this child only, treating the three explicit handlers separately, treating request and response/error model families separately, and checking for hidden provider implementation, route registration, security, write, async, performance, prerequisite, and verification responsibilities.
- Functions/methods: 3 x 2 = 6
- Data structures/models: 2 x 1 = 2
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 1 x 1 = 1
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 3 x 0.5 = 1.5
- Adding code to an existing library/module: 1 x 1 = 1
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
- Total: 24.5
- If total matches prior score, adversarial survival reason: not applicable; the prior score covered the unsplit provider/API body and does not match this child.
