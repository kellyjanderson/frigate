# Descriptor-Driven Camera Controls UI Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/architecture/acd/usb-v4l2-camera-controls.md` and the user-requested two-panel camera-view interaction
Split provenance: `none`
Canonical status: Draft
Review Score: 47
Prerequisites:
- `project/specs/camera-controls/v4l2-camera-control-provider-api.spec.md` - owns the authenticated camera-scoped descriptor, current-value, and write contracts consumed by this UI
- `project/specs/camera-controls/tests/v4l2-camera-control-provider-api.test-spec.md` - proves the API contract against deterministic driver fixtures before UI integration
- `web/src/components/player/LiveImageLevelsControl.tsx` - supplies the existing display-only Levels control, histogram, and trapped-handle behavior that the Light surface must preserve

## Source Field Carryover

- Source purpose:
  - Generate camera settings from hardware descriptors instead of maintaining a Logitech-specific control list, while keeping display-only Levels visually and behaviorally distinct from physical writes.
- Source responsibilities by category:
  - Functions/methods: categorize descriptors, fetch and reconcile control state, render the correct editor by descriptor type, and submit one physical control update.
  - Data structures/models: typed frontend representation of the API descriptor, menu item, effective state, category, current value, and write state.
  - Dependencies/services: the camera-scoped control API, the existing SWR/axios client boundary, Frigate authentication state, and existing Radix-based UI primitives.
  - Returns/outputs/signals: categorized control collections, generated control editors, reconciled driver values, and visible per-panel or per-control status.
  - UI surfaces/components: two camera-view entry buttons, a Light popover, a Lens/Geometry popover, and a reusable descriptor control renderer.
  - UI fields/elements: Levels, booleans, bounded numeric values, menus, action buttons, validated text/bitmask values, unsupported metadata, and state/error messages.
  - Reusable code plan: reuse the Levels control and shared Button, Popover, Switch, Slider/Input, Select, Tooltip, and status primitives; create one descriptor renderer shared by both physical-control panels.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: fetch while a physical panel is open, bounded polling of volatile values, one in-flight write per control, stale-response rejection, descriptor refresh after modify-layout, and polling cancellation on close or camera change.
  - Destructive/write behavior: physical writes can change the camera source used by live view, recordings, snapshots, exports, and detection.
  - Security/privacy-sensitive behavior: buttons and requests are restricted to authorized administrators; error copy and logs do not expose device paths.
  - Performance-sensitive behavior: descriptor enumeration is not polled; only volatile values refresh, at a bounded rate, while a physical panel is visible.
  - Cross-screen reusable behavior: the descriptor renderer is reusable by both assigned panels, but this specification exposes it only from single-camera Live view.
- Source open questions / nuance discovered:
  - The API specification owns exact endpoint paths and response names. This UI owns a typed client adapter and must consume the approved API contract without adding another endpoint shape.
  - The backend descriptor is authoritative for control type and effective state. Presentation category is a frontend concern with an explicit fallback.
- Source split/provenance notes:
  - The author score exceeds the forced-split threshold. This artifact preserves the complete requested body for independent review and child-boundary assignment; it is not implementation-authorized.

## Purpose

Provide a reusable descriptor-to-control builder and two compact camera-view entry points: Light for display-only Levels plus light-related physical settings, and Lens/Geometry for physical focus, sharpness, zoom, pan, tilt, and related settings. The UI must remain hardware-driven, accessible, responsive, and truthful about whether a change affects only browser display or the camera source.

## Scope

Owns:

- A typed frontend adapter for descriptors and values returned by the approved camera-control API.
- Descriptor categorization into `light`, `lens_geometry`, and `other`, including stable ordering and an inspectable fallback for unknown controls.
- Reusable editor generation for supported V4L2 descriptor types and explicit non-editable presentation for unsupported types.
- Two labeled buttons in the selected camera's Live view, with mutually exclusive Light and Lens/Geometry popovers.
- Existing Live Image Levels, including its histogram and trapped-handle selection behavior, inside the Light popover.
- Physical-control loading, unavailable, inactive, read-only, grabbed, disabled, write-pending, write-failed, disconnected, and driver-adjusted states.
- Bounded refresh of volatile values while a physical-control popover is visible.
- Keyboard, focus, screen-reader, pointer, touch, narrow viewport, orientation-change, and overflow behavior.
- Unit, component, and Live route tests using deterministic descriptor/API fixtures.

Does not own:

- V4L2 discovery, device locking, ioctl behavior, device identity, endpoint authorization, or API error serialization.
- Hardware-specific lists of available controls or Logitech-only UI branches.
- Persistence claims beyond the live value reported by the driver.
- Changing the display-only Levels math, histogram sampling, trapped-handle algorithm, or browser-filter application route.
- Audio capture, USB attachment, unplug/replug service recovery, or capture restart orchestration.

## Split Coverage

- Parent spec: `none`
- Parent coverage status: not applicable
- Parent responsibilities owned by this child:
  - not applicable
- Parent responsibilities still missing from children:
  - none

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/descriptor-driven-camera-controls-ui-candidate.md` | 0 | candidate authoring only | none | not applicable before review |

## Implementation Routing

- Primary modules/files:
  - `web/src/components/player/CameraControlsPalette.tsx` - owns the two camera-view launchers, mutually exclusive popover state, focus restoration, and panel composition.
  - `web/src/components/camera-controls/DescriptorSettingControl.tsx` - reusable descriptor-to-editor renderer and visible effective-state treatment.
  - `web/src/hooks/use-camera-controls.ts` - owns API fetch, volatile refresh, write reconciliation, stale-result rejection, and cancellation.
- Supporting modules/files:
  - `web/src/types/cameraControls.ts` - frontend descriptor, menu item, category, value, and API result types.
  - `web/src/utils/cameraControls.ts` - pure categorization, stable sorting, writable-state derivation, and supported-type selection.
  - `web/src/views/live/LiveCameraView.tsx` - supplies the selected camera identity and renders the palette in the real camera route.
  - `web/src/App.tsx` - removes the global `MediaToolsPalette` mount after Levels is reachable from the camera-scoped Light surface.
  - `web/src/components/player/MediaToolsPalette.tsx` - extract or replace its Levels persistence/filter composition without changing stored values or filter behavior.
  - `web/public/locales/en/views/live.json` - English source strings for buttons, panel descriptions, states, and errors, updated through the repository i18n extraction workflow.
- GUI/QML files, if applicable:
  - React/TypeScript files listed above; QML is not applicable.
- Reusable library/module files:
  - `web/src/components/camera-controls/DescriptorSettingControl.tsx` - stable renderer used by both physical-control sections.
  - `web/src/hooks/use-camera-controls.ts` - camera-scoped descriptor/value state boundary.
- Tests:
  - `web/src/utils/cameraControls.test.ts` - categorization, ordering, and effective-state unit tests.
  - `web/src/components/camera-controls/DescriptorSettingControl.test.tsx` - descriptor type and state rendering tests.
  - `web/src/hooks/use-camera-controls.test.tsx` - refresh, write, reconciliation, and stale-result tests.
  - `web/e2e/specs/live.spec.ts` - real single-camera route, accessibility, mobile overflow, and mocked API interaction tests.

## Chosen Defaults / Parameters

- The launchers appear only in a selected single-camera Live view and only when the current user may call the administrator-only physical-control API. Display-only Levels remains inside Light for those users; users without physical-control permission do not see misleading hardware buttons.
- Only one popover is open at a time. Opening one closes the other. Escape and outside activation close it and return focus to its launcher.
- Popovers use the existing responsive overlay pattern: anchored popover at desktop widths and a bottom drawer or equivalently bounded full-width surface on narrow/mobile layouts.
- The content area has a maximum height derived from `100dvh`, scrolls internally, preserves the launchers' position, and does not expand or shift the video layout.
- Light order is: display-only Levels section, a visible divider and camera-source explanation, categorized physical controls, then `other` controls that the backend marks light-related only if the API supplies a presentation hint accepted by the frontend adapter.
- Lens/Geometry order is: focus/autofocus, zoom, pan, tilt, sharpness, then other lens or geometric controls. Descriptor display name is used for labels; stable serialized ID breaks ties.
- Built-in categorization recognizes standardized descriptor IDs/names for brightness, contrast, saturation, gain, exposure, white balance, backlight compensation, and power-line frequency as `light`; focus, zoom, pan, tilt, roll, iris, and sharpness as `lens_geometry`; all unmatched descriptors become `other` and remain inspectable.
- `other` controls appear in a collapsed section in Lens/Geometry so every reported descriptor remains reachable exactly once without pretending an unknown function is light-based.
- Boolean uses Switch; integer uses Slider plus exact numeric Input when finite range and step are usable; menu/integer-menu uses Select; button uses Button; string uses validated Input; labeled bitmask uses checkbox choices; unlabeled bitmask uses validated numeric Input.
- Compound, array, and unknown types render descriptor metadata with an `Unsupported editor` state and no write action.
- Numeric input commits on Enter or blur only when within minimum/maximum and aligned to step. Invalid text remains local and shows an inline validation message without sending a request.
- A write disables only that editor, keeps the prior value visible, and replaces it with the read-back value on success. If the driver clamps or couples a value, the returned value is shown immediately with a short non-modal `Adjusted by camera` status.
- Volatile value refresh starts only while a physical panel containing volatile controls is open, runs no faster than once per second, and stops immediately when the panel closes, the camera changes, the page becomes hidden, or the component unmounts.
- Descriptor enumeration occurs on first physical-panel open for a camera, reconnect, explicit Retry, or a successful response carrying `modify_layout`; ordinary volatile refresh retrieves values only.
- Levels persistence keeps the existing `media-tools-levels` key and remains display-only. Closing or switching physical panels does not reset Levels.

## Data Ownership

- Source of truth: the camera driver and approved camera-control API own descriptors and physical values; `useUserPersistence` owns the browser-local Levels value.
- Read ownership: `use-camera-controls.ts` reads the selected configured camera through the authenticated API adapter; Levels reads its existing browser persistence entry.
- Write ownership: `use-camera-controls.ts` sends one control update through the approved API client; `LiveImageLevelsControl` writes only browser persistence through its callback.
- Derived/cache data: category, ordering, supported editor selection, and transient request state are derived in the frontend and can be recomputed from descriptors and current values.
- Privacy/logging constraints: never display or log Linux device paths, USB serials, raw API bodies, or filesystem errors. UI errors use stable translated categories and camera display name only.

## Dependencies And Routes

- Domain/service dependencies:
  - The approved `project/specs/camera-controls/v4l2-camera-control-provider-api.spec.md` contract.
  - Existing authenticated axios/SWR setup in `web/src/api/index.tsx`.
  - Existing Levels filter, control, histogram hook, and persistence behavior.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - `Live` route with `#<camera>` -> `LiveCameraView(camera)` -> `CameraControlsPalette(camera.name)` -> Light or Lens/Geometry launcher -> `useCameraControls(camera.name)` -> approved camera-control API -> descriptor/value state -> `DescriptorSettingControl`.
  - Levels route: Light launcher -> existing persisted Levels state -> `LiveImageLevelsControl` -> existing `LiveImageLevelsFilter` applied to live media only.
- Background/concurrency route, if applicable:
  - SWR performs descriptor/value reads; a visibility-scoped interval requests volatile values; an AbortController or equivalent request generation token rejects responses from a closed panel or previously selected camera; a per-control pending map prevents duplicate writes; the server remains the serialization authority across clients.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already records generated UI, API, security, refresh, source-of-truth, and unsupported-type contracts.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `web/src/components/player/LiveImageLevelsControl.tsx` - existing Levels editor, histogram, and trapped-handle behavior.
  - `web/src/components/player/LiveImageLevelsFilter.tsx` - existing display-only browser filter.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none; the provider/API candidate path is named above and must reach independent approval.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/v4l2-camera-control-provider-api.spec.md` - implement and validate its typed route before enabling physical editors.
- Progression handling:
  - Physical-control UI implementation follows the approved and implemented provider/API contract. The Levels extraction can be prepared in the same feature branch only after the final split assigns file ownership without overlap.

## Application Integration

- App type: mixed GUI and API-consuming frontend.
- User/caller surface: Light and Lens/Geometry buttons in the selected camera's Live view.
- Invocation route: button activation opens a camera-scoped responsive overlay; editor interaction invokes the approved camera-control client; Levels interaction invokes existing browser persistence and SVG filter behavior.
- Wiring owner/module: `web/src/views/live/LiveCameraView.tsx` and `web/src/components/player/CameraControlsPalette.tsx`.
- Observable result: the selected camera exposes two stable launchers; each overlay renders current descriptor-driven controls and explicit state; successful physical writes show driver read-back values; Levels changes affect only visible browser media.
- Integration validation: Playwright opens `/#front_door`, exercises both launchers against mocked descriptor/value/write routes, checks focus and mobile containment, and proves Levels persists and filters the live target without issuing a physical write.
- Incomplete status risk: a renderer mounted outside `LiveCameraView`, a panel fed by static Logitech controls, or a write test that bypasses the camera route is not integrated proof.

App-type-specific proof:

- GUI: both visible entrypoints, state coverage, stale-response behavior, keyboard/focus behavior, and the single-camera route are tested.
- API/service: the frontend proves authorized request shape, stable error consumption, read-back reconciliation, and absence of requests for display-only Levels; server auth and ioctl side effects remain owned by the provider/API specification.
- Mixed: GUI reachability and API-consuming behavior each receive separate assertions.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `web/src/components/player/LiveImageLevelsControl.tsx` - reuse without changing its histogram or level-handle behavior.
  - `web/src/components/player/LiveImageLevelsFilter.tsx` - retain the existing display-only filter boundary.
  - `web/src/components/ui/{button,popover,drawer,switch,slider,input,select,tooltip}.tsx` - use established Frigate interaction primitives.
  - `web/src/api/index.tsx` plus SWR - retain authenticated base URL, fetch, mutation, and cache conventions.
- Current reuse readiness:
  - Levels control and primitives are reusable as-is; palette composition needs extraction from the current global `MediaToolsPalette`; the API hook and descriptor renderer are new reusable modules.
- Extraction/wrapping needed:
  - `CameraControlsPalette` takes `cameraName`, Levels value/callback, permission state, and open-state ownership so it can be mounted by `LiveCameraView` without duplicating filter logic.
- Additions to existing library/modules:
  - `web/src/types/cameraControls.ts` adds the approved API-facing frontend types.
  - `web/src/utils/cameraControls.ts` adds pure categorization and editor-selection helpers.
  - `web/src/views/live/LiveCameraView.tsx` adds the selected-camera palette entrypoint.
- New reusable modules to expose:
  - `DescriptorSettingControl` and `useCameraControls` expose stable descriptor rendering and camera-scoped state boundaries.
- One-off code justification, if any:
  - Camera-view placement and the two product-specific panel compositions remain local to `CameraControlsPalette`; descriptor rendering and state management are reusable.

## Required DTOs / Functions / Components

- DTOs/models:
  - `CameraControlDescriptor` - stable ID, numeric V4L2 ID, display name, class, type, bounds, step, default/current values, menu items, flags, element metadata, effective active/writable state, and optional approved presentation hint.
  - `CameraControlValue` - stable control ID, current value, and value revision or request generation used for stale-response rejection.
  - `CameraControlPanelState` - descriptor/value collection plus initial-loading, refreshing, disconnected, permission, panel error, and per-control pending/error state.
- Functions/methods:
  - `categorizeCameraControl(descriptor) -> CameraControlCategory` - maps known standardized controls or an approved presentation hint to Light or Lens/Geometry and returns `other` otherwise.
  - `useCameraControls(cameraName, active) -> CameraControlPanelState and actions` - fetches, refreshes, writes, reconciles, retries, and cancels camera-scoped state.
  - `renderDescriptorEditor(descriptor, state, onCommit) -> ReactNode` - selects a supported accessible editor or an inspectable unsupported state.
- UI fields / visible data, if applicable:
  - Control label and optional description - descriptor display name and translated state context.
  - Current/default/range/step - shown when useful for exact adjustment or unsupported diagnostics.
  - Effective state and error - translated reason adjacent to the affected editor.
  - Physical-camera notice - states that changes affect the camera source and may affect recording, detection, snapshots, and exports.
  - Display-only notice - states that Levels changes affect only the current browser display.
- UI elements / controls, if applicable:
  - Light launcher - opens the Light overlay and exposes `aria-expanded` and `aria-controls`.
  - Lens/Geometry launcher - opens the Lens/Geometry overlay with the same accessible state contract.
  - Levels editor - existing five-point control, histogram, labels, reset, and persistence.
  - Generated boolean/numeric/menu/button/text/bitmask editor - chosen strictly from descriptor type and effective state.
  - Retry action - repeats descriptor discovery after a recoverable load or disconnected state.
- UI components, if applicable:
  - `CameraControlsPalette` - owns camera-scoped launchers, overlays, Levels composition, and focus lifecycle.
  - `DescriptorSettingControl` - reusable single-descriptor renderer.
  - `CameraControlSection` - stable section heading, state message, and control list without layout movement.

## Performance Contract

- One descriptor request occurs on first physical-panel open per selected camera unless cache invalidation, reconnect, Retry, or `modify_layout` requires another.
- Volatile value polling is at most 1 Hz, is scoped to visible physical panels, and stops under every close, hidden-page, camera-change, and unmount route.
- A write updates only the affected control plus values explicitly returned as coupled by the API. It does not refetch every descriptor unless `modify_layout` is reported.
- Descriptor lists use stable keys and memoized categorization. The panel remains usable with at least 100 descriptors without changing the live media render cadence.

## Error And State Behavior

- Initial loading: each physical panel reserves its final content width, shows a labeled busy state, and does not obscure the launchers or move the video.
- Empty state: a successfully connected camera with zero exposed controls shows `No camera controls reported`; Levels remains available in Light.
- Permission state: unauthorized users do not receive physical launchers or trigger requests. A 403 after permission changes closes physical editors and shows a translated access error through the established notification surface.
- Inactive/read-only/grabbed/disabled: keep the control row and value visible, disable editing, and show the descriptor-derived reason without relying on color alone.
- Write pending: disable only the affected editor, retain its last confirmed value, and expose busy state to assistive technology.
- Write failure: restore the last confirmed value, keep the panel open, show an adjacent stable error, and provide Retry where safe.
- Disconnected: invalidate descriptors and values, stop polling, keep a stable disconnected panel with Retry, and never reuse a prior camera's response after selection changes.
- Stale result: discard any fetch, poll, or write result whose camera or generation no longer matches the mounted active panel.
- Unsupported type: show name, type, current value metadata when safe, and a non-editable explanation. Never synthesize a numeric editor for payload-bearing or unknown data.

## Test Strategy

- Unit tests:
  - Descriptor categorization, stable order, fallback placement, effective writable state, numeric validation, and editor selection for every supported and unsupported type.
- Service/DB tests:
  - Mock Service Worker or equivalent deterministic API fixtures for descriptor read, volatile values, writes, clamped/coupled read-back, 403, disconnect, and `modify_layout`; database fixtures are not applicable.
- GUI/controller tests, if applicable:
  - Component tests cover keyboard activation, labels, focus return, mutually exclusive overlays, stable row layout, inactive/read-only explanations, busy state, and narrow viewport scrolling.
  - Hook tests use fake timers and abortable promises to prove the 1 Hz cap, polling shutdown, generation rejection, per-control pending behavior, and descriptor refresh trigger.
- Integrated route tests:
  - Playwright enters `/#front_door`, opens both panels from visible camera controls, verifies categorized descriptor fixtures and writes, verifies Levels persistence and no physical write, checks Escape/focus restoration, and repeats containment checks in desktop and mobile projects.
- Production-data rule:
  - Tests use deterministic mock cameras and descriptors and do not require the user's deployed C930e or production data.

## Acceptance Criteria

- A selected single-camera Live view displays exactly two accessible launchers named Light and Lens/Geometry for an authorized administrator, with only one overlay open at a time.
- Light contains the unchanged display-only Levels control and histogram plus physical brightness, contrast, saturation, gain, exposure, white balance, backlight compensation, and power-line controls when, and only when, the descriptor response reports them.
- Lens/Geometry contains physical sharpness, focus, zoom, pan, tilt, and related controls when reported, while unknown controls remain inspectable in a non-misleading fallback section.
- Supported descriptor types produce the specified editor without a model-specific control list; unsupported or payload-bearing types remain non-editable.
- Inactive, read-only, grabbed, disabled, loading, empty, write-pending, write-error, disconnected, and driver-adjusted states are visible, accessible, and do not move neighboring rows.
- Successful writes reconcile to the API read-back value, failed or stale requests cannot overwrite a newer camera/value, and display-only Levels never issue a camera-control request.
- Volatile refresh never exceeds 1 Hz and stops when no physical panel is visible, the page is hidden, the camera changes, or the palette unmounts.
- Keyboard-only and screen-reader users can open, operate, close, and return focus from both overlays; pointer and touch users have at least 44 by 44 CSS pixel targets.
- At 320 CSS pixels wide and across portrait/landscape changes, overlays remain within the viewport, scroll internally, expose all controls, and do not shift the video layout.
- The real Live route E2E tests prove both launchers, both overlays, descriptor-driven rendering, a reconciled physical write, Levels-only behavior, state handling, and desktop/mobile containment.

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

- Template source: `../.agents/process/templates/implementation-spec-template.md` (`sha256:0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`)
- Prior recorded score: none; adversarial input, not trusted.
- Adversarial rescore basis: independently recounted every category from the current spec text, including the reusable renderer, two asynchronous state routes, physical writes, permission-sensitive presentation, bounded polling, all panel surfaces, editor families, Levels reuse, and real Live-route verification.
- Functions/methods: 3 x 2 = 6
- Data structures/models: 3 x 1 = 3
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 3 x 1 = 3
- UI surfaces/components: 4 x 2 = 8
- UI fields/elements: 6 x 1 = 6
- Existing reusable code reused as-is: 4 x 0.5 = 2
- Adding code to an existing library/module: 3 x 1 = 3
- Creating a new reusable library/module: 1 x 3 = 3
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 1 x 3 = 3
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 47
- If total matches prior score, adversarial survival reason: not applicable because no prior score exists.
