# Authenticated Camera-Control Descriptor Read Endpoint Specification

Date: 2026-08-20
Status: Proposed
Primary ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`
Split provenance: `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`, child 1 of independent review pass `authenticated-camera-control-read-endpoints-pass-1`
Canonical status: Split child
Review Score: 22
Prerequisites:
- `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` - implemented by approved and merged PR #6 from exact head `eb59f3d6bb0a5d6a12c4fb2621bb6b3be88e7b5d`; supplies the router, administrator dependency, configured-camera guard, provider seam, error translation, cancellation, and logging contracts consumed as-is
- `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - independently approved and must be implemented first because it owns trusted device identity, transaction lifetime, cancellation recovery, and safe foundation failures
- `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - independently approved and must be implemented after its transaction prerequisite and before this route because it owns `V4L2ControlProvider.get_controls`, provider descriptors, enumeration order, metadata refresh, grouped live reads, and read failures
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines the administrator-only, configured-camera, descriptor-read, explicit-refresh, safe-error, and authenticated OpenAPI boundary

## Source Field Carryover

- Source purpose:
  - Expose the administrator-only camera-scoped descriptor read through the shared camera-control API foundation while resolving the parent review's non-scalar HTTP projection ambiguity.
- Source responsibilities by category:
  - Functions/methods: one descriptor GET handler and one explicit provider-to-HTTP descriptor projection function.
  - Data structures/models: an API-owned descriptor response model plus the descriptor collection success response.
  - Dependencies/services: the implemented shared API foundation, the final V4L2 transaction and descriptor/live-read provider leaves, and the existing authenticated OpenAPI/test pipeline.
  - Returns/outputs/signals: one typed HTTP 200 descriptor collection in provider enumeration order.
  - UI surfaces/components: not applicable; descriptor-driven UI behavior belongs to separate UI specifications.
  - UI fields/elements: not applicable.
  - Reusable code plan: consume the shared router/helper/provider/error contracts, provider descriptor/menu types, authenticated HTTP test harness, and OpenAPI generator as-is; add only the descriptor handler, explicit safe projection, and success models.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: each accepted GET awaits exactly one provider `get_controls` call through the shared helper; provider offload, locks, cancellation cleanup, and device lifetime remain provider-owned.
  - Destructive/write behavior: not applicable; this route performs a read and invokes no mutation provider method.
  - Security/privacy-sensitive behavior: inherit and prove the shared administrator and configured-camera boundary, accept no device path, explicitly prevent raw `bytes` or tuple content from entering the HTTP model, and emit only typed safe success data or foundation-owned safe errors.
  - Performance-sensitive behavior: descriptor metadata is reused by default; explicit `refresh=true` is the only endpoint request for provider re-enumeration, and each request makes one provider call.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - Resolved: provider `current_value` scalars are exposed directly. `bytes` and tuple values are never decoded, expanded, base64 encoded, or copied into JSON; the API emits `current_value: null` plus `current_value_representation: redacted_binary` or `redacted_sequence`. Provider `None` emits `unavailable`. This retains inspectable descriptor metadata without exposing raw payload content.
- Source split/provenance notes:
  - Independent review scored the parent 27 and required this descriptor child plus a selected-values sibling. This child owns only descriptor retrieval, its HTTP wire projection, descriptor-specific proof, and descriptor-generated artifact changes. Parent coverage remains 100% under that exact split plan.

## Purpose

Provide administrators with a safe ordered descriptor view for a configured V4L2 camera. This child owns one GET operation and an explicit API projection that preserves scalar current values while representing non-scalar provider values without exposing their content.

## Scope

Owns:

- `GET /cameras/{camera_name}/controls`, including `refresh=false` by default, exact explicit-refresh forwarding, one `get_controls` call, and provider enumeration-order preservation.
- `CameraControlDescriptorResponse`, `CameraControlsResponse`, and the explicit field-by-field provider descriptor projection.
- Deterministic HTTP treatment of `current_value` variants: scalar pass-through, `None` as unavailable, and content-free redaction markers for `bytes` and tuples.
- Descriptor-operation use of inherited administrator, configured-camera, safe-error, cancellation, no-retry, response-sanitization, registration, and generated administrator-auth OpenAPI contracts.

Does not own:

- `GET /cameras/{camera_name}/controls/values`, repeated `control_id` parsing, selected-value mappings, selected-ID validation, or selected-read performance.
- Router construction, provider construction/acquisition, configured-camera lookup, administrator dependency definition, common error envelope, provider-error translation, cancellation mechanics, retry policy, logging, redaction, or camera-router inclusion.
- Descriptor discovery, provider descriptor/menu types, cache storage/invalidation, device transactions, grouped ioctl reads, locking, disconnect recovery, or provider lossless-representation decisions.
- PUT/PATCH routes, request models, physical mutation, frontend rendering, polling lifecycle, deployment, capture restart policy, or physical-hardware validation.

## Split Coverage

- Parent spec: `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`
- Parent coverage status: 100% covered by this child and the reviewer-defined Authenticated Camera-Control Selected-Values Read Endpoint sibling.
- Parent responsibilities owned by this child:
  - Descriptor retrieval, explicit refresh, descriptor success output, provider-order preservation, non-scalar response safety, one-call behavior, descriptor route reachability, and descriptor OpenAPI proof.
- Parent responsibilities still missing from children:
  - none.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-endpoints-review-pass-1.md` | 1 | `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md` | this child and the Authenticated Camera-Control Selected-Values Read Endpoint definition | continue pending independent child review |

## Implementation Routing

- Primary modules/files:
  - `frigate/api/camera_control.py` - add the descriptor GET handler and field-by-field safe projection beside the shared-foundation contracts.
  - `frigate/api/defs/response/camera_control_response.py` - add the API-owned descriptor and descriptor collection success models beside the foundation-owned error response.
- Supporting modules/files:
  - `docs/static/frigate-api.yaml` - generated output only; regenerate with `python3 generate_api_auth_spec.py` and never edit it by hand.
  - `frigate/api/camera.py` - consume the existing single shared-router inclusion; this child must not add another inclusion.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/api/camera_control.py` - reuse the merged `router`, `get_camera_control_provider`, and `run_camera_control_operation` contracts.
  - `frigate/api/defs/response/camera_control_response.py` - reuse `CameraControlErrorResponse` without modification.
  - `frigate/camera/v4l2_controls.py` - consume only the provider's public `get_controls`, `V4L2ControlDescriptor`, and `V4L2MenuItem` contracts.
- Tests:
  - `frigate/test/http_api/test_http_camera_controls.py` - deterministic descriptor authorization, exact delegation, ordered projection, non-scalar safety, failure, cancellation, sanitization, and registration coverage.
  - `generate_api_auth_spec.py --check` - generated artifact freshness plus descriptor operation schema and administrator classification proof.

## Chosen Defaults / Parameters

- The endpoint accepts boolean query parameter `refresh`, defaulting to `false`, and forwards its exact value to `get_controls(camera_config, refresh=refresh)`.
- Provider `bool`, `int`, and `str` current values become the same JSON scalar with `current_value_representation: scalar`. Provider `None` becomes JSON null with `current_value_representation: unavailable`.
- Provider `bytes`, including empty bytes and invalid UTF-8, become JSON null with `current_value_representation: redacted_binary`. The implementation must not decode, base64 encode, hash, log, or otherwise serialize the bytes.
- Provider tuples, including empty, scalar, compound, and array tuples, become JSON null with `current_value_representation: redacted_sequence`. The implementation must not iterate values into the response, stringify, hash, log, or otherwise serialize tuple contents.
- Descriptor output preserves provider tuple order. Menu items, dimensions, flags, and other non-value metadata preserve provider order and typed values.
- The handler invokes `run_camera_control_operation` once with read operation kind and one async provider callable. It performs no retry, stale substitution, polling, API cache access, or second provider call.

## Data Ownership

- Source of truth: the live driver and provider-owned descriptors from `frigate/camera/v4l2_controls.py`; active camera configuration remains foundation-owned provider input.
- Read ownership: administrators call the descriptor GET; the shared helper supplies the validated `CameraConfig` and provider to the endpoint-owned read callable.
- Write ownership: not applicable; this child writes no configuration, database, provider cache, or physical control.
- Derived/cache data: the API stores no descriptor cache. It creates a transient typed HTTP projection from one provider result; provider metadata cache behavior remains authoritative in the provider prerequisite.
- Privacy/logging constraints: the operation accepts camera name and boolean refresh only. It accepts or exposes no host path, file descriptor, raw ioctl structure, raw bytes, tuple element content, raw payload, raw errno, authentication value, provider private cause, or exception text. Scalar descriptor values are caller-visible success data but must not be added to logs.

## Dependencies And Routes

- Domain/service dependencies:
  - `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` supplies the implemented router, administrator dependency, configured-camera/provider helper, stable error envelope, translation, cancellation, and redacted observability.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` supplies `V4L2ControlProvider.get_controls`, `V4L2ControlDescriptor`, `V4L2MenuItem`, provider order, metadata refresh, grouped live reads, and categorized failures.
  - `AuthTestClient` and `generate_api_auth_spec.py` supply authenticated production-route proof and the generated auth-aware API artifact pipeline.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable.
- Background/concurrency route, if applicable:
  - An authenticated request enters the mounted shared router, FastAPI parses `refresh`, the handler passes one read callable to `run_camera_control_operation`, the helper awaits exactly one provider `get_controls` call, and the handler explicitly projects the returned tuple. Provider thread offload, per-device serialization, cancellation recovery, and disconnect invalidation remain provider-owned. API cancellation propagates without translation, projection, or a second call.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already records the administrator, configured-camera, trusted-path, async, safe-error, descriptor-read, explicit-refresh, and authenticated OpenAPI boundary.
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
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - implement after transaction/identity and before endpoint integration.
- Progression handling:
  - prerequisite provider implementation must run first; this candidate remains `awaiting_independent_review` and makes no implementation-readiness claim.

## Application Integration

- App type: API-service.
- User/caller surface: `GET /cameras/{camera_name}/controls`.
- Invocation route: authenticated HTTP GET, inherited router-level administrator dependency, endpoint `refresh` parsing, foundation-owned configured-camera/provider helper, exactly one async provider descriptor read, explicit safe projection, and typed HTTP response.
- Wiring owner/module: `frigate/api/camera_control.py`, already included by `frigate/api/camera.py` through the merged foundation.
- Observable result: an administrator receives provider-ordered descriptor metadata with scalar values or content-free non-scalar representation markers; denied or failed operations receive existing authorization behavior or the foundation-owned stable safe error response.
- Integration validation: route-level `AuthTestClient` tests with a deterministic async provider replacement, plus regenerated `docs/static/frigate-api.yaml`, `python3 generate_api_auth_spec.py --check`, and descriptor-operation path/schema/admin assertions.
- Incomplete status risk: designed; this child requires independent review, provider prerequisite implementation, endpoint wiring, generated artifact refresh, and route tests before the descriptor surface is integrated.

App-type-specific proof:

- API/service: prove the exact GET path, inherited administrator enforcement, exact `refresh` forwarding, one provider await, provider-order preservation, complete field projection, exact scalar and non-scalar JSON behavior, safe read failures, cancellation/no retry, absence of sensitive payload content, router reachability, and generated administrator annotation.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `frigate.api.camera_control.router`, `get_camera_control_provider`, and `run_camera_control_operation` - merged routing, provider, guard, error, cancellation, and observability contracts.
  - `V4L2ControlProvider.get_controls`, `V4L2ControlDescriptor`, and `V4L2MenuItem` - provider-owned descriptor and refresh semantics.
  - `frigate.test.http_api.base_http_test.AuthTestClient` and `BaseTestHttp` - established authenticated route harness and minimal configured-camera fixture.
  - `generate_api_auth_spec.py` - sole generator/checker for the authenticated OpenAPI artifact.
- Current reuse readiness:
  - the shared API foundation, test harness, and generator are reusable as-is; provider public symbols arrive through the two approved provider prerequisites.
- Extraction/wrapping needed:
  - none; the endpoint-owned projection is a private field-by-field API boundary, not a wrapper around provider behavior.
- Additions to existing library/modules:
  - `frigate/api/camera_control.py` - add one descriptor handler and private projection function without changing shared contracts.
  - `frigate/api/defs/response/camera_control_response.py` - add two descriptor success response models without changing the common error model.
- New reusable modules to expose:
  - none.
- One-off code justification, if any:
  - the private projection is required at the provider-to-HTTP trust boundary so raw non-scalar values cannot reach generic serialization.

## Required DTOs / Functions / Components

- DTOs/models:
  - `CameraControlDescriptorResponse` - copies the provider descriptor's public identity, name, class/type, numeric range/default metadata, menu items, full normalized flags, element size/count/dimensions, and derived `active`, `writable`, and `read_supported` fields; adds `current_value: bool | int | str | None` and `current_value_representation: Literal["scalar", "unavailable", "redacted_binary", "redacted_sequence"]`. No field accepts `bytes`, tuple values, or arbitrary objects.
  - `CameraControlsResponse` - `success: Literal[True] = True`, `camera: str`, and `controls: tuple[CameraControlDescriptorResponse, ...]` in provider enumeration order.
- Functions/methods:
  - `_to_camera_control_descriptor_response(descriptor: V4L2ControlDescriptor) -> CameraControlDescriptorResponse` - explicitly copy every allowed metadata field, pass through only scalar current values, map `None`, `bytes`, and tuple shapes to the exact representation markers above, and never use generic dataclass/model dumping for the provider object.
  - `get_camera_controls(request, camera_name, refresh=False) -> CameraControlsResponse | JSONResponse` - pass one callable through the shared helper that awaits `provider.get_controls(camera_config, refresh=refresh)` once, project every returned descriptor, and preserve tuple order.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Ordinary descriptor GETs use `refresh=false`, reuse provider metadata for the current identity generation, and still receive provider-owned fresh live values. Only explicit `refresh=true` requests metadata/menu re-enumeration.
- Each accepted request makes exactly one `get_controls` call. The API projection is one bounded O(number of returned descriptors plus their already-materialized metadata) pass and performs no device access, retry, polling, cache operation, or per-control provider call.
- Provider enumeration remains O(reported controls plus menu spans), and live reads remain at most one grouped value request per represented control class. Blocking device work remains outside FastAPI and capture workers through the prerequisites.

## Error And State Behavior

- Anonymous callers receive HTTP 401 and authenticated non-administrators receive HTTP 403 through the inherited router dependency before handler/provider access.
- A camera absent from active configuration returns the foundation's HTTP 404 `camera_not_configured` before provider access.
- Provider `not_configured` becomes HTTP 409 `camera_controls_not_configured`; `unstable_device_identity` and `device_disconnected` become HTTP 503 `device_unavailable`; read-side `device_io` becomes HTTP 502 `control_read_failed`.
- Unknown provider categories and unexpected exceptions use the foundation-owned sanitized HTTP 500 response. The handler does not reinterpret status, code, fixed message, logging, or redaction.
- A valid descriptor containing `bytes` or tuple `current_value` is a successful HTTP 200 response with the exact redacted representation, not an encoding error and not a request failure.
- Cancellation propagates through the shared helper and provider cleanup before projection. No failure or cancellation returns partial descriptors, retries, substitutes stale data, or invokes a second provider method.

## Test Strategy

- Unit tests:
  - Assert field-by-field projection preserves every provider descriptor metadata field, menu/flag/dimension ordering, and scalar `bool`, `int`, and `str` values with `scalar`; assert `None` becomes `unavailable`.
  - Assert empty and non-empty bytes, invalid UTF-8 bytes, empty and non-empty tuples, and tuples containing unique string/number sentinels become null plus the exact redaction marker. Assert no provider object dump path is used and no raw bytes, base64, decoded text, tuple element, or stringified tuple appears.
  - Assert the handler supplies read operation kind and awaits only `get_controls` once with exact `CameraConfig` and omitted/default, explicit false, or explicit true refresh.
- Service/DB tests:
  - Replace the shared process-local provider deterministically with an `AsyncMock`; use minimal configured-camera fixtures and no database, physical device, or production configuration.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Drive the production descriptor path through `AuthTestClient`; assert admin HTTP 200, viewer HTTP 403, anonymous HTTP 401, configured-camera short-circuit, provider order, exact safe JSON projection for all current-value variants, foundation error table, cancellation/no retry, single route registration, and generated descriptor schema/admin classification.
- Production-data rule:
  - Tests must not require the user's production database, production configuration, physical C930e, or `/dev` access.

## Acceptance Criteria

- `GET /cameras/{camera_name}/controls` is reachable exactly once for administrators, defaults `refresh` to false, forwards false or true exactly, awaits `get_controls` once, and preserves provider descriptor order.
- The success response contains only explicitly modeled descriptor fields. Scalar values survive exactly; `None`, bytes, and tuples use their specified null-plus-marker projections, and raw payload content never appears in response, logs, validation errors, or generated examples.
- Denied, unconfigured, failed, and cancelled calls retain the shared foundation's exact behavior with zero or one provider await as applicable, no retry, and no partial success.
- The generated API artifact names the descriptor success and shared error schemas and classifies the exact GET operation as administrator-only.
- Deterministic tests prove non-scalar projection, descriptor refresh performance, production-route wiring, and OpenAPI behavior without production data or hardware.

## Readiness Checklist

- [x] Primary ancestor and architecture ancestor are explicit.
- [x] Review Score appears in the front matter and exactly matches the total in the final Review Score Calculation section.
- [x] The current implementation-spec template was loaded and its source path is recorded in the final Review Score Calculation section.
- [x] Review Score is adversarially recounted from the current spec text; prior scores are challenged instead of trusted.
- [x] Unresolved deferral/gap markers are absent.
- [x] Source fields are carried into spec sections or preserved as explicit provenance/history.
- [x] Canonical status is explicit.
- [x] Prerequisites are linked and implementation order is explicit.
- [x] Missing or stale prerequisite architecture is not applicable; the active ACD already owns the boundary.
- [x] Missing prerequisite behavior is not applicable; final prerequisite specs are linked.
- [x] Split coverage is 100%.
- [x] The independent split ledger records the latest new-leaf definitions.
- [x] Implementation owner/module is named.
- [x] Existing code reuse/extraction decision is explicit.
- [x] Existing module additions and no-new-module boundary are named.
- [x] UI fields/elements are not applicable.
- [x] Chosen defaults are explicit.
- [x] Data source of truth and write owner are explicit.
- [x] Concurrency route is explicit.
- [x] App type and application integration route are explicit.
- [x] Integrated route validation is named.
- [x] API-service proof matches the app type.
- [x] Performance bounds are explicit.
- [x] Privacy/logging constraints are explicit.
- [x] Test strategy does not depend on production data.
- [x] Acceptance criteria are testable.

## Review Score Calculation

- Template source: `../.agents/process/templates/implementation-spec-template.md`
- Prior recorded score: 27 for the independently reviewed two-endpoint parent; adversarial input, not trusted for this child.
- Adversarial rescore basis: recounted every category from this descriptor endpoint only. The handler and explicit safe projection are separate functions; the HTTP descriptor and collection models are separate DTOs; the implemented shared foundation, provider prerequisite, and authenticated OpenAPI/test pipeline are dependencies; one ordered success response, four reused contract groups, two existing-module additions, one inherited async route, one privacy boundary, and one descriptor refresh/projection performance responsibility are counted. Selected-value parsing, selected-read bounds and output, shared-foundation implementation, provider mechanics, writes, UI, database work, and new modules are excluded.
- Functions/methods: 2 x 2 = 4
- Data structures/models: 2 x 1 = 2
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
- Total: 22
- If total matches prior score, adversarial survival reason: not applicable; the parent independent score was 27.
