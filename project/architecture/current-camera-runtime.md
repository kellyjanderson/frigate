# Current Camera Runtime Architecture

Status: Canonical current state

Last verified: 2026-08-20

## Scope

This document records the deployed Logitech camera path. The generated V4L2
control API and UI remain proposed in
`acd/usb-v4l2-camera-controls.md` and are not described here as current
behavior.

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

## Current Boundaries

- Video capture, detection, recording, and local UI access are integrated.
- The guest exposes the C930e audio capture device and Docker maps `/dev/snd`,
  but the bundled Frigate FFmpeg lacks ALSA input support. Camera audio is not
  currently present in the Frigate stream.
- Frigate does not yet enumerate or write V4L2 controls through its API.
- The UI does not yet generate physical camera controls from V4L2
  descriptors.
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

Stop the VMware compose deployment, detach the C930e from the VM, bootstrap
`com.keld.frigate-logitech`, bootstrap the previous `com.keld.frigate`
LaunchAgent, and start the preserved Colima container. Confirm RTSP, live view,
advancing snapshots and recordings, matching camera and process FPS, and zero
skipped frames before declaring rollback complete.
