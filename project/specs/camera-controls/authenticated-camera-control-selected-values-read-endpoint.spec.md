# Authenticated Camera-Control Selected-Values Read Endpoint Specification

Date: 2026-08-20
Status: Proposed
Primary ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-endpoints-review-pass-1.md`
Split provenance: `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`, selected-values child assigned by independent review pass `authenticated-camera-control-read-endpoints-pass-1`
Canonical status: Split child
Review Score: 19
Prerequisites:
- `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` - implemented by approved and merged PR #6 from exact head `eb59f3d6bb0a5d6a12c4fb2621bb6b3be88e7b5d`; supplies the router, administrator dependency, configured-camera guard, provider seam, error translation, cancellation, and logging contracts consumed as-is
- `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - independently approved and must be implemented first because it owns trusted device identity, transaction lifetime, cancellation recovery, and safe foundation failures
- `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - independently approved and must be implemented after its transaction prerequisite and before this route because it owns `V4L2ControlProvider.get_control_values`, selected-ID validation, ordering, bounds, and read failures
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines the administrator-only, configured-camera, trusted-device, async, safe-error, selected-value-read, and authenticated OpenAPI boundary

## Source Field Carryover

- Source purpose:
  - Expose one administrator-only camera-scoped endpoint for bounded selected live-value reads through the shared camera-control API foundation.
- Source responsibilities by category:
  - Functions/methods: one GET handler for selected current values.
  - Data structures/models: one selected-values success response model; provider scalar value types remain authoritative.
  - Dependencies/services: the implemented shared API foundation plus the final V4L2 transaction and descriptor/live-read provider leaves.
  - Returns/outputs/signals: one typed HTTP 200 response containing an ordered serialized-ID-to-live-value mapping.
  - UI surfaces/components: not applicable; descriptor-driven UI behavior belongs to separate UI specifications.
  - UI fields/elements: not applicable.
  - Reusable code plan: consume the shared router/helper/provider/error contracts, `get_control_values`, authenticated HTTP test harness, and generated auth-aware OpenAPI pipeline as-is; add only the selected-values handler and success model.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: each accepted GET awaits exactly one provider selected read through the shared helper; provider offload, locks, cancellation cleanup, and device lifetime remain provider-owned.
  - Destructive/write behavior: not applicable; this route performs reads only and invokes no mutation provider method.
  - Security/privacy-sensitive behavior: inherit and prove the shared administrator and configured-camera boundary, accept no device path, and emit only typed scalar success data or foundation-owned safe errors.
  - Performance-sensitive behavior: selected reads retain the provider's 1 through 64 unique canonical-ID bound and execute as one selected provider call rather than a per-ID loop.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - Repeated `control_id` query parameters are parsed by FastAPI and passed unchanged to `get_control_values`. The API does not duplicate canonical-ID, uniqueness, bounds, membership, ordering, selected-read, or missing-control semantics owned by the provider.
- Source split/provenance notes:
  - Independent review scored the read-endpoints parent 27 and required two endpoint children with 100% coverage. This child owns only selected-values success behavior, bounded delegation, scalar ordered output, and its route proof. The descriptor sibling owns descriptor projection and refresh. Shared-foundation contracts and mutation/write behavior remain outside this child.

## Purpose

Provide administrators with a safe bounded read of selected current V4L2 camera-control values. This child adds one values endpoint and consumes the merged shared API foundation and approved provider contracts without redefining them.

## Scope

Owns:

- `GET /cameras/{camera_name}/controls/values`, including required repeated-query parsing and unchanged delegation to exactly one `V4L2ControlProvider.get_control_values(camera_config, control_ids)` call.
- `CameraControlValuesResponse`, HTTP 200 behavior, and direct ordered projection of the provider's scalar mapping.
- Propagation through the shared foundation of provider-owned canonical-ID, uniqueness, 1 through 64 bound, missing-ID, ordering, and selected-read failures without API reimplementation.
- Values-route tests for inherited administrator authorization, exact provider delegation, response ordering and scalar bounds, missing-ID behavior, cancellation/no retry, sanitization, route registration, and generated administrator-auth OpenAPI entries.

Does not own:

- Descriptor projection, descriptor refresh, `get_controls`, `CameraControlsResponse`, descriptor schemas, or descriptor route proof; the descriptor endpoint sibling owns them.
- Router construction, provider construction/acquisition, configured-camera lookup, administrator dependency definition, common error envelope, provider-error translation, cancellation mechanics, retry policy, logging, redaction, or camera-router inclusion; the implemented shared foundation owns these contracts.
- Canonical-ID validation, the 1 through 64 unique-ID check, missing-ID detection, order preservation, selected V4L2 reads, descriptor discovery, cache behavior, device transactions, locking, or disconnect recovery; the provider prerequisites own these contracts.
- PUT/PATCH endpoints, write request models, physical mutation, validation, read-back, write failures, frontend rendering, deployment, capture restart policy, or physical-hardware validation.

## Split Coverage

- Parent spec: `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`
- Parent coverage status: 100% covered by this child and the descriptor endpoint child under independent review pass `authenticated-camera-control-read-endpoints-pass-1`.
- Parent responsibilities owned by this child:
  - Repeated selected-ID query parsing, bounded `get_control_values` delegation, selected-values success model and HTTP response, ordered scalar output, provider-owned invalid/missing-ID failure propagation, values-route registration, generated values-operation schema/auth proof, and paired route verification.
- Parent responsibilities still missing from children:
  - none.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-endpoints-review-pass-1.md` | 1 | `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md` | this child and the authenticated descriptor-read endpoint child | continue pending independent child review |

## Implementation Routing

- Primary modules/files:
  - `frigate/api/camera_control.py` - add the selected-values GET handler to the shared-foundation router and delegate through `run_camera_control_operation`.
  - `frigate/api/defs/response/camera_control_response.py` - add `CameraControlValuesResponse` beside the foundation-owned error response.
- Supporting modules/files:
  - `docs/static/frigate-api.yaml` - generated output only; regenerate with `python3 generate_api_auth_spec.py` and never edit it by hand.
  - `frigate/api/camera.py` - consume the shared foundation's existing router inclusion; this child must not add a second inclusion.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/api/camera_control.py` - reuse the merged `router`, `get_camera_control_provider`, and `run_camera_control_operation` contracts.
  - `frigate/api/defs/response/camera_control_response.py` - reuse `CameraControlErrorResponse` without modification.
  - `frigate/camera/v4l2_controls.py` - consume only the provider's public `get_control_values` and scalar value types.
- Tests:
  - `frigate/test/http_api/test_http_camera_controls.py` - deterministic selected-values authorization, exact delegation, response, bounds, ordering, missing-ID, failure, cancellation, sanitization, and registration coverage.
  - `generate_api_auth_spec.py --check` - generated artifact freshness plus selected-values schema and administrator classification proof.

## Chosen Defaults / Parameters

- Values GET requires one or more repeated `control_id` string query parameters. FastAPI owns presence and list-shape parsing; the handler passes the resulting list unchanged to `get_control_values(camera_config, control_ids)`.
- The provider exclusively validates canonical form, uniqueness, the 1 through 64 bound, and membership in active descriptors. The API performs no second validation, membership lookup, reordering, or per-ID read.
- Success returns HTTP 200 with `success`, `camera`, and `values`. The `values` JSON object preserves provider mapping iteration order, which is the provider's request-preserving order.
- The handler invokes `run_camera_control_operation` once with read operation kind and one async provider callable. It performs no retry, stale substitution, polling, cache access, or second provider call.

## Data Ownership

- Source of truth: provider-owned selected live hardware values from `frigate/camera/v4l2_controls.py`; active camera configuration remains foundation-owned input to the provider.
- Read ownership: administrators call this GET operation; the shared helper supplies the validated `CameraConfig` and provider to exactly one endpoint-owned selected read callable.
- Write ownership: not applicable; this child writes no configuration, database, cache, or physical control.
- Derived/cache data: the API stores no value cache and creates only the typed HTTP projection of one provider result.
- Privacy/logging constraints: the operation accepts camera name and serialized control IDs only. It accepts or exposes no host path, file descriptor, raw ioctl structure, raw payload, raw errno, authentication value, provider private cause, or exception text; logging remains foundation-owned.

## Dependencies And Routes

- Domain/service dependencies:
  - `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` supplies the implemented router, inherited administrator dependency, configured-camera/provider helper, stable error envelope, translation, cancellation, and redacted observability.
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` supplies trusted device identity, transaction lifetime, and cancellation recovery used by the provider.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` supplies `V4L2ControlProvider.get_control_values`, ordered scalar results, selected-ID validation, bounds, missing-ID detection, and categorized read failures.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable; a separate UI specification consumes this HTTP operation.
- Background/concurrency route, if applicable:
  - An authenticated request enters the already-mounted shared router, FastAPI parses the repeated query, the handler passes one read callable to `run_camera_control_operation`, and the helper awaits `get_control_values` exactly once. The provider owns thread offload, per-device serialization, submitted-work cancellation recovery, and disconnect invalidation. API cancellation propagates without translation or a second call.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already records the administrator, configured-camera, trusted-path, async, safe-error, selected-value-read, and authenticated OpenAPI boundary.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` - approved and merged as PR #6 from exact head `eb59f3d6bb0a5d6a12c4fb2621bb6b3be88e7b5d`, with no review findings.
  - `project/architecture/current-camera-runtime.md` - verifies the deployed stable V4L2 video route and hardware control-enumeration evidence.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - implement before provider and endpoint integration.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - implement after transaction/identity and before selected-values endpoint integration.
- Progression handling:
  - prerequisite provider implementation must run first; this candidate remains `awaiting_independent_review` and makes no implementation-readiness claim.

## Application Integration

- App type: API-service.
- User/caller surface: `GET /cameras/{camera_name}/controls/values`.
- Invocation route: authenticated HTTP GET, inherited router-level administrator dependency, repeated-query parsing, foundation-owned configured-camera/provider helper, exactly one async selected provider read, and typed HTTP response.
- Wiring owner/module: `frigate/api/camera_control.py`, already included by `frigate/api/camera.py` through the merged foundation.
- Observable result: an administrator receives an ordered serialized-ID-to-current-scalar-value mapping; denied or failed operations receive the existing authorization behavior or foundation-owned stable error response.
- Integration validation: route-level `AuthTestClient` tests with a deterministic async provider replacement, plus regenerated `docs/static/frigate-api.yaml`, `python3 generate_api_auth_spec.py --check`, and selected-values operation path/schema/admin assertions.
- Incomplete status risk: designed; this child requires independent review, provider prerequisite implementation, endpoint wiring, generated artifact refresh, and route tests before the selected-values surface is integrated.

App-type-specific proof:

- API/service: prove the exact GET path, inherited administrator enforcement, query-shape behavior, exact provider method/arguments/await count, ordered scalar response body, provider-owned bound and missing-ID failures, shared safe read failures, cancellation/no retry, absence of sensitive data, router reachability, and generated administrator annotation.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `frigate.api.camera_control.router`, `get_camera_control_provider`, and `run_camera_control_operation` - merged shared API routing, provider, guard, error, cancellation, and observability contracts.
  - `V4L2ControlProvider.get_control_values` - approved provider-owned selected read, validation, bound, ordering, and missing-ID semantics.
  - `frigate.test.http_api.base_http_test.AuthTestClient` and `BaseTestHttp` - established authenticated route harness and minimal configured-camera fixture.
  - `generate_api_auth_spec.py` - sole generator/checker for the authenticated OpenAPI artifact.
- Current reuse readiness:
  - the shared API foundation, test harness, and generator are reusable as-is; the provider public method arrives through the two approved provider prerequisites.
- Extraction/wrapping needed:
  - none; the handler supplies one bounded read callable to the existing shared helper and directly projects the provider result.
- Additions to existing library/modules:
  - `frigate/api/camera_control.py` - add one resource-family GET handler without changing shared contracts.
  - `frigate/api/defs/response/camera_control_response.py` - add one selected-values success response model without changing the common error model.
- New reusable modules to expose:
  - none; no module is created by this child.
- One-off code justification, if any:
  - none; the handler and model form the stable selected-values API operation.

## Required DTOs / Functions / Components

- DTOs/models:
  - `CameraControlValuesResponse` - `success: Literal[True] = True`, `camera: str`, and `values: dict[str, bool | int | str | None]` inserted and serialized in the provider mapping's request-preserving order.
- Functions/methods:
  - `get_camera_control_values(request, camera_name, control_id) -> CameraControlValuesResponse | JSONResponse` - pass FastAPI's repeated `control_id` list unchanged through one shared-helper callable that awaits `provider.get_control_values(camera_config, control_id)` once and wraps the ordered mapping.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Values GET inherits the provider's 1 through 64 unique-ID limit and single selected-read operation.
- Each accepted GET makes exactly one `get_control_values` call. The API performs no per-control provider loop, descriptor enumeration, ordered membership lookup, device access, retry, polling, or cache operation.
- Blocking device work remains outside the FastAPI event loop and capture workers through the provider prerequisites.

## Error And State Behavior

- Anonymous callers receive HTTP 401 and authenticated non-administrators receive HTTP 403 through the inherited router dependency, before handler or provider access.
- Missing required `control_id` query shape is rejected by FastAPI with HTTP 422 before handler/provider access. Present lists are delegated unchanged; provider `invalid_control_ids` becomes the foundation's HTTP 422 `invalid_control_ids`, including empty-equivalent, malformed, duplicate, zero-ID, or over-64-ID collections.
- Provider `control_not_found` becomes HTTP 404 `control_not_found`; `not_configured` becomes HTTP 409 `camera_controls_not_configured`; `unstable_device_identity` and `device_disconnected` become HTTP 503 `device_unavailable`; read-side `device_io` becomes HTTP 502 `control_read_failed`.
- An unconfigured camera, unknown provider category, and unexpected exception use the existing foundation-owned safe responses. The handler does not reinterpret status, code, message, logging, or redaction.
- Cancellation propagates through the shared helper and provider cleanup. No failure or cancellation returns partial values, retries, substitutes stale data, or invokes a second provider method.

## Test Strategy

- Unit tests:
  - Assert success-model serialization preserves provider selected-value order and contains exactly `success`, `camera`, and `values`, with boolean, integer, string, and null values.
  - Assert the handler supplies read operation kind and awaits only `get_control_values` once with the validated `CameraConfig` and exact repeated-query list.
- Service/DB tests:
  - Replace the shared process-local provider deterministically with an `AsyncMock`; use minimal configured-camera fixtures and no database, physical device, or production configuration.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Drive the production values GET through `AuthTestClient`; assert admin success, viewer/anonymous denial, missing-query rejection, unchanged repeated-ID passthrough, exact provider arguments and one awaited call, ordered scalar HTTP output, configured-camera short-circuiting, provider-owned invalid/missing-ID failures, shared read failures, cancellation/no retry, sensitive-sentinel exclusion, and single shared-router registration.
  - Regenerate `docs/static/frigate-api.yaml`, run `python3 generate_api_auth_spec.py --check`, and assert the values GET references `CameraControlValuesResponse` and `CameraControlErrorResponse` as applicable and carries administrator auth classification.
- Production-data rule:
  - Tests must not require the user's production database, production configuration, physical C930e, or `/dev` access.

## Acceptance Criteria

- `GET /cameras/{camera_name}/controls/values` is reachable through the foundation's existing camera-router inclusion, inherits administrator authorization, and appears with the intended success/error schemas and admin classification in the regenerated OpenAPI artifact.
- The route passes FastAPI's repeated serialized-ID list unchanged, awaits `get_control_values` exactly once, and returns the provider's boolean, integer, string, or null selected live-value mapping in request order without duplicating provider validation, bounds, membership, ordering, or selection.
- Missing query shape, denied caller, unconfigured camera, zero/duplicate/over-limit/invalid ID collection, missing ID, categorized read failure, unexpected failure, and cancellation paths perform no extra provider call, return no partial or stale success, and expose no sensitive provider or device detail.
- Deterministic route tests and generated artifact checks prove the real API-service route without production data or physical hardware, while descriptor projection/refresh, shared-foundation implementation, and mutation/write behavior remain outside this child.

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
- Prior recorded score: 27 from independent parent review `authenticated-camera-control-read-endpoints-pass-1`; adversarial input, not trusted for this split child.
- Adversarial rescore basis: independently recounted every category from this selected-values endpoint only. One GET handler, one success model, three prerequisite service contracts, one HTTP success result, four reused contract groups, two additions to existing resource-family modules, one async provider-delegation boundary, one inherited authorization/trusted-input/redaction concern, and one bounded selected-read concern are counted. Descriptor projection/refresh, shared router/helper/provider acquisition/error/logging implementation, provider validation/device mechanics, mutation routes/models, physical writes, and frontend behavior are excluded. At 19, the candidate is in the policy's explicit split-review range and remains cohesive because it is one independently ownable endpoint, one success model, one provider method, one generated operation, and one bounded route-test surface.
- Functions/methods: 1 x 2 = 2
- Data structures/models: 1 x 1 = 1
- Dependencies/services: 3 x 1 = 3
- Returns/outputs/signals: 1 x 1 = 1
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 4 x 0.5 = 2
- Adding code to an existing library/module: 2 x 1 = 2
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
- Total: 19
- If total matches prior score, adversarial survival reason: not applicable; the independently reviewed parent score was 27.
