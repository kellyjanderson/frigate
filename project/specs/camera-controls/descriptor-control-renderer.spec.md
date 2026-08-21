# Descriptor Control Renderer Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/specs/camera-controls/descriptor-driven-camera-controls-ui.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/descriptor-driven-camera-controls-ui.spec.md`
Split provenance: `dispatch-2cff32bb-47e0-40f4-9c9f-53c88ffc4a29` sizing result, renderer responsibility separated from camera-view composition and request orchestration
Canonical status: Split child
Review Score: 23
Prerequisites:
- `project/specs/camera-controls/authenticated-camera-control-api.spec.md` - supplies the approved descriptor and value payload contract that the frontend types mirror.
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines supported descriptor mappings, driver authority, effective states, and fail-closed handling.

## Source Field Carryover

- Source purpose:
  - Generate truthful, accessible settings controls from camera-driver descriptors without a camera-model-specific control list.
- Source responsibilities by category:
  - Functions/methods: select an editor kind and validate or normalize a candidate value before emitting a commit.
  - Data structures/models: represent the API descriptor and the renderer's confirmed value and local feedback state.
  - Dependencies/services: React and existing Frigate form, status, and tooltip primitives; API fetching and mutation services are excluded.
  - Returns/outputs/signals: render one stable control row and emit a typed control-ID/value commit request.
  - UI surfaces/components: one reusable `DescriptorSettingControl` row.
  - UI fields/elements: boolean, integer with exact entry, menu/integer-menu, button, string, bitmask, and unsupported metadata presentations.
  - Reusable code plan: reuse existing UI primitives and add one reusable renderer plus frontend camera-control types.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: not applicable; the caller owns request execution and supplies confirmed pending, success, or error state.
  - Destructive/write behavior: not applicable; the renderer emits intent and never calls a camera endpoint.
  - Security/privacy-sensitive behavior: not applicable; authorization and safe API errors belong to the API and state-management siblings.
  - Performance-sensitive behavior: not applicable; one row renders from one descriptor and contains no polling or collection traversal.
  - Cross-screen reusable behavior: not applicable; the assigned consumers are sibling sections in the selected-camera Live surface.
- Source open questions / nuance discovered:
  - The driver-reported descriptor remains authoritative. Generic renderer copy is translated, while driver-provided labels and values are displayed as data.
  - Local feedback is caller-controlled state, not a second mutation lifecycle. This prevents the renderer from racing request reconciliation.
  - The author retains this 23-point child as one cohesive candidate because every editor family implements the same discriminated descriptor, validation, effective-state, feedback, and commit contract. Splitting by primitive would duplicate the public row boundary and make fail-closed selection harder to prove end to end.
- Source split/provenance notes:
  - The parent author score was 47 and required a split. This child owns only the descriptor contract, editor selection, row behavior, and component tests.

## Purpose

Provide one reusable React control row that maps a typed camera-control descriptor to the correct accessible editor and exposes truthful value, capability, and feedback state. The component remains independent of camera selection, API requests, polling, categorization, and popover layout.

## Scope

Owns:

- Frontend descriptor and renderer-state types aligned to the approved API payload.
- Accessible editor selection for boolean, integer, menu/integer-menu, button, string, and bitmask controls.
- Inspectable non-editable rendering for compound, array, payload-bearing, and unknown types.
- Exact numeric entry, descriptor-derived validation, effective-state explanation, fixed row geometry, and caller-supplied pending, success, and error feedback.
- Keyboard, pointer, touch, screen-reader, and component-level test behavior.

Does not own:

- API fetching, value refresh, polling, request mutation, cancellation, stale-response rejection, or write reconciliation.
- Camera-control categorization, list ordering, camera selection, Light or Lens/Geometry launchers, popovers, sections, Levels composition, or Live-route wiring.
- Backend descriptor discovery, device access, authorization, error serialization, or driver writes.

## Split Coverage

- Parent spec: `project/specs/camera-controls/descriptor-driven-camera-controls-ui.spec.md`
- Parent coverage status: assigned child boundary; aggregate coverage remains recorded by the parent review process.
- Parent responsibilities owned by this child:
  - Typed frontend descriptor contract, reusable editor generation, effective-state presentation, local row feedback, fail-closed unsupported rendering, accessible input behavior, and component tests.
- Parent responsibilities still missing from children:
  - none within this assigned child boundary; request orchestration and camera-view composition are explicitly outside it.

## Refinement History

Not applicable before independent review. The assigned candidate record is `project/specs/camera-controls/review-ledger/descriptor-control-renderer-candidate.md`.

## Implementation Routing

- Primary modules/files:
  - `web/src/components/camera-controls/DescriptorSettingControl.tsx` - reusable descriptor-to-editor row, draft handling, validation display, effective-state copy, and feedback slot.
  - `web/src/types/cameraControls.ts` - API-aligned descriptor and renderer-state types.
- Supporting modules/files:
  - `web/public/locales/en/views/live.json` - English source strings for generic control state, validation, success, error, and unsupported explanations, maintained through i18n extraction.
- GUI/QML files, if applicable:
  - React/TypeScript files above; QML is not applicable.
- Reusable library/module files:
  - `web/src/components/camera-controls/DescriptorSettingControl.tsx` - stable single-descriptor component consumed by both physical-control panel sections.
- Tests:
  - `web/src/components/camera-controls/DescriptorSettingControl.test.tsx` - component contract for all editor kinds, states, validation, and input modes.

## Chosen Defaults / Parameters

- A row is editable only when the descriptor is effectively writable and active, none of disabled, read-only, inactive, or grabbed applies, and the caller does not report pending.
- Integer commits must be finite integers within minimum and maximum and satisfy `(value - minimum) % step === 0`; a missing or non-positive step is treated as 1 for presentation validation.
- The integer slider and exact numeric input share one draft. Slider arrow keys use the descriptor step, Home/End use minimum/maximum, and Enter or blur commits a valid changed exact value once.
- Boolean, menu, integer-menu, and labeled bitmask choices emit on deliberate value change. Button emits once per activation. String and unlabeled bitmask fields commit a valid changed value on Enter or blur.
- Bitmask input accepts decimal or `0x` hexadecimal notation. Labeled bits use individually named checkbox controls; unknown set bits remain visible in the numeric value and are not silently cleared.
- Success, error, validation, and effective-state text occupy a reserved status region so state changes do not move the label or editor. Generic messages use `views/live` translations.
- Unsupported, compound, array, payload-bearing, or unrecognized types never receive an editable fallback, even when the descriptor says writable.
- Every directly activatable target is at least 44 by 44 CSS pixels. Tooltip content can supplement but never replace adjacent state text.

## Data Ownership

- Source of truth: the latest confirmed `CameraControlDescriptor` and renderer state supplied by the caller from the approved API contract.
- Read ownership: `DescriptorSettingControl` reads one descriptor, one confirmed value, and caller-supplied feedback state through props.
- Write ownership: the caller owns mutation; the renderer can only invoke `onCommit(controlId, value)` after local validation.
- Derived/cache data: editor kind, effective disabled reason, formatted metadata, and input draft are derived locally; draft resets when the confirmed value or stable control ID changes.
- Privacy/logging constraints: the component logs nothing. It displays only safe descriptor fields and caller-supplied translated error text, never device paths or raw payload bytes.

## Dependencies And Routes

- Domain/service dependencies:
  - Approved camera-control API descriptor/value schema, represented by frontend types.
  - Existing Frigate `Switch`, `Slider`, `Input`, `Select`, `Button`, checkbox, tooltip, and accessible status patterns.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - A sibling physical-control section passes one descriptor, confirmed value, feedback state, and `onCommit` callback to `DescriptorSettingControl`; the component renders a labeled row and emits only validated intent.
- Background/concurrency route, if applicable:
  - not applicable. The renderer starts no requests or timers. Caller prop changes are authoritative, and a pending prop disables only this row.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already defines descriptor fields, editor mappings, effective states, and unknown-type behavior.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - Existing Frigate form and accessibility primitives named in the reuse plan.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/authenticated-camera-control-api.spec.md` - its approved wire schema must be implemented before the renderer can consume live descriptors.
- Progression handling:
  - Renderer implementation can proceed after independent acceptance, but live integration remains gated on the approved API wire contract and separately owned composition/state work.

## Application Integration

- App type: GUI reusable component.
- User/caller surface: one physical camera setting row inside a caller-owned camera-control section.
- Invocation route: caller props render the row; keyboard, pointer, or touch interaction invokes the typed `onCommit` callback after local validation.
- Wiring owner/module: `web/src/components/camera-controls/DescriptorSettingControl.tsx`.
- Observable result: the descriptor produces exactly one appropriate labeled editor or one inspectable non-editable presentation, with stable state and feedback text.
- Integration validation: React component tests render the public component with deterministic descriptors and interact through the same DOM controls used by a panel consumer.
- Incomplete status risk: a helper-only editor-kind test, static markup without callback proof, or a component that performs its own API request does not satisfy this child.

App-type-specific proof:

- GUI: component tests prove visible labels and metadata, every state, focus and keyboard behavior, touch target sizing hooks, validation, callback payloads, and stable row structure. Live-route and overlay proof remain outside this child.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `web/src/components/ui/{switch,slider,input,select,button,checkbox,tooltip}.tsx` - preserve established focus, disabled, pointer, and keyboard behavior.
  - `react-i18next` with `views/live` - provide all generic user-facing copy.
- Current reuse readiness:
  - Reuse existing primitives as-is and compose them in one new reusable camera-controls component.
- Extraction/wrapping needed:
  - none; this child does not move camera-view or Levels code.
- Additions to existing library/modules:
  - `web/src/types/cameraControls.ts` - add the API-aligned descriptor and renderer-state contracts.
- New reusable modules to expose:
  - `web/src/components/camera-controls/DescriptorSettingControl.tsx` - expose the single-row renderer and typed props.
- One-off code justification, if any:
  - none.

## Required DTOs / Functions / Components

- DTOs/models:
  - `CameraControlDescriptor` - a discriminated union keyed by API control type with stable and numeric IDs; driver display name and class; type-valid current/default value; applicable minimum, maximum, step, or inline menu items; flags including disabled, inactive, read-only, volatile, grabbed, slider, execute-on-write, has-payload, and modify-layout; applicable element size/count/dimensions; and backend-derived active, writable, and supported-write state. Boolean values are boolean, numeric/menu/bitmask values are integers, string values are strings, and button values are null.
  - `DescriptorControlState` - confirmed value plus `idle | pending | success | error`, optional translated safe error text, and optional success announcement; it contains no request object or timer.
- Functions/methods:
  - `getDescriptorEditorKind(descriptor) -> DescriptorEditorKind` - return boolean, integer, menu, button, string, labeled-bitmask, numeric-bitmask, or unsupported, failing closed for payload, compound, array, and unknown descriptors.
  - `validateDescriptorValue(descriptor, candidate) -> valid typed value | translated validation code` - parse and enforce the descriptor's type, range, step, menu membership, bitmask bounds, and string constraints before commit.
- UI fields / visible data, if applicable:
  - Label and current value - driver display name and latest confirmed value.
  - Range, step, and default metadata - shown for numeric adjustment and inspection when reported.
  - Effective-state reason - adjacent translated reason for inactive, read-only, grabbed, disabled, unsupported, or pending state.
  - Reserved feedback region - validation, pending, success, or safe error text with appropriate live-region semantics.
- UI elements / controls, if applicable:
  - Boolean switch.
  - Integer slider paired with an exact numeric input.
  - Menu or integer-menu select.
  - Explicit action button.
  - Validated string input.
  - Labeled bit checkboxes or validated decimal/hexadecimal bitmask input.
  - Unsupported metadata presentation with no commit action.
- UI components, if applicable:
  - `DescriptorSettingControl` - reusable single-descriptor row with a stable label, editor region, metadata, and reserved feedback region.

## Performance Contract

- Rendering and validation are O(1) per descriptor except menu and labeled-bit rendering, which are O(items) for that descriptor only.
- The component performs no network access, polling, collection sorting, or global subscriptions and creates no timer.
- Draft state is local to one mounted row and resets only on stable control-ID or confirmed-value change, preventing unrelated rows from rerendering through shared local state.

## Error And State Behavior

- Invalid local input retains the last confirmed value, emits no commit, marks the field invalid, and displays a translated adjacent explanation.
- Pending retains the last confirmed value, disables only the affected editor, sets an accessible busy state, and occupies the reserved feedback region.
- Success synchronizes the draft to the caller's confirmed read-back value and announces success politely. A driver-adjusted value is therefore visible without implying the draft was accepted unchanged.
- Error synchronizes the draft to the last confirmed value, keeps the row present, and displays the caller-supplied safe translated error in the reserved region.
- Inactive, read-only, grabbed, and disabled rows keep identical outer geometry, show current value and reason in text, and expose disabled semantics without relying on color.
- Unsupported rows show safe type, current/default/range, flags, and dimensions when present, omit raw payload content, and never expose a commit action.
- A descriptor type or flag combination not recognized by the frontend is handled as unsupported.

## Test Strategy

- Unit tests:
  - Exercise editor-kind selection and value validation for every supported type, boundaries, step alignment, sparse menu values, decimal/hex bitmasks, strings, payload types, compound/array types, and an unknown type.
- Service/DB tests:
  - not applicable.
- GUI/controller tests, if applicable:
  - Render the public component for each editor kind and state. Exercise labels, descriptions, metadata, keyboard activation, exact entry, focus, disabled semantics, live regions, callback count/payload, 44-pixel target classes, and stable outer row/status structure.
- Integrated route tests:
  - A component-level consumer harness passes descriptor and state props, captures `onCommit`, then supplies pending, success with adjusted read-back, and error states through the public prop boundary.
- Production-data rule:
  - Tests use deterministic descriptors and values and require no camera, API server, production configuration, or database.

## Acceptance Criteria

- Each supported descriptor type renders exactly the assigned editor, with label association and driver-reported current/default/range/step/menu metadata preserved where applicable.
- Integer slider and exact entry stay synchronized; invalid, out-of-range, off-step, absent-menu, overlength, or invalid-bitmask input emits no commit.
- Effective disabled conditions and pending state disable only the row editor while retaining stable geometry, current value, and a non-color-only explanation.
- Pending, success with driver-adjusted read-back, local validation, and caller-supplied error states are exposed in the reserved feedback region with appropriate assistive-technology semantics.
- Compound, array, payload-bearing, and unknown descriptors remain inspectable and never emit a write intent.
- Keyboard, pointer, and touch activation produce one typed `onCommit(controlId, value)` event, with visible focus and at least 44 by 44 CSS pixel direct targets.
- Component tests exercise the public renderer boundary and do not require API requests or production data.

## Readiness Checklist

- [x] Primary ancestor and architecture ancestor are explicit.
- [x] Review Score appears in the front matter and exactly matches the total in the final Review Score Calculation section.
- [x] The current implementation-spec template was loaded and its source path is recorded in the final Review Score Calculation section.
- [x] Review Score is adversarially recounted from the current spec text; prior scores are challenged instead of trusted.
- [x] Unresolved deferral/gap markers such as future spec, blocker, to be defined/TBD, not done, incomplete, unfinished, deferred, or later are either absent/resolved or counted as 100-point scoring events.
- [x] Source fields are carried into spec sections or preserved as explicit provenance/history.
- [x] Canonical status is explicit.
- [x] Prerequisites are linked, implemented, or marked not applicable.
- [x] Missing or stale prerequisite architecture discovered after the architecting phase has an ACD link, or is marked not applicable.
- [x] Missing prerequisite behavior has a final spec link, or is marked not applicable.
- [x] Split coverage is complete, or marked not applicable.
- [x] Per-request review ledger records the latest new-leaf list for the review round, or is marked not applicable before review.
- [x] Implementation owner/module is named.
- [x] Existing code reuse/extraction decision is explicit.
- [x] Existing library/module additions or new reusable module boundaries are named, or marked not applicable.
- [x] UI fields/elements are listed, or marked not applicable.
- [x] Chosen defaults are explicit.
- [x] Data source of truth and write owner are explicit.
- [x] GUI/concurrency route is explicit, or marked not applicable.
- [x] App type and application integration route are explicit.
- [x] Integrated route validation is named.
- [x] GUI/console/API-service/mixed/library-only proof matches the app type.
- [x] Performance bounds are explicit, or marked not applicable.
- [x] Privacy/logging constraints are explicit, or marked not applicable.
- [x] Test strategy does not depend on production data.
- [x] Acceptance criteria are testable.

## Review Score Calculation

- Template source: `../.agents/process/templates/implementation-spec-template.md` (SHA-256 `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`)
- Prior recorded score: 47 for the oversized parent candidate; adversarial input, not trusted.
- Adversarial rescore basis: recounted this renderer-only text, including both pure functions, two frontend contracts, the commit and visual outputs, one reusable UI component, all seven editor/presentation families, primitive and i18n reuse, one type-module addition, and one new reusable component module. Request lifecycle, polling, categorization, panels, permissions, writes, and route integration are excluded. The 23-point result received explicit split review: the editor families remain together because they are variants of one discriminated public row contract and separating them would duplicate selection, state, feedback, and commit semantics.
- Functions/methods: 2 x 2 = 4
- Data structures/models: 2 x 1 = 2
- Dependencies/services: 1 x 1 = 1
- Returns/outputs/signals: 2 x 1 = 2
- UI surfaces/components: 1 x 2 = 2
- UI fields/elements: 7 x 1 = 7
- Existing reusable code reused as-is: 2 x 0.5 = 1
- Adding code to an existing library/module: 1 x 1 = 1
- Creating a new reusable library/module: 1 x 3 = 3
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 0 x 3 = 0
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 0 x 3 = 0
- Performance-sensitive behavior: 0 x 2 = 0
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 23
- If total matches prior score, adversarial survival reason: not applicable; the renderer-only recount is lower than the parent score.
