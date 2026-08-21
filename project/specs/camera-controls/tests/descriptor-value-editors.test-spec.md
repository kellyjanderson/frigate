# Accessible Descriptor Value Editors Test Specification

Date: 2026-08-19
Status: Proposed
Feature spec: `project/specs/camera-controls/descriptor-value-editors.spec.md`
Feature spec canonical status: Split child pending independent review
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`

## Overview

Verify that the public reusable editor consumes normalized descriptor/value-policy contracts, renders the correct accessible editable control or inert unsupported state, manages one synchronized draft, and emits only exact validated typed intent without performing API work or absorbing setting-row behavior.

## Application Integration Under Test

- App type: GUI reusable component.
- User/caller surface: the editor slot inside a caller-owned physical camera setting row.
- Invocation route: a component consumer passes normalized descriptor/state props, accessible association IDs, safe unsupported text, and callbacks; rendered DOM interaction reaches commit only after prerequisite validation.
- Wiring owner/module: `web/src/components/camera-controls/DescriptorValueEditor.tsx`.
- Observable result: one correct accessible editor or inert unsupported state plus exact commit and local-validation callback events.
- Integration validation: `web/src/components/camera-controls/DescriptorValueEditor.test.tsx` mounts and operates the exported component in Vitest/jsdom, then rerenders caller-confirmed lifecycle props.

## Manual Smoke

- In the deterministic component harness, render a practical-range integer descriptor. Use Arrow, Home/End, pointer/touch-equivalent slider input, exact entry, Enter, blur, Escape, and a pending-to-success rerender with a driver-adjusted confirmed value. At 200 percent browser zoom and a narrow containing row, confirm one stable contained editor slot, visible focus, disabled pending controls, no duplicate commit, and the adjusted caller value after resolution. Inspect that text meets WCAG AA contrast and meaningful non-text indicators meet at least 3:1 without color-only state communication.

## Automated Smoke Tests

- Render boolean, practical integer, large-range integer, menu, integer-menu, button, string, labeled-bitmask, and numeric-bitmask descriptors and assert each public editor branch exposes the caller-provided accessible name/description association.
- Enter one valid exact integer and assert one typed commit for the canonical serialized control ID; enter an off-step value and assert zero additional commits plus the exact local validation-code callback.
- Render compound, array, and unknown unsupported kinds and assert the safe inert description is visible with no focusable editor, input/action role, or commit route.

## Automated Acceptance Tests

- Unit/helper behavior:
  - not applicable; normalization, editor-kind selection, validation rules, and stable validation codes remain covered by the prerequisite's `cameraControlDescriptors.test.ts`.
- Integrated route behavior:
  - Render the exported component for every editor kind and assert the chosen primitive, accessible association, enabled/disabled semantics, focus-visible class hooks, and at least 44 by 44 CSS pixel interaction-target hooks.
  - For a practical integer, assert slider and exact input share a draft; exercise Arrow keys by one step, Page Up/Page Down by ten steps, Home/End at bounds, pointer/touch-equivalent commit, and exact entry.
  - At 1,000 inclusive step intervals assert the slider remains; above 1,000 assert exact entry remains while the slider is absent.
  - For exact integer, string, and numeric-bitmask entry, assert valid Enter or blur commits once, Enter followed by blur does not duplicate, and Escape restores the confirmed value with no commit.
  - For boolean, ordinary menu, integer-menu, action button, and labeled-bit controls, assert one deliberate activation produces exactly one contract-valid value. Assert button value is `null` and sparse ordinary/integer menu values are not conflated.
  - Toggle labeled bits from a full draft containing unknown set bits and assert the whole committed mask preserves those bits across sequential local edits.
  - Rerender the same mounted component when stable ID, editor kind, validation metadata, or confirmed value changes and assert stale draft/validation state resets to caller truth.
  - Supply different descriptor default and confirmed current values and assert the current value initializes/resets the draft, the default is not substituted, and no automatic commit occurs.
  - Rerender confirmed to pending and assert the submitted draft remains visible while every constituent control is disabled and event attempts emit nothing. Rerender pending to success/error and assert the draft resets from caller-confirmed value.
  - Constrain the harness width and use long menu/bit labels to assert containment/wrapping/scroll classes exist and meaningful editor text is not assigned silent-clipping styles.
- Failure and stale-result behavior, if applicable:
  - Out-of-range, off-step, absent-menu, invalid-string, malformed decimal/hex bitmask, and nonwritable interactions emit no commit, set accessible invalid/disabled semantics as applicable, and report the exact stable local validation code.
  - Queued handler invocation after pending disablement emits nothing.
  - Unsupported, compound, and array kinds remain inert even when contradictory input claims writable.

## App-Type Proof

- GUI proof:
  - Public-component DOM tests prove editor reachability, accessible association, visible-focus hooks, keyboard paths, pointer/touch-equivalent events, target sizing, disabled/pending state, narrow-width containment, and observable callback output.
- Console proof:
  - not applicable.
- API/service proof:
  - not applicable; the harness asserts that the component has no fetch or API-client dependency.
- Mixed-surface proof:
  - not applicable.
- Library-only proof:
  - not applicable.

## Fixtures And Data

- Normalized descriptor/control-state fixtures imported from or shaped by the merged descriptor/value-policy prerequisite for every supported editor kind.
- Practical integer fixtures at zero, 1,000, and 1,001 inclusive step intervals; minimum/maximum/off-step drafts; and a non-positive raw step already normalized by the prerequisite.
- Sparse ordinary-menu and integer-menu fixtures whose index and value differ.
- Labeled and numeric bitmask fixtures with known and unknown set bits plus valid decimal/hexadecimal and malformed drafts.
- String minimum/maximum boundary fixtures and one overlength draft.
- Effective-state fixtures for writable, nonwritable, and pending, plus lifecycle rerenders for success/error with retained or driver-adjusted confirmed values.
- Unsupported fixtures for compound, array, payload-derived unsupported, and unknown kinds containing only normalized safe data plus caller-safe inert text.
- A React DOM consumer harness that records commit and validation callbacks and supplies caller-owned label/description elements without a row implementation or API mock.
- Production-data rule: tests use deterministic synthetic normalized contracts and require no camera, API server, production configuration, database, device path, recording, image, or network access.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while the child awaits independent review.
- [ ] Route-level proof exists for the GUI reusable-component app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] The rendered editor or inert unsupported result and exact callback outputs are asserted.
- [ ] Invalid, disabled, pending, reset, de-duplication, and unsupported failure behavior is covered.
- [ ] No assertion requires setting-row layout/status composition, API orchestration, camera-view composition, production data, or physical hardware.
