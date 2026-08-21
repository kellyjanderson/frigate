# Discussion Notes: USB V4L2 Camera Control

Date: 2026-08-18

## Context

- The Logitech C930e is currently owned by macOS and captured by a host
  AVFoundation-to-RTSP bridge.
- The Frigate container and its Colima Linux VM have no `/dev/video*` device,
  so Docker device mapping alone cannot provide V4L2 access.
- The desired design is for Linux to own the physical USB camera, expose it as
  a UVC/V4L2 device, and map that device into the Frigate container.
- Linux does not need macOS to create or translate a video device. It needs the
  raw C930e attached to a USB bus visible to the guest; normal Linux USB
  enumeration, `uvcvideo`, and udev should then create `/dev/video*`.

## Decisions And Leanings

- Treat direct USB-to-Linux enumeration as the target architecture.
- Distinguish whole-host-controller passthrough from per-accessory passthrough.
  Either would let Linux do normal USB discovery, but macOS Virtualization
  currently exposes explicit USB accessories on a virtual controller rather
  than giving the guest unrestricted ownership of the Mac's physical USB bus.
- Frigate backend code should enumerate V4L2 controls dynamically and expose
  only the controls reported by the camera, including their ranges, steps,
  defaults, current values, flags, and menu choices.
- Physical camera controls must remain distinct from the display-only Levels
  control.
- Retire the host AVFoundation bridge only after the Linux path proves video,
  audio, reconnection, control access, and stable recordings. Do not run two
  capture authorities for the same camera.
- Do not build the Frigate API or UI before the VM layer proves a real
  `/dev/video*` device and successful V4L2 queries against the C930e.

## Current Constraint

- The installed Colima 0.10.1 uses Lima 2.1.1 with the VZ driver and exposes no
  USB-passthrough configuration. The current guest sees no C930e and has no
  `/dev/video*` node.
- Apple documents Accessory Access and raw Virtualization framework USB
  passthrough as macOS 27 capabilities. This Mac runs macOS 26.5.2, and its
  installed Xcode 26.6 SDK has no Accessory Access framework or public
  `VZUSBPassthroughDeviceConfiguration` header. The current VZ-backed Colima VM
  therefore cannot attach the raw camera.
- QEMU's `usb-host` mechanism is not an acceptable production substitute.
  QEMU documents USB host passthrough as experimental and says USB devices that
  require real-time streaming, including USB video cameras, are not supported.
- A current macOS alternative exists through VMware Fusion. Fusion can take
  physical ownership of a USB camera and attach it to an ARM Linux guest. A
  small Linux guest can either run Frigate directly or export the raw camera
  through Linux USB/IP for import by Colima's `vhci_hcd` virtual host
  controller. The latter preserves Colima but requires a proof of sustained UVC
  isochronous performance.

## Open Questions

- Whether Lima and Colima will expose the macOS 27 passthrough API after the
  host is upgraded, or whether a small Lima VZ-driver extension is required.
- What user-consent interaction Accessory Access requires at login, reconnect,
  and reboot, and whether approved attachment can recover unattended.
- Whether Linux enumerates every needed control and supports changing them
  while FFmpeg is streaming.
- Whether the existing Colima instance can be migrated safely or a dedicated
  Frigate VM should own the camera.
- Whether the extra VMware-to-Colima USB/IP hop is stable enough for the C930e
  at the selected resolution and frame rate. The Colima kernel configuration
  enables USB/IP VHCI and UVC, but its current minimal module package does not
  contain the loadable modules.

## Follow-Up

1. Write a bounded proof specification for USB attachment and Linux UVC/V4L2
   enumeration, with rollback to the existing bridge.
2. Prove `/dev/video*`, `v4l2-ctl --list-formats-ext`,
   `v4l2-ctl --list-ctrls-menus`, simultaneous streaming and control changes,
   USB audio, unplug/replug, reboot recovery, and fresh Frigate recordings.
3. After that proof passes, specify the authenticated Frigate backend control
   provider and capability-driven UI.
