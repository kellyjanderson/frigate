# Current Camera Runtime Architecture

Status: Canonical current state

Last verified: 2026-08-20

## Scope

This document records the deployed Logitech camera path. The VM now runs the
merged fork at commit `a8be404d412ee79c7e739189eaecddd6ee292491` as
`frigate-custom:0.18.0-a8be404d4-arm64`. The image layers the fork's backend
and web bundle over the matching upstream ARM image
`7ed7ed5-standard-arm64`, then adds ALSA utilities and FFmpeg.

The installed tree contains the V4L2 transaction, descriptor, value-policy,
provider, API-foundation, and descriptor-editor implementation artifacts from
`acd/usb-v4l2-camera-controls.md`. These artifacts are installed but the final
camera-control endpoints and discoverable settings surface are not yet wired,
so physical camera control remains implemented in isolation rather than
user-accessible.

## Runtime Path

1. VMware Fusion 26 assigns the physical Logitech Webcam C930e to the
   `Frigate Linux` ARM64 virtual machine by USB vendor and product identity.
2. Ubuntu 24.04.4 enumerates USB `046d:0843`, binds the standard Linux media
   and audio drivers, and creates `/dev/video0`, `/dev/video1`, `/dev/media0`,
   and the C930e ALSA capture device.
3. Stable V4L2 links identify the camera as
   `/dev/v4l/by-id/usb-046d_Logitech_Webcam_C930e_1A68415E-video-index0` and
   `video-index1`.
4. Docker maps the V4L2, media, and sound devices into the Frigate container.
   Compose uses the pinned custom image directly; no host web-directory bind
   mount overrides the image's matching web bundle.
5. go2rtc starts the bundled FFmpeg against the stable `video-index0` path,
   captures 1920 by 1080 MJPEG at 5 FPS, encodes H.264, and publishes the
   `logitech` RTSP stream inside Frigate.
6. Frigate consumes that restream for detection and recording. The existing
   macOS CoreML detector remains reachable at the VMware NAT gateway.

The deployed compose project is `/home/k/frigate` inside the VM. Recordings
are stored at `/home/k/frigate-media`. The previous Colima deployment and its
data remain on macOS as rollback material, but its Frigate container and the
AVFoundation camera bridge are stopped.

## Persistence And Local Access

- `com.keld.frigate-vm` keeps the VMware guest running in the macOS user
  session. It runs under `caffeinate -s` so the host does not enter system
  sleep while connected to AC power; display sleep remains allowed.
- `frigate.service` in Ubuntu starts the Docker Compose project after Docker
  and retries until `/dev/video0` exists.
- `com.keld.frigate-vm-tunnel` preserves the local UI, API, and RTSP routes at
  `127.0.0.1:8971`, `127.0.0.1:5001`, and `127.0.0.1:8554`.
- `/Users/k/.local/apps/frigate/scripts/frigate-vm-recover` provides a bounded
  manual recovery route. It verifies frames, snapshots, recordings, detector
  activity, and UI access; restarts the tunnel and container first; and
  recreates only the Frigate Compose container and network when the first
  stage does not restore health.
- Exact deployment sources remain at
  `/home/k/frigate-releases/a8be404d4`, and the minimal image build context is
  `/home/k/frigate-image-contexts/a8be404d4`.
- VMware auto-connect matches USB vendor `046d` and product `0843`. The
  installer media is disconnected, so guest restart boots only the installed
  system.

## Verified Behavior

The deployed route has been observed with:

- Linux USB, V4L2, media, and ALSA device enumeration;
- a successful 1920 by 1080 MJPEG frame capture;
- successful V4L2 format and control enumeration;
- Frigate camera and process rates of 5.1 FPS with 0.0 skipped FPS;
- working macOS CoreML inference after the VM routing change;
- fresh recording segments after initial cutover and after a guest reboot;
- automatic recovery of the camera, Docker deployment, detector, local
  tunnel, and recording after reboot;
- recovery of a post-sleep V4L2 `Broken pipe` after a full VMware power cycle,
  with matching 5.1 camera and process FPS, zero skipped FPS, and advancing
  snapshots;
- recovery after Fusion resumed the guest with a stale Docker device mount and
  network. A container restart refreshed `/dev/v4l`, but Compose recreation was
  required to restore container networking, model initialization, API access,
  5.1 FPS processing, changing snapshots, and fresh recordings;
- the live page and MSE stream reached from Chrome through the local tunnel.
- the deployed backend and web file hashes matching the merged `dev` checkout;
- Frigate reporting `0.18.0-a8be404d4`, with the image revision label pinned
  to the full merge commit;
- the post-upgrade UI with no nested interactive controls, no unlabeled
  focusable controls, and 48 by 48 navigation hit targets that respond at the
  edge;
- C930e audio in the `logitech` RTSP stream as AAC, 48 kHz, mono;
- post-upgrade camera and process rates of 5.1 FPS, zero skipped FPS, active
  Apple detector inference, changing snapshots, and fresh ten-second recording
  segments.

## Current Boundaries

- Video capture, detection, recording, and local UI access are integrated.
- The guest exposes the C930e audio capture device, Docker maps `/dev/snd`, and
  the custom image supplies ALSA-capable FFmpeg. Camera audio is present in the
  `logitech` RTSP stream.
- The installed provider can enumerate and transact with V4L2 controls, but no
  final authenticated descriptor/read/write endpoint exposes it to callers.
- Descriptor normalization and editor components are installed, but the UI
  does not yet generate discoverable physical camera controls because the
  settings route and final API contracts remain unwired.
- Live Image Levels remains display-only and does not modify the camera,
  recordings, snapshots, exports, or detector frames.
- In the observed post-sleep failure, physical unplug/replug, a Frigate
  container restart, and a guest reboot did not recover streaming. A full
  VMware power cycle did recover it.
- The recovery script is manual and bounded. No automatic frame-freshness
  supervisor or automatic VMware power-cycle escalation exists yet. The
  current sleep assertion prevents the observed AC idle-sleep trigger but does
  not cover battery operation or closing the laptop lid.

## Rollback

The pre-upgrade Compose definition, ALSA Dockerfile, configuration, and
database are preserved at
`/home/k/frigate/backups/pre-a8be404d4-20260820`.

Stop the VMware compose deployment, detach the C930e from the VM, bootstrap
`com.keld.frigate-logitech`, bootstrap the previous `com.keld.frigate`
LaunchAgent, and start the preserved Colima container. Confirm RTSP, live view,
advancing snapshots and recordings, matching camera and process FPS, and zero
skipped frames before declaring rollback complete.
