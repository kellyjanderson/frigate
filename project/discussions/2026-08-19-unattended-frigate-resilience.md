# Discussion Notes: Unattended Frigate Resilience

Date: 2026-08-19

## Context

- The deployed camera route is macOS to VMware Fusion to Ubuntu V4L2 to
  Docker, go2rtc, and Frigate.
- While the Mac was unattended on AC power, macOS entered idle sleep and
  repeated maintenance wakes. The C930e remained enumerated afterward, but
  V4L2 failed at `VIDIOC_STREAMON` with `Broken pipe`.
- Frigate, Docker, the API, and the UI remained healthy while camera and
  process FPS were zero. Process health alone is therefore insufficient.
- A guest reboot, a Frigate container restart, and physical unplug/replug did
  not recover the camera. A full VMware power cycle recovered USB ownership,
  matching camera and process FPS, zero skipped FPS, and advancing snapshots.
- `com.keld.frigate-vm` now runs the VM service under `caffeinate -s`, which
  prevents macOS system sleep on AC power while still allowing display sleep.

## Decisions And Leanings

- The user requires the camera to recover automatically after physical
  disconnect and reconnect, including while the Mac is locked. Reconnection
  cannot depend on unlocking the Mac or running a command manually.
- Treat unattended resilience as a layered system property, not as a Frigate
  restart command.
- Keep one capture authority. The preserved Colima and AVFoundation rollback
  services must stay unloaded while VMware owns the C930e, and orphaned host
  capture processes must be treated as a fault.
- Use frame freshness as the primary health signal. A healthy state requires
  matching nonzero camera and process FPS, acceptable skipped FPS, advancing
  snapshots, and fresh recording segments.
- Add a bounded supervisor with an escalating recovery ladder:
  1. Debounce transient startup and reconnect errors.
  2. Restart only the guest camera/Frigate service.
  3. Reset or rebind the C930e inside Linux when supported and safe.
  4. Power-cycle the dedicated VMware guest to force physical USB detach and
     reattachment.
  5. Enter a terminal degraded state and alert after capped attempts.
- Persist supervisor state and timestamps so launchd restarts do not erase the
  attempt budget or cause an endless VM reboot loop.
- Do not restart the macOS USB stack as routine recovery. It is host-wide,
  disruptive, and less precise than resetting the dedicated guest or camera.
- Keep the AC-power sleep assertion scoped to the Frigate VM service. Closing
  the laptop lid and battery-powered sleep remain explicit unsupported
  availability boundaries unless the deployment requirements change.

## Required Observability

- Record power/sleep events, VMware guest lifecycle, USB identity and V4L2
  enumeration, recovery stage, API FPS, snapshot freshness, and recording
  freshness in one bounded log stream.
- Expose a concise current state: `healthy`, `recovering`, or `degraded`, plus
  the last successful frame and recording timestamps.
- Alert only when recovery reaches the degraded state, including the failed
  stage and evidence. Do not include credentials or camera imagery.

## Acceptance Boundaries

- Prove unattended operation on AC with the display asleep for a sustained
  interval without macOS system sleep.
- Prove physical unplug/replug recovery without manual Frigate intervention.
- Run the reconnect proof while the Mac is locked, and repeat it enough to
  detect stale Docker device mappings or one-time VMware attachment behavior.
- Prove recovery from a stopped go2rtc/Frigate process and a stale stream whose
  API still returns HTTP 200.
- Prove recovery from a wedged V4L2 `Broken pipe` by bounded escalation to a
  VMware power cycle.
- After every scenario, verify live FPS, advancing snapshots, fresh recording
  segments, detector activity, local UI/API access, and zero skipped FPS.
- Prove the attempt cap and degraded alert without creating a reboot loop.

## Evidence Gaps

- Whether a guest-side UVC unbind/rebind or targeted USB reset reliably clears
  this C930e failure without a VMware power cycle.
- Which local notification route should receive terminal degraded alerts.
- Whether unattended operation is required on battery power or with the lid
  closed. The current AC-only assertion intentionally does not cover either.

## Specification Sources

- Host resilience supervisor: power assertion, single-authority check, health
  polling, persistent recovery budget, VMware escalation, and alert state.
- Guest recovery endpoint or service: device identity validation, bounded
  Frigate restart, optional targeted UVC/USB reset, and structured result.
- End-to-end resilience test specification: fault injection and live,
  snapshot, recording, detector, and access-route verification.

## Related Architecture

- [Current Camera Runtime Architecture](../architecture/current-camera-runtime.md)
- [USB V4L2 Camera Controls ACD](../architecture/acd/usb-v4l2-camera-controls.md)
