"""Tests for the shared camera-control API foundation."""

import asyncio
import inspect
import json
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import APIRouter, Depends, FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from frigate.api import camera, camera_control
from frigate.api.auth import allow_any_authenticated
from frigate.api.defs.response.camera_control_response import (
    CameraControlErrorResponse,
)
from frigate.api.defs.tags import Tags
from frigate.camera.v4l2_controls import V4L2ControlError

_FORBIDDEN_SENTINELS = (
    "/dev/video-private",
    "Bearer private-authorization",
    "submitted-value-private",
    "ioctl-private-payload",
    "errno-private-text",
    "provider-private-message",
    "private-cause-text",
    "unexpected-exception-text",
)


def _config(camera_config: object | None = None) -> SimpleNamespace:
    cameras = {} if camera_config is None else {"front_door": camera_config}
    return SimpleNamespace(
        cameras=cameras,
        proxy=SimpleNamespace(separator=","),
        auth=SimpleNamespace(roles={"admin": [], "viewer": []}),
    )


def _request(config: SimpleNamespace) -> Request:
    return SimpleNamespace(app=SimpleNamespace(frigate_config=config))  # type: ignore[return-value]


def _response_body(response: JSONResponse) -> dict:
    return json.loads(response.body)


class TestCameraControlFoundation(unittest.TestCase):
    def test_error_response_has_stable_envelope(self):
        response = CameraControlErrorResponse(code="safe_code", message="Safe message")

        self.assertEqual(
            response.model_dump(),
            {"success": False, "code": "safe_code", "message": "Safe message"},
        )

    def test_router_has_one_admin_dependency(self):
        self.assertEqual(camera_control.router.tags, [Tags.camera])
        self.assertEqual(len(camera_control.router.dependencies), 1)

        dependency = camera_control.router.dependencies[0].dependency
        required_roles = inspect.getclosurevars(dependency).nonlocals["required_roles"]
        self.assertEqual(required_roles, ["admin"])

    def test_provider_getter_returns_process_local_instance(self):
        provider = object()
        with patch.object(camera_control, "_camera_control_provider", provider):
            self.assertIs(camera_control.get_camera_control_provider(), provider)
            self.assertIs(camera_control.get_camera_control_provider(), provider)

    def test_unconfigured_camera_short_circuits_provider_and_operation(self):
        operation = AsyncMock()

        with (
            patch.object(camera_control, "get_camera_control_provider") as get_provider,
            self.assertLogs("frigate.api.camera_control", level="WARNING") as logs,
        ):
            response = asyncio.run(
                camera_control.run_camera_control_operation(
                    _request(_config()),
                    "missing_camera",
                    "probe",
                    camera_control.CameraControlOperationKind.read,
                    operation,
                )
            )

        self.assertIsInstance(response, JSONResponse)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            _response_body(response),
            {
                "success": False,
                "code": "camera_not_configured",
                "message": "Camera is not configured",
            },
        )
        get_provider.assert_not_called()
        operation.assert_not_called()
        self.assertIn("category=camera_not_configured", "\n".join(logs.output))

    def test_configured_camera_delegates_once_and_preserves_result(self):
        camera_config = object()
        provider = object()
        sentinel = object()
        operation = AsyncMock(return_value=sentinel)

        with patch.object(camera_control, "_camera_control_provider", provider):
            result = asyncio.run(
                camera_control.run_camera_control_operation(
                    _request(_config(camera_config)),
                    "front_door",
                    "probe",
                    camera_control.CameraControlOperationKind.read,
                    operation,
                    control_id="0x00980900",
                )
            )

        self.assertIs(result, sentinel)
        operation.assert_awaited_once_with(camera_config, provider)

    def test_all_categorized_failures_have_safe_exact_responses(self):
        cases = (
            (
                "invalid_control_ids",
                "read",
                422,
                "invalid_control_ids",
                "Invalid control identifiers",
            ),
            (
                "control_not_found",
                "read",
                404,
                "control_not_found",
                "Camera control was not found",
            ),
            (
                "not_configured",
                "read",
                409,
                "camera_controls_not_configured",
                "Camera controls are not configured",
            ),
            (
                "unstable_device_identity",
                "read",
                503,
                "device_unavailable",
                "Camera control device is unavailable",
            ),
            (
                "device_disconnected",
                "read",
                503,
                "device_unavailable",
                "Camera control device is unavailable",
            ),
            (
                "device_io",
                "read",
                502,
                "control_read_failed",
                "Camera control read failed",
            ),
            (
                "device_io",
                "write",
                502,
                "control_write_failed",
                "Camera control write failed",
            ),
            (
                "invalid_value",
                "write",
                422,
                "invalid_control_value",
                "Invalid camera control value",
            ),
            (
                "unsupported_control_type",
                "write",
                422,
                "unsupported_control_type",
                "Camera control type is unsupported",
            ),
            (
                "control_not_writable",
                "write",
                409,
                "control_not_writable",
                "Camera control is not writable",
            ),
            (
                "driver_rejected",
                "write",
                409,
                "control_conflict",
                "Camera control update was rejected",
            ),
        )

        for category, kind, status, code, message in cases:
            with self.subTest(category=category, kind=kind):
                private_cause = RuntimeError(" ".join(_FORBIDDEN_SENTINELS))
                error = V4L2ControlError(
                    category,  # type: ignore[arg-type]
                    "private-provider-camera",
                    "private-provider-operation",
                    private_cause=private_cause,
                )
                operation = AsyncMock(side_effect=error)

                with self.assertLogs(
                    "frigate.api.camera_control",
                    level="WARNING",
                ) as logs:
                    response = asyncio.run(
                        camera_control.run_camera_control_operation(
                            _request(_config(object())),
                            "front_door",
                            "probe",
                            camera_control.CameraControlOperationKind(kind),
                            operation,
                            control_id="0x00980900",
                        )
                    )

                self.assertIsInstance(response, JSONResponse)
                self.assertEqual(response.status_code, status)
                self.assertEqual(
                    _response_body(response),
                    {"success": False, "code": code, "message": message},
                )
                operation.assert_awaited_once()
                combined_output = f"{response.body!r}\n{' '.join(logs.output)}"
                for sentinel in _FORBIDDEN_SENTINELS:
                    self.assertNotIn(sentinel, combined_output)
                self.assertIn("camera=front_door", combined_output)
                self.assertIn("operation=probe", combined_output)
                self.assertIn(f"kind={kind}", combined_output)
                self.assertIn("control_id=0x00980900", combined_output)

    def test_unknown_provider_category_is_redacted(self):
        unknown_category = "unknown-provider-private-category"
        operation = AsyncMock(
            side_effect=V4L2ControlError(
                unknown_category,  # type: ignore[arg-type]
                "private-provider-camera",
                "private-provider-operation",
            )
        )

        with self.assertLogs("frigate.api.camera_control", level="ERROR") as logs:
            response = asyncio.run(
                camera_control.run_camera_control_operation(
                    _request(_config(object())),
                    "front_door",
                    "probe",
                    camera_control.CameraControlOperationKind.read,
                    operation,
                )
            )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            _response_body(response),
            {
                "success": False,
                "code": "camera_control_internal_error",
                "message": "Camera control operation failed",
            },
        )
        self.assertNotIn(unknown_category, " ".join(logs.output))
        self.assertIn("category=camera_control_internal_error", " ".join(logs.output))

    def test_unexpected_exception_is_redacted(self):
        operation = AsyncMock(side_effect=RuntimeError(_FORBIDDEN_SENTINELS[-1]))

        with self.assertLogs("frigate.api.camera_control", level="ERROR") as logs:
            response = asyncio.run(
                camera_control.run_camera_control_operation(
                    _request(_config(object())),
                    "front_door",
                    "probe",
                    camera_control.CameraControlOperationKind.read,
                    operation,
                )
            )

        combined_output = f"{response.body!r}\n{' '.join(logs.output)}"
        self.assertEqual(response.status_code, 500)
        self.assertNotIn(_FORBIDDEN_SENTINELS[-1], combined_output)
        self.assertIn("category=camera_control_internal_error", combined_output)
        operation.assert_awaited_once()

    def test_cancellation_propagates_without_logging_or_retry(self):
        operation = AsyncMock(side_effect=asyncio.CancelledError())

        with self.assertNoLogs("frigate.api.camera_control"):
            with self.assertRaises(asyncio.CancelledError):
                asyncio.run(
                    camera_control.run_camera_control_operation(
                        _request(_config(object())),
                        "front_door",
                        "probe",
                        camera_control.CameraControlOperationKind.read,
                        operation,
                    )
                )

        operation.assert_awaited_once()

    def test_probe_route_enforces_auth_and_is_classified_admin(self):
        from frigate.test.http_api.base_http_test import AuthTestClient
        from generate_api_auth_spec import ADMIN, classify_route

        provider = object()
        provider_calls: list[tuple[object, object]] = []
        app = FastAPI(dependencies=[Depends(allow_any_authenticated())])
        app.frigate_config = _config(object())
        probe_router = APIRouter(
            dependencies=list(camera_control.router.dependencies),
        )

        @probe_router.api_route("/camera-control-foundation-probe", methods=["HEAD"])
        async def probe(request: Request):
            async def operation(camera_config, operation_provider):
                provider_calls.append((camera_config, operation_provider))
                return Response(status_code=204)

            return await camera_control.run_camera_control_operation(
                request,
                "front_door",
                "foundation_probe",
                camera_control.CameraControlOperationKind.read,
                operation,
            )

        app.include_router(probe_router)

        with patch.object(camera_control, "_camera_control_provider", provider):
            with AuthTestClient(app) as client:
                self.assertEqual(
                    client.head("/camera-control-foundation-probe").status_code, 204
                )
                self.assertEqual(
                    client.head(
                        "/camera-control-foundation-probe",
                        headers={"remote-user": "viewer", "remote-role": "viewer"},
                    ).status_code,
                    403,
                )
            with TestClient(app) as client:
                self.assertEqual(
                    client.head("/camera-control-foundation-probe").status_code, 401
                )

        self.assertEqual(len(provider_calls), 1)
        self.assertIs(provider_calls[0][1], provider)

        route = next(
            route
            for route in app.routes
            if isinstance(route, APIRoute)
            and route.path == "/camera-control-foundation-probe"
        )
        level, roles, flag = classify_route(route, set(), ())
        self.assertEqual(level, ADMIN)
        self.assertEqual(roles, ["admin"])
        self.assertIsNone(flag)

    def test_camera_router_includes_camera_control_router_once(self):
        with open(camera.__file__, encoding="utf-8") as camera_module:
            source = camera_module.read()

        self.assertEqual(
            source.count("router.include_router(camera_control.router)"),
            1,
        )


if __name__ == "__main__":
    unittest.main()
