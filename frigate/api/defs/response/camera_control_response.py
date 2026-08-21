"""Camera-control API response models."""

from typing import Literal

from pydantic import BaseModel


class CameraControlErrorResponse(BaseModel):
    """Stable caller-safe camera-control failure response."""

    success: Literal[False] = False
    code: str
    message: str
