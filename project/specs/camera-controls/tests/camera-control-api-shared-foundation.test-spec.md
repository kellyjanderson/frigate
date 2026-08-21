# Camera-Control API Shared Foundation Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md`
Feature spec canonical status: Split child awaiting independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify the shared administrator-only camera-control router, one process-local provider acquisition seam, configured-camera guard, one-call async delegation, common safe error envelope, complete provider-error translation, redacted observability, camera-router inclusion, and OpenAPI authentication-classifier foundation without claiming descriptor-read, selected-value-read, mutation, provider, or frontend behavior.

## Application Integration Under Test

- App type: API-service.
- User/caller surface: the shared foundation beneath camera-scoped camera-control HTTP operations; no standalone production success endpoint belongs to this child.
- Invocation route: test-only HTTP probe, shared router administrator dependency, configured-camera/provider helper, one supplied async provider callable, typed sentinel or common safe error response.
- Wiring owner/module: `frigate/api/camera_control.py`, included exactly once by `frigate/api/camera.py`.
- Observable result: administrator enforcement, configured-camera short-circuiting, stable provider identity, one awaited delegation, exact safe errors, redacted logs, inclusion wiring, and `admin` classifier metadata.
- Integration validation: `AuthTestClient` exercises a deterministic test-only probe using the shared dependencies/helper; module and classifier assertions cover the remaining foundation contracts.

## Manual Smoke

- In a non-production test app with configured camera `front_door` and a deterministic provider replacement, call the test-only shared-foundation probe as admin, viewer, and anonymous. Confirm one admin delegation, HTTP 403/401 denials with no delegation, and no sensitive sentinels in captured output or logs.
- Inspect the probe operation's generated OpenAPI metadata and confirm the shared router dependency is classified `admin`. Do not treat the probe as a production endpoint or edit `docs/static/frigate-api.yaml` for it.

## Automated Smoke Tests

- Import `frigate.api.camera_control`, assert `get_camera_control_provider()` returns the identical process-local test provider on repeated calls, and run one configured-camera operation through `run_camera_control_operation` to assert its `AsyncMock` is awaited exactly once with the active `CameraConfig` and provider.
- Mount a test-only probe with the shared router dependencies and assert admin HTTP success, viewer HTTP 403, anonymous HTTP 401, plus `admin` classification by the existing OpenAPI auth classifier.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Assert `camera_control.router` uses `Tags.camera` and exactly one `require_role(["admin"])` dependency; API children cannot weaken it by supplying a less restrictive dependency.
  - Assert a camera absent from `request.app.frigate_config.cameras` returns HTTP 404 `camera_not_configured` before `get_camera_control_provider` or the supplied callable is used.
  - Assert a configured camera causes one provider acquisition and one awaited callable with the exact active `CameraConfig`, operation kind/name, and stable provider instance. Assert a typed sentinel is preserved unchanged.
  - Parameterize `invalid_control_ids`, `control_not_found`, `not_configured`, `unstable_device_identity`, `device_disconnected`, both read/write forms of `device_io`, `invalid_value`, `unsupported_control_type`, `control_not_writable`, and `driver_rejected`; assert the exact specified HTTP status, stable code, fixed message, and `success=false`.
  - Assert an unknown provider category and an unexpected exception return the sanitized HTTP 500 internal-error response. Assert `asyncio.CancelledError` propagates with no translated response, retry, or duplicate call.
  - Seed provider messages/private causes and unexpected exceptions with unique device-path, authorization, submitted-value, ioctl, payload, errno, and exception-text sentinels. Assert none appears in response bodies or captured logs. Assert logs contain only camera name, operation name/kind, optional stable control ID, and stable public category.
- Integrated route behavior:
  - Attach a test-only probe operation to a router using the shared dependencies and helper, mount it through a FastAPI test app, and prove admin execution plus viewer/anonymous denial before provider access.
  - Assert `frigate/api/camera.py` includes `camera_control.router` once. Assert the existing auth-aware OpenAPI classifier reports `admin` for the probe route inherited from the shared dependency.
  - Do not assert either GET success response, selected-ID behavior, mutation behavior, or generated production operation schema in this suite; those belong to endpoint-owning siblings.
- Failure and stale-result behavior, if applicable:
  - Assert every documented failure returns no partial sentinel and triggers no second provider call, retry, cache substitution, or stale result.
  - Assert cancellation is not logged or translated by the API helper and relies on provider-owned cleanup/revalidation behavior.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - The test-only probe proves caller, inherited auth, configured-camera, delegation, error, side-effect-free foundation, and observability behavior through FastAPI; inclusion and classifier assertions prove the production wiring foundation without claiming a sibling endpoint's success contract.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - not applicable.

## Fixtures And Data

- `BaseTestHttp.minimal_config` with configured camera `front_door`, plus an unconfigured camera name.
- A stable sentinel object returned by `get_camera_control_provider` and an `AsyncMock` operation that records exact arguments and returns a typed sentinel.
- One `V4L2ControlError` fixture per stable category, plus unknown-category, unexpected-exception, and cancellation fixtures.
- Unique forbidden sentinels for host/resolved paths, authorization headers, submitted values, raw ioctl structures/payloads, errno text, provider messages/private causes, and exception text.
- Admin, viewer, and anonymous callers through `AuthTestClient`; a test-only FastAPI probe route and the existing authenticated OpenAPI classifier.
- Production-data rule: tests must not require production data, production configuration, a database, physical camera, `/dev` access, or generated production endpoint changes.

## Acceptance

- [ ] Feature spec remains explicitly a split child awaiting independent review.
- [ ] Route-level proof exists for the API-service foundation through the deterministic test-only probe.
- [ ] Helper-only tests cannot satisfy the inherited authentication, configured-camera, inclusion, and classifier contract.
- [ ] Observable provider identity, one-call delegation, exact safe error, redacted log, inclusion, and admin-classifier results are asserted.
- [ ] Failure behavior covers every shared category, operation-specific `device_io`, unknown category, unexpected exception, cancellation, no retry, no partial result, and no sensitive-data disclosure.
