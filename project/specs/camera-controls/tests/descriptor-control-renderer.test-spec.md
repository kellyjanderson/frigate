# Descriptor Control Renderer Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/descriptor-control-renderer.spec.md`
Feature spec canonical status: Split child pending independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify that the public reusable renderer maps deterministic driver descriptors to accessible controls, emits only valid typed commit intent, presents effective and feedback states without row movement, and fails closed for unsupported data without making API requests.

## Application Integration Under Test

- App type: GUI reusable component.
- User/caller surface: one physical camera setting row rendered by a caller-owned control section.
- Invocation route: a component consumer passes descriptor, confirmed state, and `onCommit` props; DOM interaction reaches the callback only after local validation.
- Wiring owner/module: `web/src/components/camera-controls/DescriptorSettingControl.tsx`.
- Observable result: one correct labeled editor or inspectable unsupported presentation, stable state text, and an exact typed callback payload.
- Integration validation: `DescriptorSettingControl.test.tsx` renders and operates the exported component through its public props and DOM controls.

## Manual Smoke

- In the component test harness, render an integer descriptor, adjust it by keyboard and exact entry, then supply pending and a clamped confirmed success value. Confirm the editor remains in place, exposes its status, and displays the confirmed value. This smoke supplements but does not replace automated coverage.

## Automated Smoke Tests

- Render boolean, integer, menu, button, string, and bitmask descriptors and assert each produces its assigned accessible control with the driver label.
- Enter a valid exact integer value and assert one `onCommit` call with stable control ID and typed integer value; enter an off-step value and assert no additional call plus visible validation.
- Render an unknown payload-bearing descriptor and assert safe metadata is visible while no editable control or commit route exists.

## Automated Acceptance Tests

- Unit/helper behavior:
  - `getDescriptorEditorKind` maps boolean, integer, menu/integer-menu, button, string, labeled bitmask, and numeric bitmask, and returns unsupported for compound, array, payload-bearing, or unknown types.
  - `validateDescriptorValue` covers finite integer parsing, inclusive bounds, step relative to minimum, menu membership, string bounds, decimal and hexadecimal bitmasks, and preservation of unknown set bits in labeled masks.
- Integrated route behavior:
  - Render the exported component for every editor family and assert label association, current/default/range/step/menu metadata, focusability, direct-target sizing classes, and one exact callback payload for keyboard and pointer activation.
  - Exercise integer arrow keys, Home, End, Enter, and blur; prove an Enter commit is not duplicated by the following blur.
  - Exercise Space/Enter activation for switch, checkbox, select, and button semantics supported by their primitives.
  - Supply inactive, read-only, grabbed, disabled, and pending states and assert disabled semantics, retained current value, adjacent reason text, identical outer row/status structure, and no callback.
  - Transition the same mounted component from confirmed to pending to success with an adjusted read-back value, then through an error state; assert draft synchronization, polite success, safe error text, and stable layout containers.
- Failure and stale-result behavior, if applicable:
  - Invalid drafts set accessible invalid state, retain the confirmed value, show translated validation, and emit no callback.
  - Changing stable control ID or confirmed value resets stale local draft state.
  - Unsupported metadata omits raw payload bytes and exposes no write affordance even when the input descriptor claims writable.

## App-Type Proof

- GUI proof:
  - Public-component tests prove visible content, accessible names, focus and keyboard paths, state coverage, target sizing hooks, stable row geometry, and observable callback output.
- Console proof:
  - not applicable.
- API/service proof:
  - not applicable; the component test asserts zero network dependencies.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - not applicable.

## Fixtures And Data

- One deterministic descriptor fixture for every supported editor type, including sparse integer-menu values and labeled/unlabeled bitmasks.
- Boundary variants for minimum, maximum, step, string length, unknown set bits, and malformed local input.
- Effective-state variants for writable, inactive, read-only, grabbed, disabled, and pending rows.
- Unsupported variants for compound, array, payload-bearing, and unknown descriptor types with safe metadata.
- A consumer harness that records `onCommit` and rerenders confirmed, pending, success, and error props without an API mock.
- Production-data rule: tests use synthetic descriptors and require no camera, API server, production configuration, database, image, or recording.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while aggregate split coverage is recorded by the parent review process.
- [ ] Route-level proof exists for the app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Observable result is asserted or manually checked.
- [ ] Failure behavior is covered where applicable.
