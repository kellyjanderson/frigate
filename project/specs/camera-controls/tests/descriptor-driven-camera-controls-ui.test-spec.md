# Descriptor-Driven Camera Controls UI Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/descriptor-driven-camera-controls-ui.spec.md`
Feature spec canonical status: Draft candidate awaiting independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify that the selected camera's Live view exposes two accessible, responsive control surfaces generated from deterministic settings descriptors. The contract separately proves browser-only Levels behavior and authenticated physical-camera reads and writes, including dependent, unavailable, volatile, stale, and disconnected states.

## Application Integration Under Test

- App type: mixed GUI and API-consuming frontend.
- User/caller surface: Light and Lens/Geometry launchers and overlays on the selected single-camera Live view.
- Invocation route: `/#front_door` -> `LiveCameraView` -> launcher -> `CameraControlsPalette` -> `useCameraControls` -> mocked approved camera-control API; Light -> existing Levels persistence/filter route.
- Wiring owner/module: `web/src/views/live/LiveCameraView.tsx` and `web/src/components/player/CameraControlsPalette.tsx`.
- Observable result: descriptor-reported controls appear in the correct overlay, effective states remain truthful, writes reconcile to driver-returned values, and Levels changes affect browser media without a physical request.
- Integration validation: Playwright desktop and mobile tests run through the real Live route with deterministic API, authorization, and media fixtures.

## Manual Smoke

- Open an administrator session at the selected C930e camera, verify exactly two launchers, open Light, confirm the histogram and five Levels handles remain operable, change camera brightness and observe the read-back value, then open Lens/Geometry and change zoom.
- Confirm the UI distinguishes browser-only Levels from camera-source changes, closes on Escape and outside activation, returns focus, and remains contained at 320 CSS pixels in portrait and landscape.
- With a physical panel open, disconnect the camera or use a deterministic disconnect fixture, verify the stable disconnected state and stopped refresh, reconnect, activate Retry, and confirm freshly enumerated controls replace prior values.

## Automated Smoke Tests

- Enter `/#front_door` as an administrator and assert Light and Lens/Geometry buttons are visible, have distinct `aria-controls`, and open mutually exclusive labeled overlays.
- Return a brightness integer descriptor and focus/autofocus/zoom descriptors; assert brightness appears only in Light and focus/autofocus/zoom appear only in Lens/Geometry.
- Adjust Levels and assert the live media filter and persistence value change while the mocked physical-write route receives zero requests.
- Commit a brightness write and assert the request uses the selected camera and stable control ID, then assert the UI shows the mocked driver read-back value.

## Automated Acceptance Tests

- Unit/helper behavior:
  - Categorization maps standardized light and lens/geometric controls, honors an approved presentation hint, sorts deterministically, and places every unmatched descriptor in `other` exactly once.
  - Editor selection maps boolean, integer, menu/integer-menu, button, string, and labeled/unlabeled bitmask descriptors to the specified primitives.
  - Compound, array, payload-bearing, and unknown descriptors render inspectable non-editable metadata and never produce a write action.
  - Numeric validation enforces minimum, maximum, and step before commit.
  - Effective-state derivation disables inactive, read-only, grabbed, and disabled descriptors and produces a non-color-only reason.
- Integrated route behavior:
  - The real single-camera route mounts the selected camera identity into both physical panels and removes the global all-route media-tools launcher.
  - Light contains the existing Levels histogram/control and the physical light section separated by explicit browser-only and camera-source explanations.
  - Lens/Geometry contains focus/autofocus, zoom, pan, tilt, sharpness, and the collapsed `other` section from the fixture response.
  - A successful write disables only its editor, preserves the confirmed value while pending, and reconciles to a clamped/coupled response.
  - A `modify_layout` response causes one descriptor refetch and renders the returned effective-state changes.
  - Unauthorized users do not see physical-control launchers and cause no camera-control requests.
  - At 320 CSS pixels and after orientation resize, content remains within the viewport, scrolls internally, and keeps both launchers reachable without shifting video geometry.
  - Keyboard operation exposes visible focus, correct labels/value text, Escape close, outside close, and focus return; all pointer targets are at least 44 by 44 CSS pixels.
- Failure and stale-result behavior, if applicable:
  - Initial-load failure preserves panel dimensions, announces the stable error, and Retry issues one descriptor request.
  - A write failure restores the last confirmed value, keeps the panel open, and exposes an adjacent error.
  - A disconnect clears cached descriptors/values, stops polling, and shows a stable disconnected state.
  - Delayed fetch, volatile refresh, or write responses from a previous camera or request generation are ignored.
  - Fake timers prove volatile refresh is capped at 1 Hz and stops on panel close, page hidden, camera change, and unmount.

## App-Type Proof

- GUI proof:
  - Playwright and component tests prove visible launchers, real event routes, all assigned UI states, keyboard/focus behavior, responsive overflow, and stale-result handling.
- Console proof:
  - not applicable.
- API/service proof:
  - Frontend contract tests prove selected-camera request scoping, stable descriptor/value decoding, physical write/read-back behavior, 403 consumption, and no API call for Levels. Server authorization and ioctl effects are covered by the provider/API test specification.
- Mixed-surface proof:
  - GUI reachability and API-consuming behavior have separate assertions so either failure is independently visible.
- Library-only proof:
  - not applicable.

## Fixtures And Data

- Deterministic `front_door` descriptor fixture covering boolean, bounded integer, menu, integer-menu, button, string, labeled and unlabeled bitmask, inactive, read-only, grabbed, disabled, volatile, compound, payload-bearing, and unknown controls.
- Separate response fixtures for empty, loading, 403, stable error, disconnected, clamped value, coupled values, and `modify_layout`.
- Abortable promise and fake-timer fixtures for old-camera and old-generation responses.
- Existing synthetic canvas/media target used by the Levels histogram route; no private live image is stored in test output.
- Production-data rule: tests use mocked API and camera data and do not require the user's deployed C930e or production data.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while split coverage is incomplete.
- [ ] Route-level proof exists for the app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Observable result is asserted or manually checked.
- [ ] Failure behavior is covered where applicable.
