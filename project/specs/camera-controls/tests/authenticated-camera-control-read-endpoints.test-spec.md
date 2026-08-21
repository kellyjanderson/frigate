# Authenticated Camera-Control Read Endpoints Test Specification

Date: 2026-08-20
Status: Proposed
Feature spec: `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`
Feature spec canonical status: Split child awaiting independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify the two administrator-only camera-control GET operations through the real FastAPI registration route. Prove exact one-call delegation to `get_controls` and `get_control_values`, ordered typed responses, inherited shared-foundation behavior, stable read failures, cancellation/no retry, and generated OpenAPI schema/auth entries without retesting foundation or provider internals.

## Application Integration Under Test

- App type: API-service.
- User/caller surface: `GET /cameras/{camera_name}/controls` and `GET /cameras/{camera_name}/controls/values`.
- Invocation route: authenticated HTTP GET, merged router administrator dependency, endpoint query parsing, foundation configured-camera/provider helper, one mocked async provider read, and typed response.
- Wiring owner/module: `frigate/api/camera_control.py`, already included once by `frigate/api/camera.py` through the shared foundation.
- Observable result: ordered descriptors or ordered selected live values for an administrator, existing auth denial, or the foundation-owned stable safe error.
- Integration validation: `AuthTestClient` drives both production routes with a deterministic provider replacement; generated-artifact checks prove both operation schemas and admin classification.

## Manual Smoke

- In a non-production test app with configured camera `front_door` and a deterministic provider replacement, call descriptor GET with omitted, false, and true `refresh`; confirm exact ordered descriptors and one matching `get_controls` call per request.
- Call values GET with repeated canonical `control_id` entries; confirm the provider receives the unchanged list once and the JSON `values` keys retain provider/request order. Repeat as viewer and anonymous and confirm HTTP 403/401 with zero provider access.
- Regenerate the OpenAPI artifact, inspect both GET paths, and confirm intended success/error models plus administrator classification. Do not edit the generated YAML by hand.

## Automated Smoke Tests

- Mount the existing camera router through the standard test application, replace the shared provider, call `GET /cameras/front_door/controls`, and assert HTTP 200 plus one awaited `get_controls(camera_config, refresh=False)` call.
- Call `GET /cameras/front_door/controls/values?control_id=0x00980900&control_id=0x00980901`, assert one awaited `get_control_values(camera_config, ["0x00980900", "0x00980901"])` call, and assert the response preserves provider mapping order.
- Run `python3 generate_api_auth_spec.py --check` after regeneration and assert both GET operations are present, use the intended schemas, and are classified admin.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Serialize deterministic `CameraControlsResponse` and `CameraControlValuesResponse` instances and assert exact fields, scalar value types, descriptor order, and mapping order.
  - Assert descriptor handler passes read operation kind through the shared helper and awaits `get_controls` once with exact `CameraConfig` and omitted/default, explicit false, or explicit true refresh.
  - Assert values handler passes FastAPI's repeated `control_id` list unchanged through the shared helper and awaits `get_control_values` once with the exact `CameraConfig` and list. The test must fail if the API calls `get_controls`, validates canonical IDs, performs membership lookup, reorders entries, or calls once per ID.
- Integrated route behavior:
  - Drive both exact production paths through `AuthTestClient`; assert admin HTTP 200, viewer HTTP 403, and anonymous HTTP 401, with zero handler/provider access for denied requests.
  - Assert a camera absent from active configuration returns the foundation's HTTP 404 `camera_not_configured` before provider access and that neither query accepts a client-supplied device path.
  - For descriptor GET, return multiple descriptors in nonnumeric provider order and assert exact HTTP order for default and explicit refresh.
  - For values GET, return a nonalphabetic ordered mapping and assert exact JSON key order. Verify provider-owned `invalid_control_ids` and `control_not_found` translate through the shared foundation with no partial values.
  - Parameterize `not_configured`, `unstable_device_identity`, `device_disconnected`, and read-side `device_io`; assert the exact shared status/code/fixed-message envelope and no second call. Assert an unknown category and unexpected exception use the sanitized internal-error response.
  - Seed returned/failure fixtures with forbidden host path, authorization, ioctl, payload, errno, private-cause, and exception-text sentinels. Assert success exposes only modeled descriptor/value data and failures expose none of the forbidden details; do not duplicate the foundation's log-table suite.
  - Assert `frigate/api/camera.py` exposes each GET path exactly once through the existing shared-router inclusion.
  - Regenerate `docs/static/frigate-api.yaml`, run its check command, and assert both GET operations reference `CameraControlsResponse`, `CameraControlValuesResponse`, and `CameraControlErrorResponse` as applicable and carry admin auth classification.
- Failure and stale-result behavior, if applicable:
  - Omit `control_id` and assert FastAPI HTTP 422 before handler/provider access. Pass present malformed, duplicate, empty-equivalent, or over-limit collections to the mocked provider unchanged and assert its `invalid_control_ids` becomes the shared safe response.
  - Cancel each provider await and assert cancellation propagates with no translated response, retry, stale substitution, partial success, second provider method, or API-owned cleanup attempt.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - Production-route tests prove exact paths, caller/auth behavior, query parsing, configured-camera boundary, provider method and arguments, one-call side-effect-free reads, ordered response/error contracts, and observability-safe output. Generated artifact checks prove the documented admin API surface.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - not applicable.

## Fixtures And Data

- `BaseTestHttp.minimal_config` with configured camera `front_door`, plus an unconfigured name.
- A deterministic replacement for the merged process-local provider with `AsyncMock` methods `get_controls` and `get_control_values`.
- Multiple `V4L2ControlDescriptor` fixtures in intentionally nonnumeric order and ordered selected-value mappings containing boolean, integer, string, and null values.
- One `V4L2ControlError` fixture for each read category, plus invalid IDs, absent ID, unknown category, unexpected exception, and cancellation fixtures.
- Unique forbidden sentinels for host/resolved paths, authorization values, raw ioctl structures/payloads, errno text, provider private causes, and exception text.
- Admin, viewer, and anonymous callers through `AuthTestClient`; repository OpenAPI generator/checker output.
- Production-data rule: tests must not require production data, production configuration, a database, physical camera, or `/dev` access.

## Acceptance

- [ ] Feature spec remains explicitly a split child awaiting independent review.
- [ ] Route-level proof exists for both production GET operations through the real shared-router registration path.
- [ ] Helper-only or provider-only tests cannot satisfy this API-service feature contract.
- [ ] Exact provider method, arguments, one awaited call, descriptor/value order, stable errors, cancellation/no retry, and generated admin-schema results are asserted.
- [ ] The suite proves the API delegates provider-owned selected-ID validation, membership, ordering, and read semantics without reimplementing or retesting their ioctl mechanics.
- [ ] Mutation/write behavior, shared-foundation implementation details, and physical-hardware behavior remain outside this test specification.
