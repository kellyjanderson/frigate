# Authenticated Camera-Control Descriptor Read Endpoint Test Specification

Date: 2026-08-20
Status: Proposed
Feature spec: `project/specs/camera-controls/authenticated-camera-control-descriptor-read-endpoint.spec.md`
Feature spec canonical status: Split child awaiting independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify the administrator-only descriptor GET through the real FastAPI registration route. Prove exact refresh forwarding, one provider call, provider-order preservation, complete field-by-field HTTP projection, safe scalar and non-scalar current-value behavior, inherited failures and cancellation, and generated OpenAPI schema/auth entries without retesting foundation or provider internals.

## Application Integration Under Test

- App type: API-service.
- User/caller surface: `GET /cameras/{camera_name}/controls`.
- Invocation route: authenticated HTTP GET, merged router administrator dependency, `refresh` parsing, foundation configured-camera/provider helper, one mocked async provider descriptor read, explicit safe projection, and typed response.
- Wiring owner/module: `frigate/api/camera_control.py`, already included once by `frigate/api/camera.py` through the shared foundation.
- Observable result: ordered descriptor metadata with exact scalar values or content-free non-scalar representation markers for an administrator, existing auth denial, or the foundation-owned safe error.
- Integration validation: `AuthTestClient` drives the production route with a deterministic provider replacement; generated-artifact checks prove the descriptor schemas and admin classification.

## Manual Smoke

- In a non-production test app with configured camera `front_door` and a deterministic provider replacement, call the descriptor GET with omitted, false, and true `refresh`; confirm exact ordered descriptors and one matching `get_controls` call per request.
- Return descriptors whose current values are scalar, invalid UTF-8 bytes, and tuples. Confirm scalars are unchanged, non-scalars have JSON null plus the specified redaction marker, and no bytes, encoded payload, decoded text, tuple contents, or fixture sentinel appears.
- Repeat as viewer and anonymous and confirm HTTP 403/401 with zero provider access. Regenerate the OpenAPI artifact, inspect the descriptor path, and confirm the success/error models and administrator classification. Do not edit the generated YAML by hand.

## Automated Smoke Tests

- Mount the existing camera router through the standard test application, replace the shared provider, call `GET /cameras/front_door/controls`, and assert HTTP 200 plus one awaited `get_controls(camera_config, refresh=False)` call.
- Return descriptors in intentionally nonnumeric order containing scalar, bytes, and tuple values. Assert exact descriptor order, scalar pass-through, and the exact content-free redaction projection for both non-scalar shapes.
- Run `python3 generate_api_auth_spec.py --check` after regeneration and assert the GET operation is present, uses `CameraControlsResponse` and `CameraControlErrorResponse`, and is classified admin.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Construct provider descriptors covering every public metadata field, sparse menu entries, normalized flags, dimensions, and derived states. Assert `_to_camera_control_descriptor_response` copies every allowed field and preserves all metadata ordering.
  - Parameterize `True`, `False`, boundary integers, empty/non-empty strings, and Unicode strings. Assert the exact JSON scalar and `current_value_representation: scalar`.
  - Assert provider `None` produces JSON null and `unavailable`.
  - Parameterize empty bytes, invalid UTF-8 bytes, bytes containing path/auth/ioctl/errno/private-cause sentinels, empty tuples, mixed scalar tuples, and tuples containing unique payload sentinels. Assert JSON null plus `redacted_binary` or `redacted_sequence`, and assert no decode, base64, hash, stringification, tuple iteration into output, raw provider dump, or sentinel exposure.
  - Assert the descriptor handler passes read operation kind through the shared helper and awaits `get_controls` once with exact `CameraConfig` and omitted/default, explicit false, or explicit true refresh.
- Integrated route behavior:
  - Drive the exact production path through `AuthTestClient`; assert admin HTTP 200, viewer HTTP 403, and anonymous HTTP 401, with zero handler/provider access for denied requests.
  - Assert a camera absent from active configuration returns the foundation's HTTP 404 `camera_not_configured` before provider access and the route accepts no client-supplied device path.
  - Return multiple descriptors in nonnumeric provider order and assert exact HTTP order for default, explicit false, and explicit true refresh.
  - Return a single response containing scalar, unavailable, binary, and sequence shapes and assert the exact complete JSON body. Search serialized body and captured logs for raw bytes, base64 candidates, decoded invalid UTF-8 replacement text, tuple elements, host path, authorization, ioctl, errno, private-cause, and exception sentinels; none may appear.
  - Parameterize `not_configured`, `unstable_device_identity`, `device_disconnected`, and read-side `device_io`; assert the exact shared status/code/fixed-message envelope and no second call. Assert an unknown category and unexpected exception use the sanitized internal-error response.
  - Cancel the provider await and assert cancellation propagates with no projection, translated response, retry, stale substitution, partial success, second provider method, or API-owned cleanup attempt.
  - Assert `frigate/api/camera.py` exposes this GET path exactly once through the existing shared-router inclusion.
  - Regenerate `docs/static/frigate-api.yaml`, run its check command, and assert the operation references `CameraControlsResponse`, nested `CameraControlDescriptorResponse`, and `CameraControlErrorResponse` as applicable and carries admin auth classification.
- Failure and stale-result behavior, if applicable:
  - A valid descriptor with bytes or tuple `current_value` must remain HTTP 200 and use its redaction marker. It must not produce a validation error, HTTP 500, partial descriptor list, or second provider call.
  - A provider failure returns no partial descriptors. Cancellation returns no response from this child and preserves provider-owned cleanup behavior.

## App-Type Proof

- GUI proof:
  - not applicable.
- Console proof:
  - not applicable.
- API/service proof:
  - Production-route tests prove the exact path, caller/auth behavior, refresh parsing, configured-camera boundary, provider method and arguments, one-call descriptor read, complete ordered projection, safe non-scalar response contract, inherited error behavior, and payload-safe output. Generated artifact checks prove the documented admin API surface.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - not applicable.

## Fixtures And Data

- `BaseTestHttp.minimal_config` with configured camera `front_door`, plus an unconfigured name.
- A deterministic replacement for the merged process-local provider with `AsyncMock.get_controls`.
- Multiple `V4L2ControlDescriptor` fixtures in intentionally nonnumeric order covering all public metadata, sparse menus, flags, dimensions, derived states, scalar values, `None`, empty/non-empty bytes, invalid UTF-8 bytes, and empty/mixed tuples.
- Unique forbidden sentinels for host/resolved paths, authorization values, raw ioctl structures/payloads, errno text, provider private causes, exception text, bytes, and tuple elements.
- One `V4L2ControlError` fixture for each descriptor-read category, plus unknown category, unexpected exception, and cancellation fixtures.
- Admin, viewer, and anonymous callers through `AuthTestClient`; repository OpenAPI generator/checker output.
- Production-data rule: tests must not require production data, production configuration, a database, physical camera, or `/dev` access.

## Acceptance

- [ ] Feature spec remains explicitly a split child awaiting independent review.
- [ ] Route-level proof exists for the production descriptor GET through the real shared-router registration path.
- [ ] Helper-only or provider-only tests cannot satisfy this API-service feature contract.
- [ ] Exact refresh argument, one awaited call, provider order, every allowed metadata field, all scalar variants, `None`, invalid UTF-8 bytes, tuples, stable errors, cancellation/no retry, and generated admin-schema results are asserted.
- [ ] The suite proves bytes and tuple contents cannot enter JSON or logs through direct serialization, decoding, encoding, hashing, stringification, validation errors, or generic provider-object dumping.
- [ ] Selected-values behavior, mutation/write behavior, shared-foundation implementation details, provider ioctl mechanics, and physical-hardware behavior remain outside this test specification.
