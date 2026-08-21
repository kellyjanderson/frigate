# Authenticated Camera-Control Read Endpoints Specification

Date: 2026-08-20
Status: Proposed
Primary ancestor: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-api-review-pass-1.md`
Split provenance: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`, child 2 of the exact split plan in independent review pass `authenticated-camera-control-read-api-pass-1`
Canonical status: Split child
Review Score: 23
Prerequisites:
- `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` - implemented by approved and merged PR #6 from exact head `eb59f3d6bb0a5d6a12c4fb2621bb6b3be88e7b5d`; supplies the router, administrator dependency, configured-camera guard, provider seam, error translation, cancellation, and logging contracts consumed as-is
- `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - independently approved and must be implemented first because it owns trusted device identity, transaction lifetime, cancellation recovery, and safe foundation failures
- `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - independently approved and must be implemented after its transaction prerequisite and before these routes because it owns `V4L2ControlProvider.get_controls`, `get_control_values`, selected-ID validation, ordering, and read failures
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines the administrator-only, configured-camera, trusted-device, async, safe-error, and authenticated OpenAPI boundary

## Source Field Carryover

- Source purpose:
  - Expose administrator-only camera-scoped descriptor and selected live-value reads through the shared camera-control API foundation.
- Source responsibilities by category:
  - Functions/methods: two GET handlers, one for descriptors and one for bounded selected live values.
  - Data structures/models: descriptor success and selected-values success response models; provider descriptors and scalar value types remain authoritative.
  - Dependencies/services: the implemented shared API foundation and the final V4L2 transaction and descriptor/live-read provider leaves.
  - Returns/outputs/signals: an ordered descriptor collection or an ordered serialized-ID-to-live-value mapping, each in a typed HTTP 200 response.
  - UI surfaces/components: not applicable; descriptor-driven UI behavior belongs to separate UI specifications.
  - UI fields/elements: not applicable.
  - Reusable code plan: consume the shared router/helper/provider/error contracts, provider read methods, authenticated HTTP test harness, and generated auth-aware OpenAPI pipeline as-is; add only GET handlers and their success models.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: each accepted GET awaits exactly one provider read through the shared helper; provider offload, locks, cancellation cleanup, and device lifetime remain provider-owned.
  - Destructive/write behavior: not applicable; these routes perform reads only and invoke no mutation provider method.
  - Security/privacy-sensitive behavior: inherit and prove the shared administrator and configured-camera boundary, accept no device path, and emit only typed success data or foundation-owned safe errors.
  - Performance-sensitive behavior: descriptor refresh is explicit, selected reads are limited by the provider's 1 through 64 unique canonical-ID contract, and each request makes one provider call.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - Repeated `control_id` query parameters are parsed by FastAPI and passed unchanged to `get_control_values`. The API does not duplicate canonical-ID, uniqueness, bound, ordering, selected-read, or missing-control semantics owned by the provider.
- Source split/provenance notes:
  - Independent review scored the parent 26.5 and required two children. The merged shared-foundation sibling owns all common API contracts. This child exclusively owns the two GET operations, their success models, GET-specific application of the inherited authorization contract, read responses, and generated operation proof. Mutation and write routes remain separate.

## Purpose

Provide administrators with safe descriptor and selected current-value reads for a configured V4L2 camera. This child adds only the two read operations and consumes the merged shared API foundation and approved provider contracts without redefining either.

## Scope

Owns:

- `GET /cameras/{camera_name}/controls`, including `refresh=false` by default, explicit refresh forwarding, exactly one `get_controls` call, and provider descriptor-order preservation.
- `GET /cameras/{camera_name}/controls/values`, including repeated-query parsing, exactly one `get_control_values` call, and direct ordered projection of the provider mapping.
- `CameraControlsResponse`, `CameraControlValuesResponse`, GET-specific HTTP 200 response bodies, and GET operation schemas.
- GET route tests for inherited administrator authorization, exact provider delegation, read failures, cancellation/no retry, response sanitization, route registration, and generated admin-auth OpenAPI entries.

Does not own:

- Router construction, provider construction/acquisition, configured-camera lookup, administrator dependency definition, common error envelope, provider-error translation, cancellation mechanics, retry policy, logging, redaction, or camera-router inclusion; the implemented shared-foundation sibling owns these contracts.
- Canonical-ID validation, the 1 through 64 unique-ID bound, missing-ID detection, order preservation, selected V4L2 reads, descriptor discovery, cache behavior, device transactions, locking, or disconnect recovery; the provider prerequisites own these contracts.
- PUT/PATCH endpoints, write request models, physical mutation, validation, read-back, write failures, or write-route proof.
- Frontend rendering, polling lifecycle, deployment, capture restart policy, or physical-hardware validation.

## Split Coverage

- Parent spec: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- Parent coverage status: 100% covered by this child and `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` under the exact independent split plan.
- Parent responsibilities owned by this child:
  - Descriptor retrieval, selected-value refresh, the two read success models, GET-specific authorization application and response behavior, GET registration, and generated GET schema/auth verification.
- Parent responsibilities still missing from children:
  - none.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-api-review-pass-1.md` | 1 | `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` | `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` and this child | continue pending independent child review |

## Implementation Routing

- Primary modules/files:
  - `frigate/api/camera_control.py` - add the two GET handlers to the shared-foundation router and delegate through `run_camera_control_operation`.
  - `frigate/api/defs/response/camera_control_response.py` - add the two read success wire models beside the foundation-owned error response.
- Supporting modules/files:
  - `docs/static/frigate-api.yaml` - generated output only; regenerate with `python3 generate_api_auth_spec.py` and never edit it by hand.
  - `frigate/api/camera.py` - consume the shared foundation's existing router inclusion; this child must not add a second inclusion.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/api/camera_control.py` - reuse the merged `router`, `get_camera_control_provider`, and `run_camera_control_operation` contracts.
  - `frigate/api/defs/response/camera_control_response.py` - reuse `CameraControlErrorResponse` without modification.
  - `frigate/camera/v4l2_controls.py` - consume only the provider's public `get_controls`, `get_control_values`, and descriptor/value types.
- Tests:
  - `frigate/test/http_api/test_http_camera_controls.py` - deterministic GET authorization, exact delegation, response, failure, cancellation, sanitization, and registration coverage.
  - `generate_api_auth_spec.py --check` - generated artifact freshness plus GET schema and administrator classification proof.

## Chosen Defaults / Parameters

- Descriptor GET accepts boolean query parameter `refresh`, defaulting to `false`; the handler forwards its exact value to `get_controls(camera_config, refresh=refresh)`.
- Values GET requires one or more repeated `control_id` string query parameters. FastAPI owns presence and list-shape parsing; the handler passes the resulting list unchanged to `get_control_values(camera_config, control_ids)`.
- The provider exclusively validates canonical form, uniqueness, the 1 through 64 bound, and membership in active descriptors. The API performs no second validation or ordered lookup.
- Both success operations return HTTP 200. Descriptor output preserves provider tuple order; values output preserves provider mapping iteration order in the serialized JSON object.
- Each handler invokes `run_camera_control_operation` once with read operation kind and one async provider callable. It performs no retry, stale substitution, polling, cache access, or second provider call.

## Data Ownership

- Source of truth: live hardware state and provider-owned descriptors/selected values from `frigate/camera/v4l2_controls.py`; active camera configuration remains foundation-owned input to the provider.
- Read ownership: administrators call these GET operations; the shared helper supplies the validated `CameraConfig` and provider to exactly one endpoint-owned read callable.
- Write ownership: not applicable to this child; no configuration, database, cache, or physical control is written.
- Derived/cache data: the API stores no descriptor or value cache and creates only the typed HTTP projection of one provider result.
- Privacy/logging constraints: the operations accept camera name, boolean refresh, and serialized control IDs only. They accept or expose no host path, file descriptor, raw ioctl structure, raw payload, raw errno, authentication value, provider private cause, or exception text; logging behavior remains foundation-owned.

## Dependencies And Routes

- Domain/service dependencies:
  - `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` supplies the implemented router, inherited administrator dependency, configured-camera/provider helper, stable error envelope, translation, cancellation, and redacted observability.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` supplies `V4L2ControlProvider.get_controls`, `get_control_values`, `V4L2ControlDescriptor`, ordered results, selected-ID validation, and categorized read failures.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable; a separate UI specification consumes these HTTP operations.
- Background/concurrency route, if applicable:
  - Authenticated request enters the already-mounted shared router, FastAPI parses endpoint query shape, the handler passes one read callable to `run_camera_control_operation`, and the helper awaits exactly one provider method. The provider owns thread offload, per-device serialization, submitted-work cancellation recovery, and disconnect invalidation. API cancellation propagates without translation or a second call.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already records the administrator, configured-camera, trusted-path, async, safe-error, read-endpoint, and authenticated OpenAPI boundary.
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
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - implement before provider/read-endpoint integration.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - implement after transaction/identity and before read-endpoint integration.
- Progression handling:
  - prerequisite provider implementation must run first; this candidate remains `awaiting_independent_review` and makes no implementation-readiness claim.

## Application Integration

- App type: API-service.
- User/caller surface: `GET /cameras/{camera_name}/controls` and `GET /cameras/{camera_name}/controls/values`.
- Invocation route: authenticated HTTP GET, inherited router-level administrator dependency, endpoint query parsing, foundation-owned configured-camera/provider helper, exactly one async provider read, and typed HTTP response.
- Wiring owner/module: `frigate/api/camera_control.py`, already included by `frigate/api/camera.py` through the merged foundation.
- Observable result: an administrator receives an ordered descriptor collection or an ordered serialized-ID-to-current-value mapping; denied or failed operations receive the existing authorization behavior or foundation-owned stable error response.
- Integration validation: route-level `AuthTestClient` tests with a deterministic async provider replacement, plus regenerated `docs/static/frigate-api.yaml`, `python3 generate_api_auth_spec.py --check`, and operation-level path/schema/admin assertions for both GET routes.
- Incomplete status risk: designed; this child requires independent review, provider prerequisite implementation, endpoint wiring, generated artifact refresh, and route tests before the read surface is integrated.

App-type-specific proof:

- API/service: prove both exact GET paths, inherited administrator enforcement, query-shape behavior, exact provider method/arguments/await count, ordered response bodies, shared safe read failures, cancellation/no retry, absence of sensitive data, router reachability, and generated administrator annotations.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `frigate.api.camera_control.router`, `get_camera_control_provider`, and `run_camera_control_operation` - merged shared API routing, provider, guard, error, cancellation, and observability contracts.
  - `V4L2ControlProvider.get_controls` and `get_control_values` - approved provider-owned complete and selected read semantics.
  - `frigate.test.http_api.base_http_test.AuthTestClient` and `BaseTestHttp` - established authenticated route harness and minimal configured-camera fixture.
  - `generate_api_auth_spec.py` - sole generator/checker for the authenticated OpenAPI artifact.
- Current reuse readiness:
  - the shared API foundation, test harness, and generator are reusable as-is; provider public symbols arrive through the two approved provider prerequisites.
- Extraction/wrapping needed:
  - none; each handler supplies a bounded read callable to the existing shared helper and directly projects the provider result.
- Additions to existing library/modules:
  - `frigate/api/camera_control.py` - add two resource-family GET handlers without changing shared contracts.
  - `frigate/api/defs/response/camera_control_response.py` - add two read success response models without changing the common error model.
- New reusable modules to expose:
  - none; no module is created by this child.
- One-off code justification, if any:
  - none; both operations and models form the stable camera-control read API surface.

## Required DTOs / Functions / Components

- DTOs/models:
  - `CameraControlsResponse` - `success: Literal[True] = True`, `camera: str`, and `controls: tuple[V4L2ControlDescriptor, ...]` in provider enumeration order.
  - `CameraControlValuesResponse` - `success: Literal[True] = True`, `camera: str`, and `values: dict[str, bool | int | str | None]` inserted and serialized in the provider mapping's request-preserving order.
- Functions/methods:
  - `get_camera_controls(request, camera_name, refresh=False) -> CameraControlsResponse | JSONResponse` - pass one callable through the shared helper that awaits `provider.get_controls(camera_config, refresh=refresh)` once and wraps the ordered result.
  - `get_camera_control_values(request, camera_name, control_id) -> CameraControlValuesResponse | JSONResponse` - pass FastAPI's repeated `control_id` list unchanged through one shared-helper callable that awaits `provider.get_control_values(camera_config, control_id)` once and wraps the ordered mapping.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Ordinary descriptor GETs use `refresh=false`; only explicit `refresh=true` requests provider re-enumeration.
- Each accepted GET makes exactly one provider method call. The API performs no per-control provider loop, ordered lookup, device access, retry, polling, or cache operation.
- Values GET inherits the provider's 1 through 64 unique-ID limit and single selected-read operation. Blocking device work remains outside the FastAPI event loop and capture workers through the provider prerequisites.

## Error And State Behavior

- Anonymous callers receive HTTP 401 and authenticated non-administrators receive HTTP 403 through the inherited router dependency, before either handler/provider operation runs.
- Missing required `control_id` query shape is rejected by FastAPI with HTTP 422 before handler/provider access. Present lists are delegated unchanged; provider `invalid_control_ids` becomes the foundation's HTTP 422 `invalid_control_ids`, including empty-equivalent, malformed, duplicate, or over-limit collections.
- Provider `control_not_found` becomes HTTP 404 `control_not_found`; `not_configured` becomes HTTP 409 `camera_controls_not_configured`; `unstable_device_identity` and `device_disconnected` become HTTP 503 `device_unavailable`; read-side `device_io` becomes HTTP 502 `control_read_failed`.
- An unconfigured camera, unknown provider category, and unexpected exception use the existing foundation-owned safe responses. The handlers do not reinterpret status, code, message, logging, or redaction.
- Cancellation propagates through the shared helper and provider cleanup. No failure or cancellation returns partial descriptors/values, retries, substitutes stale data, or invokes a second provider method.

## Test Strategy

- Unit tests:
  - Assert success-model serialization preserves provider descriptor and selected-value order and contains exactly `success`, `camera`, and the operation-specific result field.
  - Assert each handler supplies read operation kind and awaits only its exact provider method once with the validated `CameraConfig` and exact query argument.
- Service/DB tests:
  - Replace the shared process-local provider deterministically with an `AsyncMock`; use minimal configured-camera fixtures and no database, physical device, or production configuration.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Drive both production GET routes through `AuthTestClient`; assert admin success, viewer/anonymous denial, default/explicit descriptor refresh, repeated-ID passthrough, exact provider method/arguments and one awaited call, ordered HTTP output, configured-camera short-circuiting, shared read failures, cancellation/no retry, sensitive-sentinel exclusion, and single shared-router registration.
  - Regenerate `docs/static/frigate-api.yaml`, run `python3 generate_api_auth_spec.py --check`, and assert both GET operations reference their success/error schemas and carry administrator auth classification.
- Production-data rule:
  - Tests must not require the user's production database, production configuration, physical C930e, or `/dev` access.

## Acceptance Criteria

- Both GET paths are reachable through the foundation's existing camera-router inclusion, inherit administrator authorization, and appear with the intended success/error schemas and admin classification in the regenerated OpenAPI artifact.
- Descriptor GET defaults `refresh` to false, forwards either boolean exactly, awaits `get_controls` once, and returns descriptors in provider order.
- Values GET passes FastAPI's repeated serialized-ID list unchanged, awaits `get_control_values` once, and returns the provider's selected live-value mapping in request order without duplicating provider validation or selection.
- Denied, malformed-shape, unconfigured-camera, categorized read-failure, unexpected-failure, and cancellation paths perform no extra provider call, return no partial/stale success, and expose no sensitive provider or device detail.
- Deterministic route tests and generated artifact checks prove the real API-service route without production data or physical hardware, while mutation/write behavior remains outside this child.

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
- Adversarial rescore basis: recounted every category from this read-endpoint child only. Two GET handlers, two success models, the merged shared API foundation plus both final provider prerequisites, two HTTP success result shapes, four reused contract groups, two additions to existing resource-family modules, one async provider-delegation boundary, one inherited authorization/trusted-input/redaction concern, and one bounded one-call read concern are counted. Shared router/helper/provider acquisition/error/logging implementation, provider validation/selection/device mechanics, mutation routes/models, physical writes, and frontend behavior are excluded. At 23, the candidate is in the policy's explicit split-review range; it remains cohesive because both GET operations are one read-only resource surface, use the same merged router/helper and response module, depend on the same provider read contract, share generated OpenAPI registration, and are verified by one route suite.
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
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 23
- If total matches prior score, adversarial survival reason: not applicable; the independently reviewed parent score was 26.5.
