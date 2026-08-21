# Authenticated Camera-Control Selected-Values Read Endpoint Test Specification

Date: 2026-08-20
Status: Proposed
Feature spec: `project/specs/camera-controls/authenticated-camera-control-selected-values-read-endpoint.spec.md`
Feature spec canonical status: Split child awaiting independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify the administrator-only selected-values GET operation through the real FastAPI registration route. Prove unchanged repeated-ID delegation to exactly one `get_control_values` call, provider-owned 1 through 64 bounds and missing-ID behavior, ordered scalar response projection, inherited shared-foundation behavior, cancellation/no retry, and generated OpenAPI schema/auth entries without retesting foundation or provider internals.

## Application Integration Under Test

- App type: API-service.
- User/caller surface: `GET /cameras/{camera_name}/controls/values`.
- Invocation route: authenticated HTTP GET, merged router administrator dependency, repeated-query parsing, foundation configured-camera/provider helper, one mocked async selected provider read, and typed response.
- Wiring owner/module: `frigate/api/camera_control.py`, already included once by `frigate/api/camera.py` through the shared foundation.
- Observable result: ordered selected live values for an administrator, existing auth denial, or the foundation-owned stable safe error.
- Integration validation: `AuthTestClient` drives the production route with a deterministic provider replacement; generated-artifact checks prove the operation schemas and admin classification.

## Manual Smoke

- In a non-production test app with configured camera `front_door` and a deterministic provider replacement, call the values GET with repeated canonical `control_id` entries. Confirm the provider receives the unchanged list once and the JSON `values` keys retain provider/request order.
- Repeat as viewer and anonymous and confirm HTTP 403/401 with zero handler/provider access. Omit `control_id` and confirm FastAPI HTTP 422 before handler/provider access.
- Regenerate the OpenAPI artifact, inspect the values GET path, and confirm its success/error models plus administrator classification. Do not edit the generated artifact manually.

## Automated Smoke

- Run the focused HTTP API tests containing the selected-values route cases with `python3 -u -m unittest`.
- Run `python3 generate_api_auth_spec.py`, then `python3 generate_api_auth_spec.py --check`.
- Assert the generated values operation references `CameraControlValuesResponse` and `CameraControlErrorResponse` as applicable and is annotated for administrator access.

## Automated Regression

- Handler and response contract:
  - Assert `CameraControlValuesResponse` serializes exactly `success`, `camera`, and `values`, preserving a deliberately nonalphabetic provider mapping order across boolean, integer, string, and null values.
  - Assert the handler passes read operation kind through the shared helper and awaits `get_control_values` exactly once with the validated `CameraConfig` and FastAPI's repeated `control_id` list unchanged.
  - Make the test fail if the API calls `get_controls`, validates canonical IDs, checks uniqueness or the 1 through 64 bound, performs descriptor membership lookup, reorders entries, loops per ID, or invokes a second provider method.
- Integrated route behavior:
  - Drive the exact production path through `AuthTestClient`; assert admin HTTP 200, viewer HTTP 403, and anonymous HTTP 401, with zero handler/provider access for denied requests.
  - Assert a camera absent from active configuration returns the foundation's HTTP 404 `camera_not_configured` before provider access and that the query cannot supply a device path.
  - Return a nonalphabetic ordered mapping for repeated IDs and assert exact JSON key order and boolean, integer, string, and null values.
  - Pass present malformed, duplicate, empty-equivalent, zero-ID, and over-64-ID lists to the mocked provider unchanged. Have it raise `invalid_control_ids`; assert the exact shared HTTP 422 response and one provider call rather than API-local validation.
  - Have the provider report `control_not_found` for one requested ID; assert the exact shared HTTP 404 response, no partial values, unchanged complete request list, and one provider call.
  - Parameterize `not_configured`, `unstable_device_identity`, `device_disconnected`, and read-side `device_io`; assert the exact shared status/code/fixed-message envelope and no second call. Assert an unknown category and unexpected exception use the sanitized internal-error response.
  - Seed returned/failure fixtures with forbidden host path, authorization, ioctl, payload, errno, private-cause, and exception-text sentinels. Assert success exposes only modeled scalar values and failures expose none of the forbidden details; do not duplicate the foundation's log-table suite.
  - Assert `frigate/api/camera.py` exposes the values GET exactly once through the existing shared-router inclusion.
  - Regenerate `docs/static/frigate-api.yaml`, run its check command, and assert the values operation references `CameraControlValuesResponse` and `CameraControlErrorResponse` as applicable and carries admin auth classification.
- Failure and stale-result behavior, if applicable:
  - Omit `control_id` and assert FastAPI HTTP 422 before handler/provider access.
  - Cancel the provider await and assert cancellation propagates with no translated response, retry, stale substitution, partial success, second provider method, or API-owned cleanup attempt.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - Production-route tests prove the exact path, caller/auth behavior, repeated-query parsing, configured-camera boundary, provider method and arguments, one-call side-effect-free selected read, ordered scalar response, provider-owned bound/missing-ID failures, safe errors, and observability-safe output. Generated artifact checks prove the documented admin API surface.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - not applicable.

## Fixtures And Data

- `BaseTestHttp.minimal_config` with configured camera `front_door`, plus an unconfigured name.
- A deterministic replacement for the merged process-local provider with `AsyncMock.get_control_values` and a trap `get_controls` method that fails if invoked.
- Repeated serialized control-ID lists at the valid lower and upper bounds, plus malformed, duplicate, empty-equivalent, zero-ID, over-64-ID, and missing-ID cases.
- Ordered selected-value mappings containing boolean, integer, string, and null values in deliberately nonalphabetic order.
- One `V4L2ControlError` fixture for each selected-read category, plus unknown category, unexpected exception, and cancellation fixtures.
- Unique forbidden sentinels for host/resolved paths, authorization values, raw ioctl structures/payloads, errno text, provider private causes, and exception text.
- Admin, viewer, and anonymous callers through `AuthTestClient`; repository OpenAPI generator/checker output.
- Production-data rule: tests must not require production data, production configuration, a database, physical camera, or `/dev` access.

## Acceptance

- [ ] Feature spec remains explicitly a split child awaiting independent review.
- [ ] Route-level proof exists for the production selected-values GET through the real shared-router registration path.
- [ ] Helper-only or provider-only tests cannot satisfy this API-service feature contract.
- [ ] Exact repeated-ID passthrough, provider method and arguments, one awaited call, 1 through 64 bound behavior, missing-ID behavior, allowed scalar value shapes, mapping order, stable errors, cancellation/no retry, and generated admin-schema results are asserted.
- [ ] The suite proves the API delegates provider-owned selected-ID validation, uniqueness, bounds, membership, ordering, and read semantics without reimplementing or retesting their ioctl mechanics.
- [ ] Descriptor projection/refresh, mutation/write behavior, shared-foundation implementation details, and physical-hardware behavior remain outside this test specification.
