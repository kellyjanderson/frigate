"""Tests for the media-serving NGINX configuration."""

import re
import unittest
from pathlib import Path

NGINX_CONFIG = (
    Path(__file__).resolve().parents[2]
    / "docker/main/rootfs/usr/local/nginx/conf/nginx.conf"
)


def _extract_location_block(config: str, location: str) -> str:
    """Extract one NGINX location block, including nested directives."""
    start = config.index(f"location {location} {{")
    block_start = config.index("{", start)
    depth = 0

    for index in range(block_start, len(config)):
        if config[index] == "{":
            depth += 1
        elif config[index] == "}":
            depth -= 1
            if depth == 0:
                return config[start : index + 1]

    raise ValueError(f"Unterminated NGINX location block: {location}")


class TestNginxConfig(unittest.TestCase):
    def test_saved_face_webp_crops_use_image_content_type(self) -> None:
        config = NGINX_CONFIG.read_text()
        clips_location = _extract_location_block(config, "/clips/")

        self.assertRegex(
            clips_location,
            re.compile(r"^\s*image/webp\s+webp;\s*$", re.MULTILINE),
        )
