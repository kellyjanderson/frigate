# Authenticated Camera-Control Read API And Shared Contracts Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
Feature spec canonical status: Split child awaiting independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify that the two camera-control GET routes are administrator-only, accept only configured cameras, perform exactly one mocked async provider call, preserve descriptor and ordered bounded-value contracts, map failures safely, and publish matching authenticated OpenAPI operations. Also prove the shared router, configured-camera support, error envelope, and translation contract that the write sibling consumes.

## Application Integration Under Test

- App type: API-service.
- User/caller surface: descriptor GET and bounded values GET under `/cameras/{camera_name}/controls`.
- Invocation route: HTTP request through the mounted camera router, explicit administrator dependency, request/configured-camera validation, one mocked provider call, and typed response.
- Wiring owner/module: `frigate/api/camera_control.py`, included by `frigate/api/camera.py`.
- Observable result: exact descriptor or requested ordered current-value result, documented stable error, and admin access metadata in `docs/static/frigate-api.yaml`.
- Integration validation: route-level `AuthTestClient` tests with an async mocked provider and generated OpenAPI checks.

## Manual Smoke

- In a non-production test app with configured camera `front_door` and a fake provider, call both GET operations as admin and confirm exact descriptor/value results, then call as viewer and anonymous and confirm HTTP 403/401 with no provider access.
- Inspect the generated OpenAPI operations for both GET paths and confirm admin classification plus the intended response schemas.

## Automated Smoke Tests

- Mount the existing camera router through the test application, patch the camera-control provider, call `GET /cameras/front_door/controls`, and assert HTTP 200 plus one awaited `get_controls(camera_config, refresh=False)` call.
- Run `python3 generate_api_auth_spec.py --check` after regeneration and assert both GET operations are present and classified admin.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Accept 1 and 64 unique repeated `control_id` values; reject zero, duplicate, and 65-ID requests with HTTP 422 before provider access.
  - Project provider descriptors/current values in requested ID order and reject any missing ID as HTTP 404 `control_not_found` without returning a partial result.
  - Map every shared categorized provider failure to its documented status/code and sanitize unexpected exceptions.
- Integrated route behavior:
  - Descriptor GET passes the validated `CameraConfig` and `refresh=false` by default or `refresh=true` when requested to exactly one provider call.
  - Values GET calls `get_controls(camera_config, refresh=False)` once and returns only requested descriptors/current values in request order.
  - An absent configured camera returns `camera_not_configured` without provider access. No endpoint or response accepts or exposes a filesystem path.
  - Admin succeeds; viewer receives HTTP 403 and anonymous receives HTTP 401, with zero provider calls for denied requests.
  - The generated auth-aware OpenAPI artifact contains both GET methods, schemas, and admin annotations.
- Failure and stale-result behavior, if applicable:
  - Assert `camera_controls_not_configured`, `control_not_found`, `invalid_control_ids`, `device_unavailable`, `control_read_failed`, and sanitized internal-error mappings.
  - Assert cancellation or failure causes no implicit retry, second provider call, stale-value substitution, or partial success.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - Route tests exercise endpoint, caller, auth, error, side-effect-free read, observability, and response contracts through the real FastAPI registration path; generated artifact checks prove documented authentication.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - not applicable.

## Fixtures And Data

- `BaseTestHttp.minimal_config` with configured camera `front_door`, plus an unconfigured name for rejection.
- An `AsyncMock` patched over the process-local camera-control provider with deterministic descriptors and each categorized `V4L2ControlError`.
- Admin, viewer, and anonymous callers through `AuthTestClient` or explicit request headers.
- Repository OpenAPI generator/checker output; tests never edit generated YAML directly.
- Production-data rule: tests must not require production data, production configuration, or a physical V4L2 device.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while the split child awaits independent review.
- [ ] Route-level proof exists for the API-service app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Observable descriptor, ordered value, stable error, and generated auth results are asserted.
- [ ] Failure behavior covers authorization, request validation, configured-camera restriction, unavailable device, read failure, cancellation/no-retry, and unexpected provider failure.
