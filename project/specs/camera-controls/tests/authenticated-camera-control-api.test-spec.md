# Authenticated Camera-Control API Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/authenticated-camera-control-api.spec.md`
Feature spec canonical status: Split child awaiting independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify that Frigate exposes the three camera-control operations only to administrators, routes configured cameras to one mocked async provider operation, preserves bounded input and returned read-back contracts, maps failures safely, and publishes matching admin-authenticated OpenAPI operations.

## Application Integration Under Test

- App type: API-service.
- User/caller surface: descriptor GET, bounded values GET, and individual-control PUT under `/cameras/{camera_name}/controls`.
- Invocation route: HTTP request through the mounted FastAPI router, explicit administrator dependency, request/config validation, mocked provider call, typed response.
- Wiring owner/module: `frigate/api/camera_control.py`, included by the existing `frigate/api/camera.py` router used by both runtime and generated-OpenAPI apps.
- Observable result: exact descriptor/value/read-back response or documented stable status/code, plus admin access metadata in `docs/static/frigate-api.yaml`.
- Integration validation: `AuthTestClient` route tests with an async mocked provider and the generated OpenAPI check.

## Manual Smoke

- Against a non-production test app configured with camera `front_door` and a fake provider, call each operation as admin and confirm the returned camera, descriptors/values/read-back, then call as viewer and confirm HTTP 403 without a provider call.
- Inspect the generated OpenAPI entries for all three operations and confirm each states that the admin role is required and references the intended schemas.

## Automated Smoke Tests

- Mount the existing camera router through `create_fastapi_app`, patch `frigate.api.camera_control.camera_control_provider` with the fake provider, request `GET /cameras/front_door/controls`, and assert HTTP 200 plus exactly one awaited `get_controls(camera_config, refresh=False)` call.
- Run `python3 generate_api_auth_spec.py --check` after regeneration and assert descriptor, value-refresh, and update operations are present and classified admin.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Accept 1 and 64 unique `control_id` query values; reject zero, 65, and duplicate IDs with HTTP 422 before provider access.
  - Accept provider-supported bool, int, string, and button-null write bodies; reject malformed body shapes before provider access.
  - Map each categorized provider exception to its specified HTTP status and stable code.
- Integrated route behavior:
  - Descriptor GET passes the validated `CameraConfig` and `refresh=false` by default or `refresh=true` when requested to `get_controls`, preserving provider descriptors.
  - Values GET calls `get_controls(camera_config, refresh=False)` once and projects the ordered bounded ID list to stable ID/current-value pairs.
  - Control PUT passes the validated `CameraConfig`, serialized control ID, and typed value exactly once to `set_control` and returns its post-write read-back descriptor.
  - An absent configured camera returns `camera_not_configured` without any provider call. No endpoint or model accepts a filesystem path.
  - Admin succeeds; viewer receives HTTP 403 and anonymous receives HTTP 401, with zero provider calls for both denied cases.
  - The generated auth-aware OpenAPI artifact contains the three paths, methods, schemas, and admin annotations.
- Failure and stale-result behavior, if applicable:
  - Assert `camera_controls_not_configured`, `control_not_found`, `invalid_control_ids`, `invalid_control_value`, `unsupported_control_type`, `control_not_writable`, `control_conflict`, `device_unavailable`, `control_read_failed`, `control_write_failed`, and sanitized internal-error mappings.
  - Assert a provider write/read-back failure never returns a success envelope or stale cached value, and the API performs no implicit retry.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - Route tests exercise endpoint, caller, auth, error, side-effect, and observable response contracts through the real FastAPI registration path; generated artifact checks prove externally documented authentication.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - not applicable.

## Fixtures And Data

- `BaseTestHttp.minimal_config` with configured camera `front_door`, plus an unconfigured camera name for rejection.
- An `AsyncMock` patched over `frigate.api.camera_control.camera_control_provider` with deterministic descriptors, read-back records, and each categorized `V4L2ControlError`.
- Admin, viewer, and anonymous headers through `AuthTestClient` or explicit request headers.
- A temporary generated OpenAPI comparison or the repository generator's `--check` mode; tests never hand-edit the generated YAML.
- Production-data rule: tests must not require production data or a physical V4L2 device.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while the split child awaits independent review.
- [ ] Route-level proof exists for the API-service app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Observable result is asserted for descriptors, refreshed values, update read-back, stable failures, and generated auth metadata.
- [ ] Failure behavior covers authorization, request validation, configured-camera restriction, unavailable device, state conflict, write/read-back failure, and unexpected provider failure.
