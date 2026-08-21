# Architectural Change: Raw USB V4L2 Camera Controls

Status: In progress, VMware attachment and Frigate video route integrated

Date: 2026-08-18

## Intent

Attach the physical Logitech C930e to a Linux virtual USB controller,
let standard Linux USB and media drivers create the camera devices, map those
devices into Frigate, and generate camera-control UI from the V4L2 control
descriptors reported by the hardware.

This change replaces neither the current runtime nor its canonical description
until every closure gate in this document passes.

## Current State

VMware Fusion now assigns the C930e to the dedicated `Frigate Linux` ARM64
guest. Linux creates the camera-backed V4L2 and ALSA nodes, and the Frigate
Docker deployment consumes the V4L2 video device directly. See
`../current-camera-runtime.md`.

## Target Runtime

```text
Logitech C930e
  -> VMware Fusion USB arbitrator
  -> VMware virtual XHCI controller
  -> Linux USB enumeration
  -> uvcvideo and, when used, snd_usb_audio
  -> /dev/video* and /dev/snd/*
  -> Docker device mapping
  -> Frigate/go2rtc capture and Frigate V4L2 control provider
  -> authenticated, camera-scoped generated controls
```

Linux, not macOS, creates the video device in the target design. A host-created
virtual video source or `v4l2loopback` device is not part of this architecture.

## Platform Route And Remaining Evidence Gaps

The present-day platform dependency is resolved through VMware Fusion 26. The
guest has enumerated USB `046d:0843`, created stable V4L2 links, exposed the
C930e ALSA capture device, passed a 1920 by 1080 frame read, enumerated formats
and controls, and recovered the direct Frigate video route after reboot.

Apple documents raw USB accessory attachment to a Virtualization framework VM
through Accessory Access and `VZUSBPassthroughDeviceConfiguration` as a macOS
27 capability. The current host is macOS 26.5.2 with Xcode 26.6. Its SDK has no
Accessory Access framework or public passthrough-device header. The installed
Colima 0.10.1 and Lima 2.1.1 VZ runtime therefore cannot implement this target
on the current host.

QEMU `usb-host` is not an approved substitute. QEMU documents that path as
experimental and explicitly excludes USB devices that require real-time
streaming, including USB video cameras. It would also require a different VM
instance because the existing Colima VM type cannot be changed in place.

The direct VZ attachment proof is blocked until one of these prerequisites
exists:

- macOS 27 and a compatible SDK, plus Lima/Colima support or a bounded Lima VZ
  integration for Accessory Access; or
- a supported external Linux host that owns the USB camera directly.

A present-day macOS route is also available through VMware Fusion, whose USB
arbitrator can assign the physical camera to an ARM Linux guest. Two variants
must be evaluated:

- run the Frigate Docker deployment in that USB-owning Linux VM; or
- use a minimal VMware Linux VM as a USB/IP server and import the raw device
  into the existing Colima guest through `vhci_hcd`.

The second variant preserves Colima and produces a genuine Linux USB device in
that guest. The current Colima kernel configuration enables USB/IP VHCI and UVC,
but the installed minimal kernel module package omits their module files. The
matching extra-modules package and USB/IP userspace tools are prerequisites.
This route remains a proof candidate until it sustains the C930e's isochronous
video traffic, control requests, disconnect recovery, and required audio.

The Colima and QEMU alternatives remain rejected for this host. The working
VMware route is now the current runtime. Remaining evidence gaps are camera
audio in the Frigate stream, unplug and replug recovery, and the authenticated
descriptor-driven control surface.

## Linux Attachment Contract

The attachment layer must expose the complete composite USB accessory to one
Linux guest. Normal Linux enumeration must bind `uvcvideo` and any required
audio interface. Device identity must be resolved by stable USB identity and
udev metadata, not by assuming that `/dev/video0` is permanent.

Disconnect and reconnect is a required unattended lifecycle, not an operator
repair procedure. After the same physical camera is plugged back in, the
runtime must validate its vendor, product, and serial identity, wait for fresh
udev-created stable links, recreate any stale Docker device mapping, and
restore go2rtc, Frigate capture, detection, snapshots, and recording without a
login, UI action, or manual command. A recording gap while the camera is
physically absent is expected; recovery after reconnection is mandatory.

If targeted guest recovery cannot reopen the device, a bounded supervisor may
escalate through a full VMware power cycle, which is the observed recovery for
the current V4L2 `Broken pipe` failure. Escalation must have persistent attempt
limits and a terminal degraded state so a disconnected or failed camera cannot
cause an endless restart loop.

The proof must capture:

- USB vendor `0x046d`, product `0x0843`, and serial `1A68415E`;
- guest USB topology and bound drivers;
- stable device links and every `/dev/video*` role;
- formats, resolutions, frame rates, and media topology;
- audio interfaces if Frigate will consume camera audio;
- control descriptors and menu entries;
- behavior while streaming, after unplug and replug, and after reboot.

User consent required by Accessory Access must be observable. Unattended restart
cannot be claimed until it is tested after consent, disconnect, login, and host
reboot.

## V4L2 Control Discovery Contract

The backend enumerates controls with `VIDIOC_QUERY_EXT_CTRL` using
`V4L2_CTRL_FLAG_NEXT_CTRL | V4L2_CTRL_FLAG_NEXT_COMPOUND`. Menu controls are
expanded with `VIDIOC_QUERYMENU`, tolerating sparse indexes. Current values are
read with `VIDIOC_G_EXT_CTRLS`. Writes use `VIDIOC_TRY_EXT_CTRLS` when useful
for validation and `VIDIOC_S_EXT_CTRLS` for application.

Each discovered control is represented by a descriptor with:

- numeric V4L2 ID and a stable serialized ID;
- display name, control class, and V4L2 type;
- minimum, maximum, step, default, and current value where applicable;
- menu item values and labels for menu types;
- flags such as disabled, inactive, read-only, volatile, grabbed, slider,
  execute-on-write, has-payload, and modify-layout;
- element size, element count, and dimensions for compound or array controls;
- effective writable and active state derived by the backend.

The camera driver remains the authority. After a successful write, the backend
reads the value again so the UI reflects driver clamping, automatic-mode side
effects, or coupled controls.

## Generated UI Contract

The UI renders controls from descriptors rather than maintaining a Logitech
model-specific list:

- boolean: switch;
- integer: slider with an exact numeric field when the range is practical;
- menu or integer menu: select control;
- button: explicit action button;
- string: validated text field;
- bitmask: bit choices when labels are available, otherwise a validated numeric
  representation;
- compound and array types: a type-specific editor only when explicitly
  supported, otherwise a clear read-only or unsupported state.

Read-only, inactive, grabbed, and disabled states must be communicated without
layout movement. Volatile values are refreshed while the control surface is
visible at a bounded rate. A modify-layout result triggers descriptor refresh.
The panel identifies the physical camera and remains separate from Live Image
Levels so users can distinguish source changes from display-only changes.

Unknown future V4L2 control types must fail closed in the editor while still
remaining inspectable as diagnostic metadata.

## Backend And API Boundary

- Device paths come from trusted Frigate camera configuration or resolved udev
  identity. Clients cannot submit arbitrary host paths.
- Discovery and writes are restricted to administrators and to configured
  camera devices.
- Blocking `ioctl` work runs outside the async event loop.
- Access is serialized per physical device to prevent conflicting writes and
  descriptor refreshes.
- A disconnect invalidates cached descriptors and values. Reconnect triggers
  identity validation and fresh enumeration.
- Frigate does not claim that a value is persistent unless the camera and
  driver actually preserve it. Live hardware state is the source of truth.
- Errors return stable categories without leaking filesystem details.
- Any added endpoint must regenerate the authenticated OpenAPI artifact.

The implementation specification must choose and fully define camera-scoped
endpoints for descriptor retrieval, value refresh, and individual or atomic
updates. The API must support deterministic mocked-driver tests before hardware
integration.

## Performance And Capture Safety

Control enumeration occurs on device connection or explicit refresh, not per
video frame. Volatile-value polling is bounded and stops when unused. Writes
must not block capture workers or FastAPI's event loop. Testing must determine
which controls can safely change during a stream and which require a controlled
capture restart.

No test may stop the working host bridge without a defined restoration command
and immediate rollback criteria.

## Required Specification Leaves

1. Raw USB attachment and Linux UVC proof, including consent and rollback.
2. V4L2 discovery and write provider with mocked ioctl tests.
3. Authenticated camera-control API with generated API artifact tests.
4. Descriptor-driven camera-control UI with accessibility and stale-device
   states.
5. Integration, deployment, reconnection, recording, and bridge-retirement
   validation.

Leaf 1 is integrated for USB attachment, stable V4L2 video, Frigate capture,
recording, and reboot recovery. Audio capture and unplug or replug recovery are
still open. Leaves 2 through 4 are designed but not implemented. Leaf 5 is
partially integrated. New Frigate API and UI implementation must still proceed
from approved implementation and paired test specifications rather than this
ACD alone.

## Acceptance And Closure Gates

The architectural change can become canonical only when all of these are true:

1. The raw camera appears on the guest USB bus after explicit user consent.
2. Linux binds the expected drivers and creates stable video device links.
3. `v4l2-ctl --list-formats-ext` and `--list-ctrls-menus` succeed on the real
   C930e.
4. Frigate captures stable live video and produces fresh recordings with zero
   skipped frames at the accepted processing rate.
5. Supported controls can be read and changed while capturing, or the UI
   correctly presents any restart requirement.
6. While the Mac is locked, unplugging and reconnecting the C930e restores the
   same camera automatically, including nonzero matching camera and process
   FPS, advancing snapshots, fresh recording segments, detector activity, and
   zero skipped FPS. The validation must include repeated reconnect cycles and
   the fallback VMware escalation route.
7. Frigate restart, VM restart, login, and host reboot meet documented
   recovery expectations.
8. The authenticated UI renders exactly the controls the driver reports and
   handles read-only, automatic, inactive, volatile, and disconnected states.
9. The user accepts picture, control behavior, recording behavior, and recovery.
10. Only then is the AVFoundation bridge disabled and the current architecture
   document updated to the new runtime truth.

## Rollback

Stop the guest capture authority, detach the accessory from the VM, restore
macOS camera ownership, and restart `com.keld.frigate-logitech`. Confirm the
RTSP feed, Frigate live view, advancing snapshots, camera and process FPS, zero
skipped frames, and a fresh recording before declaring rollback complete.

## Evidence Sources

- Apple, [Explore USB capabilities in macOS](https://developer.apple.com/videos/play/wwdc2026/224/)
- QEMU, [USB emulation](https://www.qemu.org/docs/master/system/devices/usb.html)
- Broadcom, [USB camera passthrough in VMware Fusion](https://knowledge.broadcom.com/external/article/339812/usb-camera-fails-to-work-in-virtual-mach.html)
- USB/IP Project, [USB/IP overview](https://usbip.sourceforge.net/)
- Linux kernel, [Querying control information](https://docs.kernel.org/userspace-api/media/v4l/vidioc-queryctrl.html)
- Linux kernel, [Getting and setting extended controls](https://docs.kernel.org/userspace-api/media/v4l/vidioc-g-ext-ctrls.html)
