# Accessible Descriptor Value Editors Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/specs/camera-controls/descriptor-control-renderer.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/descriptor-control-renderer-review-pass-1.md`
Split provenance: `project/specs/camera-controls/descriptor-control-renderer.spec.md`, child 2 from independent review pass `descriptor-control-renderer-pass-1`
Canonical status: Split child
Review Score: 24.5
Prerequisites:
- `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md` - owns the normalized descriptor, editor-kind, validation-result, control-state, and typed commit contracts consumed here; its implementation is present on the integration branch at orchestrator-supplied merge commit `bd247dd9f8ed2b27d96fad5fd5be9be14cd897d8`.
- `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` - owns the final shared wire contract to which the descriptor/value-policy prerequisite is aligned; this component does not call its HTTP routes.
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines descriptor-driven editor mappings, driver authority, effective states, and fail-closed handling.

## Source Field Carryover

- Source purpose:
  - Give a caller-owned camera setting row one reusable, accessible editor for any supported normalized descriptor while preserving exact, validated typed commit intent.
- Source responsibilities by category:
  - Functions/methods: not applicable; the public React component is counted under UI surfaces/components, and private event handlers do not become reusable contracts.
  - Data structures/models: define the public component props that bind one normalized descriptor/control state to commit and local-validation callbacks plus caller-owned accessible-description IDs.
  - Dependencies/services: consume the descriptor/value-policy prerequisite and reuse React with existing Frigate form primitives; no HTTP or device service is owned here.
  - Returns/outputs/signals: render one supported editor or minimal inert unsupported editor-slot state, emit one typed commit intent, and report local validation-code changes to the row consumer.
  - UI surfaces/components: one reusable `DescriptorValueEditor` component with private editor branches.
  - UI fields/elements: boolean switch, practical-range integer slider with exact numeric entry, menu/integer-menu select, action button, string input, labeled bit choices, numeric bitmask input, and inert unsupported compound/array state.
  - Reusable code plan: reuse existing Frigate UI primitives and add one reusable camera-control editor module.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: not applicable; the component starts no request, task, timer, or subscription.
  - Destructive/write behavior: not applicable; the component emits synchronous intent and never calls an API or device.
  - Security/privacy-sensitive behavior: not applicable; only normalized safe contracts enter this component, and the unsupported state receives caller-supplied safe text rather than raw payload data.
  - Performance-sensitive behavior: not applicable; work is local to one descriptor and its bounded menu or labeled-bit collection.
  - Cross-screen reusable behavior: not applicable; the named consumer is the sibling camera-control setting row.
- Source open questions / nuance discovered:
  - The unsupported state owned here is only the editor slot's clear inert presentation. Diagnostic metadata, translated row copy, status composition, and safe-data selection remain owned by `descriptor-setting-row.spec.md`.
  - A practical integer slider has a positive normalized step and no more than 1,000 inclusive step intervals. Every supported integer still receives exact numeric entry, including ranges above that threshold.
  - The component reports stable validation codes from the prerequisite unchanged. The row sibling owns translated validation text and live-region presentation.
- Source split/provenance notes:
  - The reviewed parent scored 36 and was split into descriptor contracts/value policy, accessible value editors, and setting-row state/unsupported diagnostic presentation. This child owns only editable input mechanics, minimal unsupported editor-slot behavior, and editor-level component verification.

## Purpose

Provide one reusable React component that turns a normalized camera-control descriptor into the correct accessible value editor and emits only validated typed intent. The component owns input mechanics and local drafts, while its caller owns row layout, labels, metadata, feedback copy, request execution, and camera-view composition.

## Scope

Owns:

- Boolean, integer, menu/integer-menu, button, string, labeled-bitmask, and numeric-bitmask editor branches selected through the prerequisite's editor-kind policy.
- One local draft per mounted control, exact validation, deliberate-change rules, Enter/blur de-duplication, slider keyboard semantics, and whole-value bitmask commits that preserve unknown set bits.
- Disabled and pending input semantics, visible focus, keyboard/pointer equivalence, 44 by 44 CSS pixel directly activatable targets, and narrow-width editor containment.
- A clear inert editor-slot presentation for unsupported, compound, and array kinds, without diagnostic metadata or write affordances.
- Public-component tests for editor selection, validation boundaries, callback count/payload, draft synchronization, supported input modes, and fail-closed disabled/unsupported behavior.

Does not own:

- Descriptor normalization, editor-kind policy, value parsing/validation rules, stable validation codes, effective writable policy, or shared callback/value types.
- Setting-row label/current-value association, range/step/default metadata, effective-state explanations, reserved feedback region, translated status/validation copy, pending/success/error presentation, or unsupported diagnostic metadata.
- API fetching, mutation, polling, cancellation, stale-response rejection, write read-back reconciliation, permissions, physical-device access, or camera-view composition.

## Split Coverage

- Parent spec: `project/specs/camera-controls/descriptor-control-renderer.spec.md`
- Parent coverage status: 100% covered by the three-child split plan in `project/specs/camera-controls/review-ledger/descriptor-control-renderer-review-pass-1.md`.
- Parent responsibilities owned by this child:
  - Every editable control family, local draft and deliberate commit behavior, accessible keyboard/pointer/touch operation, pending disablement, minimal inert unsupported editor-slot behavior, and editor-level component tests.
- Parent responsibilities still missing from children:
  - none in the recorded three-child renderer plan. Aggregate coverage of `project/specs/camera-controls/descriptor-driven-camera-controls-ui.spec.md` remains outside this child's authority.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/descriptor-control-renderer-review-pass-1.md` | 1 | `project/specs/camera-controls/descriptor-control-renderer.spec.md` and paired test specification | `camera-control-descriptor-contracts.spec.md`, this child, and `descriptor-setting-row.spec.md` definitions | continue |

## Implementation Routing

- Primary modules/files:
  - `web/src/components/camera-controls/DescriptorValueEditor.tsx` - public component, private type branches, local draft/reset state, accessible wiring, commit de-duplication, and inert unsupported editor-slot state.
- Supporting modules/files:
  - `web/src/types/cameraControls.ts` - prerequisite-owned public descriptor, state, validation, value, and callback types; consume without redefining.
  - `web/src/utils/cameraControlDescriptors.ts` - prerequisite-owned editor-kind and value-validation functions; consume without wrapping or duplicating policy.
- GUI/QML files, if applicable:
  - React/TypeScript file above; QML is not applicable.
- Reusable library/module files:
  - `web/src/components/camera-controls/DescriptorValueEditor.tsx` - stable editor boundary consumed by `DescriptorSettingControl`.
- Tests:
  - `web/src/components/camera-controls/DescriptorValueEditor.test.tsx` - Vitest/jsdom public-component coverage through rendered DOM controls and callbacks.

## Chosen Defaults / Parameters

- `DescriptorValueEditor` switches only on the prerequisite's `DescriptorEditorKind`; it does not infer support from raw type names or flags.
- A practical integer slider has finite safe minimum/maximum values, a positive normalized step, and at most 1,000 inclusive step intervals. Practical ranges render a slider and exact numeric input sharing one draft; larger ranges render exact numeric input only.
- Slider Arrow keys use the normalized step, Page Up/Page Down use ten steps without crossing bounds, and Home/End select minimum/maximum. Pointer or touch movement updates the draft, and the primitive's deliberate commit event emits one validated commit.
- Exact integer, string, and numeric-bitmask inputs commit a valid changed draft on Enter or blur. Enter records the attempted draft so the immediately following blur cannot emit a duplicate. Escape restores the latest confirmed value, clears local validation, and emits no commit.
- Boolean, menu, integer-menu, labeled-bit choices, and button controls emit once on deliberate activation. Button value is exactly `null`. Menu branches submit the normalized value selected by the prerequisite contract.
- A labeled-bit change merges that known bit into the current full draft mask and submits the whole mask, preserving every unknown set bit. Numeric bitmask entry accepts only formats accepted by the prerequisite validator.
- The caller-confirmed current value initializes and resets the draft. A reported descriptor default never replaces a present confirmed value and is never submitted automatically; it remains descriptor data for the row sibling to present or use in an explicit caller-owned reset action.
- Stable control ID, editor kind, validation-affecting descriptor metadata, confirmed value, or a transition from pending to success/error resets the draft from the caller-confirmed value and clears local validation. Entering pending alone retains the submitted draft and disables every constituent control.
- Directly activatable targets, including switch, slider interaction rail, select trigger, button, exact inputs, and each labeled-bit label/control pair, are at least 44 by 44 CSS pixels. Focus-visible styling remains supplied by the reused primitives and is not suppressed.
- Default, hover, focus, pressed, selected, disabled, and invalid cues reuse established theme tokens. New styling must preserve WCAG AA text contrast and at least 3:1 contrast for meaningful non-text indicators, with text or semantics carrying every important state in addition to color.
- Editor content grows or wraps inside its caller-provided slot at narrow widths. It does not clip focus rings, labels for bit choices, validation association, or the exact-entry control.

## Data Ownership

- Source of truth: the normalized `CameraControlDescriptor` and caller-confirmed `DescriptorControlState` supplied by the descriptor/value-policy prerequisite.
- Read ownership: `DescriptorValueEditor` reads one descriptor/state pair and caller-owned accessible label/description IDs through props.
- Write ownership: none. The component invokes the prerequisite-owned synchronous commit callback after successful validation; a separate caller owns mutation.
- Derived/cache data: one local draft, last attempted/committed draft for de-duplication, and current local validation code are derived per mounted stable control ID and can be rebuilt from props.
- Privacy/logging constraints: the component logs nothing, receives no raw API payload, device path, byte payload, or server exception, and renders unsupported text supplied through the caller's safe presentation boundary.

## Dependencies And Routes

- Domain/service dependencies:
  - `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md` supplies normalized contracts plus editor-kind and validation functions.
  - Existing React and Frigate `Switch`, `Slider`, `Input`, `Select`, `Button`, and `Checkbox` primitives supply established focus, disabled, keyboard, and pointer behavior.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - `DescriptorSettingControl` passes one normalized descriptor/state pair, accessible association IDs, safe unsupported text, and callbacks to `DescriptorValueEditor`; DOM interaction updates the local draft and reaches the commit callback only after prerequisite validation succeeds.
- Background/concurrency route, if applicable:
  - not applicable. Prop state is authoritative, all callbacks are synchronous intent, and no request or timer begins here.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already defines supported editor mappings, driver authority, effective states, fail-closed behavior, and the separation from Live Image Levels.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md` - orchestrator reports its implementation merged into `codex/live-levels-control` at `bd247dd9f8ed2b27d96fad5fd5be9be14cd897d8`.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - none for isolated editor implementation and deterministic component verification; live HTTP consumption remains outside this component boundary.
- Progression handling:
  - current item may proceed only after independent specification acceptance; the direct value-policy implementation prerequisite is already sequenced.

## Application Integration

- App type: GUI reusable component.
- User/caller surface: the editor slot inside a caller-owned physical camera setting row.
- Invocation route: the row renders `DescriptorValueEditor`; keyboard, pointer, or touch interaction changes a local draft and invokes the typed commit callback only after successful prerequisite validation.
- Wiring owner/module: `web/src/components/camera-controls/DescriptorValueEditor.tsx`.
- Observable result: exactly one accessible editor for a supported kind or one visible inert unsupported state, plus exact commit and validation callback events.
- Integration validation: `DescriptorValueEditor.test.tsx` mounts the exported component with prerequisite-shaped contracts, operates its actual DOM controls, and records callback events while rerendering confirmed/pending/resolved props.
- Incomplete status risk: designed. Tests of private handlers, direct validator-only tests, or markup that bypasses the exported component do not satisfy this child.

App-type-specific proof:

- GUI: public-component tests prove editor selection, focus visibility hooks, accessible association, keyboard/pointer/touch-equivalent paths, 44-pixel hit-area hooks, disabled/pending states, narrow-width containment classes, exact callback behavior, and inert unsupported rendering. Row-level status and Live-route proof remain excluded.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `web/src/components/ui/{switch,slider,input,select,button,checkbox}.tsx` - compose the established Radix/native control semantics, focus rings, and disabled behavior while adding editor-level 44-pixel hit areas.
- Current reuse readiness:
  - reuse the existing primitives as-is and consume the merged camera-control type/policy modules as the authoritative prerequisite.
- Extraction/wrapping needed:
  - none; no row, Levels, camera-view, or API code moves into this child.
- Additions to existing library/modules:
  - none.
- New reusable modules to expose:
  - `web/src/components/camera-controls/DescriptorValueEditor.tsx` - expose `DescriptorValueEditor` and its props as the sole editable-editor boundary.
- One-off code justification, if any:
  - none.

## Required DTOs / Functions / Components

- DTOs/models:
  - `DescriptorValueEditorProps` - normalized descriptor and `DescriptorControlState`; caller-owned `aria-labelledby` and optional `aria-describedby` IDs; required safe unsupported description; prerequisite-owned typed `onCommit`; and `onValidationChange(controlId, validationCode | null)` for local validation presentation by the row.
- Functions/methods:
  - not applicable; private branch renderers and event handlers remain implementation details of the public component.
- UI fields / visible data, if applicable:
  - Boolean switch - controlled from the shared draft and submits a typed boolean.
  - Integer editor - practical-range slider plus exact numeric input, or exact input alone for a larger range.
  - Menu/integer-menu select - renders the normalized sparse options and submits the contract-defined selected value.
  - Explicit action button - submits `null` once per activation.
  - Validated string input - preserves draft text and exposes invalid association without owning error copy.
  - Labeled bit choices - accessible checkbox/label targets that merge known bits into the full mask.
  - Numeric bitmask input - exact decimal or hexadecimal draft accepted only through prerequisite validation.
  - Unsupported editor-slot state - visible inert caller-safe text with no focusable control, input role, or commit path.
- UI elements / controls, if applicable:
  - The eight fields above are the complete editor inventory. Every supported control receives caller-owned accessible labeling/description IDs and an editor-local invalid state where applicable.
- UI components, if applicable:
  - `DescriptorValueEditor` - one reusable public component with private discriminated branches and one shared draft/validation/commit state machine.

## Performance Contract

- Not performance-sensitive. One mounted component processes one descriptor; menu and labeled-bit work is linear only in that descriptor's normalized item collection.
- The component performs no network access, polling, global subscription, collection-wide traversal, animation loop, or timer.
- Draft updates rerender only the mounted editor. Callback identities and normalized props remain caller-owned, and this child adds no shared global state.

## Error And State Behavior

- Invalid local input retains the draft for correction, sets `aria-invalid`, reports the prerequisite's stable validation code, and emits no commit. A valid edit clears local validation before emitting intent.
- Pending retains the submitted draft, disables every focusable/activatable editor element, exposes native or Radix disabled semantics, and ignores handler events already queued after disablement. Presentation of busy text or live status belongs to the row.
- A confirmed value or descriptor-policy change resets the draft to caller truth. Pending resolution to success/error also resets from caller truth, so driver adjustment and rejection do not leave an optimistic value in the editor.
- Unsupported, compound, array, or otherwise unsupported kinds render the safe inert editor-slot description and no input, action, focus target, or callback path.
- Disabled semantics do not rely on opacity or color alone: native/Radix disabled state prevents interaction, while the row supplies adjacent reason text through the associated description ID.
- Focus remains visible for every keyboard-operable target. Escape cancellation, Enter commit, slider keys, Space/Enter primitive activation, pointer input, and touch hit areas do not change a control's meaning.
- Long menu and bit labels wrap within the editor slot; option collections use the existing select viewport scrolling behavior, and no meaningful text is silently clipped.

## Test Strategy

- Unit tests:
  - not applicable; pure editor-kind and value-policy cases belong to `cameraControlDescriptors.test.ts` under the prerequisite.
- Service/DB tests:
  - not applicable.
- GUI/controller tests, if applicable:
  - Render the exported component for every editor kind with Vitest/jsdom and a React DOM consumer harness. Exercise accessible associations, focus-visible classes, keyboard/pointer events, touch-target classes, narrow-width containment, disabled semantics, local draft changes, and callback count/payload.
- Integrated route tests:
  - Rerender one mounted public component through confirmed, pending, success with driver-adjusted value, and error with prior confirmed value. Prove draft synchronization and zero network access without asserting row-owned status copy or layout.
- Production-data rule:
  - Tests use deterministic normalized descriptor/state fixtures and require no camera, API server, production configuration, database, device path, recording, or image.

## Acceptance Criteria

- Every supported descriptor editor kind renders its assigned control through the public component; unsupported, compound, and array kinds render clear inert editor-slot text with no write affordance.
- The latest caller-confirmed current value, not the descriptor default, initializes/resets the draft; the component never auto-submits a default value.
- Integer exact entry is always available, while the slider appears only for the chosen practical-range threshold and shares one synchronized draft.
- Out-of-range, off-step, absent-menu, invalid string, and invalid-bitmask drafts report the stable prerequisite validation code and emit no commit.
- Enter plus the following blur emits at most one commit; Escape emits none; boolean, select, labeled-bit, slider, and button activation each emit exactly one typed callback event.
- Labeled-bit commits preserve unknown set bits, and button commits exactly `null`.
- Pending or nonwritable state disables every constituent control and prevents callbacks; confirmed/policy changes and pending resolution reset the draft to caller truth.
- All interactive targets have visible focus behavior and at least 44 by 44 CSS pixel hit areas, remain operable by keyboard and pointer/touch-equivalent input, and preserve meaning without color-only cues.
- Editor text and meaningful non-text indicators meet the stated contrast thresholds without suppressing established hover, focus, pressed, selected, disabled, or invalid cues.
- Component tests exercise the exported DOM route and require no HTTP request, production data, or physical hardware.
- The implementation contains no setting-row layout/status composition, API orchestration, or camera-view composition.

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
- Prior recorded score: 36 for the independently reviewed unsplit renderer parent; adversarial input, not trusted for this child.
- Adversarial rescore basis: recounted this editor-only text, including the props model, two dependencies, three distinct outputs/signals, one public UI component, eight editor elements, the existing primitive suite, one new reusable component module, the safe-data/privacy boundary, and bounded descriptor-local rendering behavior. The private discriminated branches remain one component because they share the same normalized descriptor input, draft/reset lifecycle, validation gate, accessible association, disabled/pending behavior, and callback boundary. At 24.5, explicit split review supports retaining the cohesive component; splitting by control family would duplicate that state machine and public component contract, while descriptor policy and setting-row presentation are already separate ownership boundaries.
- Functions/methods: 0 x 2 = 0
- Data structures/models: 1 x 1 = 1
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 3 x 1 = 3
- UI surfaces/components: 1 x 2 = 2
- UI fields/elements: 8 x 1 = 8
- Existing reusable code reused as-is: 1 x 0.5 = 0.5
- Adding code to an existing library/module: 0 x 1 = 0
- Creating a new reusable library/module: 1 x 3 = 3
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 0 x 3 = 0
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 24.5
- If total matches prior score, adversarial survival reason: not applicable; this split child score is lower than the independently reviewed parent score.
