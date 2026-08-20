"""Shared API foundation for configured camera controls."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from enum import StrEnum
from typing import TypeVar

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from frigate.api.auth import require_role
from frigate.api.defs.response.camera_control_response import (
    CameraControlErrorResponse,
)
from frigate.api.defs.tags import Tags
from frigate.camera.v4l2_controls import V4L2ControlError, V4L2ControlProvider
from frigate.config.camera import CameraConfig

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=[Tags.camera],
    dependencies=[Depends(require_role(["admin"]))],
)

_camera_control_provider = V4L2ControlProvider()

T = TypeVar("T")
CameraControlOperation = Callable[[CameraConfig, V4L2ControlProvider], Awaitable[T]]


class CameraControlOperationKind(StrEnum):
    """Distinguish safe read and write failure responses."""

    read = "read"
    write = "write"


_ERROR_RESPONSES: dict[str, tuple[int, str, str]] = {
    "invalid_control_ids": (422, "invalid_control_ids", "Invalid control identifiers"),
    "control_not_found": (404, "control_not_found", "Camera control was not found"),
    "not_configured": (
        409,
        "camera_controls_not_configured",
        "Camera controls are not configured",
    ),
    "unstable_device_identity": (
        503,
        "device_unavailable",
        "Camera control device is unavailable",
    ),
    "device_disconnected": (
        503,
        "device_unavailable",
        "Camera control device is unavailable",
    ),
    "invalid_value": (
        422,
        "invalid_control_value",
        "Invalid camera control value",
    ),
    "unsupported_control_type": (
        422,
        "unsupported_control_type",
        "Camera control type is unsupported",
    ),
    "control_not_writable": (
        409,
        "control_not_writable",
        "Camera control is not writable",
    ),
    "driver_rejected": (
        409,
        "control_conflict",
        "Camera control update was rejected",
    ),
}
_INTERNAL_ERROR = (
    500,
    "camera_control_internal_error",
    "Camera control operation failed",
)


def get_camera_control_provider() -> V4L2ControlProvider:
    """Return the process-local camera-control provider."""

    return _camera_control_provider


def _response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=CameraControlErrorResponse(code=code, message=message).model_dump(),
    )


def _log_failure(
    *,
    status_code: int,
    camera_name: str,
    operation_name: str,
    operation_kind: CameraControlOperationKind,
    control_id: str | None,
    category: str,
) -> None:
    log = logger.error if status_code >= 500 else logger.warning
    log(
        "Camera control operation failed camera=%s operation=%s kind=%s "
        "control_id=%s category=%s",
        camera_name,
        operation_name,
        operation_kind.value,
        control_id,
        category,
    )


async def run_camera_control_operation(
    request: Request,
    camera_name: str,
    operation_name: str,
    operation_kind: CameraControlOperationKind,
    operation: CameraControlOperation[T],
    control_id: str | None = None,
) -> T | JSONResponse:
    """Run one provider operation for an actively configured camera."""

    camera_config = request.app.frigate_config.cameras.get(camera_name)
    if camera_config is None:
        status_code = 404
        _log_failure(
            status_code=status_code,
            camera_name=camera_name,
            operation_name=operation_name,
            operation_kind=operation_kind,
            control_id=control_id,
            category="camera_not_configured",
        )
        return _response(
            status_code,
            "camera_not_configured",
            "Camera is not configured",
        )

    provider = get_camera_control_provider()
    try:
        return await operation(camera_config, provider)
    except asyncio.CancelledError:
        raise
    except V4L2ControlError as error:
        if error.category == "device_io":
            if operation_kind is CameraControlOperationKind.read:
                error_response = (
                    502,
                    "control_read_failed",
                    "Camera control read failed",
                )
            else:
                error_response = (
                    502,
                    "control_write_failed",
                    "Camera control write failed",
                )
            public_category = "device_io"
        else:
            error_response = _ERROR_RESPONSES.get(error.category, _INTERNAL_ERROR)
            public_category = (
                error.category
                if error.category in _ERROR_RESPONSES
                else "camera_control_internal_error"
            )

        status_code, code, message = error_response
        _log_failure(
            status_code=status_code,
            camera_name=camera_name,
            operation_name=operation_name,
            operation_kind=operation_kind,
            control_id=control_id,
            category=public_category,
        )
        return _response(status_code, code, message)
    except Exception:
        status_code, code, message = _INTERNAL_ERROR
        _log_failure(
            status_code=status_code,
            camera_name=camera_name,
            operation_name=operation_name,
            operation_kind=operation_kind,
            control_id=control_id,
            category="camera_control_internal_error",
        )
        return _response(status_code, code, message)
