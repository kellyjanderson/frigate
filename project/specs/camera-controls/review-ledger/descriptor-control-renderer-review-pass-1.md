# Descriptor Control Renderer Independent Review Pass

Date: 2026-08-19
Pass identifier: `descriptor-control-renderer-pass-1`
Result: `split_required`
Candidate: `project/specs/camera-controls/descriptor-control-renderer.spec.md`

## Artifacts Reread

- Candidate: `project/specs/camera-controls/descriptor-control-renderer.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/descriptor-control-renderer.test-spec.md`
- Candidate record: `project/specs/camera-controls/review-ledger/descriptor-control-renderer-candidate.md`
- Direct parent: `project/specs/camera-controls/descriptor-driven-camera-controls-ui.spec.md`
- Direct API prerequisite child, read for shared-contract ownership: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- API prerequisite split record, read for shared-contract ownership: `project/specs/camera-controls/review-ledger/authenticated-camera-control-api-review-pass-1.md`
- Architecture anchor: `project/architecture/acd/usb-v4l2-camera-controls.md`
- Architecture anchor: `project/architecture/current-camera-runtime.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`

No active renderer sibling candidate paths were supplied in the work order or named by a durable parent split record. The API artifacts were read only to verify the renderer's prerequisite and shared wire-contract ownership.

## Pinned Scoring Authorities

- Template path: `../.agents/process/templates/implementation-spec-template.md`
- Supplied template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Verified template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Scoring-policy path: `../.agents/process/specification-review-scoring-policy.md`
- Supplied scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Verified scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority status: exact match; scoring is valid.

## Independent Review Score

The candidate's recorded 23 was treated as an untrusted claim. The fresh recount does not collapse four separately specified visible-data roles into the seven editor controls, does not treat the absent `cameraControls.ts` file as an addition to an existing module, and counts the explicit safe-data and bounded-render behavior in their rubric categories.

- Functions/methods: 2 x 2 = 4
  - `getDescriptorEditorKind`
  - `validateDescriptorValue`
- Data structures/models: 2 x 1 = 2
  - `CameraControlDescriptor`
  - `DescriptorControlState`
- Dependencies/services: 2 x 1 = 2
  - approved camera-control API descriptor/value contract
  - React plus the existing Frigate UI and translation stack
- Returns/outputs/signals: 2 x 1 = 2
  - stable rendered control row or inspectable unsupported presentation
  - typed `onCommit(controlId, value)` intent
- UI surfaces/components: 1 x 2 = 2
  - `DescriptorSettingControl`
- UI fields/elements: 11 x 1 = 11
  - label/current value
  - range/step/default metadata
  - effective-state reason
  - reserved feedback region
  - boolean switch
  - integer slider and exact-input editor
  - menu/integer-menu select
  - action button
  - string input
  - labeled or numeric bitmask editor
  - unsupported metadata presentation
- Existing reusable code reused as-is: 2 x 0.5 = 1
  - existing Frigate form, status, and tooltip primitives
  - `react-i18next` with `views/live`
- Adding code to an existing library/module: 1 x 1 = 1
  - `web/public/locales/en/views/live.json`
- Creating a new reusable library/module: 2 x 3 = 6
  - `web/src/types/cameraControls.ts`, which does not currently exist and supplies sibling-consumable contracts
  - `web/src/components/camera-controls/DescriptorSettingControl.tsx`
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 0 x 3 = 0
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
  - display only safe descriptor/error fields and omit device paths and raw payload bytes
- Performance-sensitive behavior: 1 x 2 = 2
  - descriptor-local bounded rendering/validation with no polling, network access, timers, or global subscription
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **36**

Because 36 is at or above the policy's forced-split threshold of 25, the candidate cannot remain one final implementation leaf. The author’s cohesion argument correctly identifies one public row contract, but it does not override the mandatory threshold or require the contract, editable controls, and row-state presentation to share one implementation leaf.

## Exact Split Plan

### Proposed child 1: Camera-Control Descriptor Contracts And Value Policy

- Proposed path: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
- Responsibility:
  - Own `web/src/types/cameraControls.ts` and a pure camera-control descriptor utility module.
  - Own `CameraControlDescriptor`, `DescriptorControlState`, `DescriptorEditorKind`, the validation-result contract, and the typed commit-value union aligned to the approved read/shared API wire contract.
  - Own `getDescriptorEditorKind`, including fail-closed handling for payload-bearing, compound, array, and unknown descriptors.
  - Own `validateDescriptorValue`, including finite integer parsing, inclusive bounds, step relative to minimum, sparse menu membership, string constraints, decimal/hexadecimal bitmask parsing, and unknown-set-bit preservation policy.
  - Own deterministic unit tests for every descriptor type, flag combination, boundary, malformed candidate, and unsupported selection result.
- Parent coverage:
  - Covers the candidate's typed descriptor/state contract, editor-kind selection, validation/normalization rules, fail-closed type decision, and helper-level tests.

### Proposed child 2: Accessible Descriptor Value Editors

- Proposed path: `project/specs/camera-controls/descriptor-value-editors.spec.md`
- Responsibility:
  - Own a reusable `DescriptorValueEditor` component that consumes child 1's contracts and exposes typed commit intent plus local validation state to its row consumer.
  - Own boolean, integer slider/exact input, menu/integer-menu, button, string, labeled-bitmask, and numeric-bitmask editors.
  - Own one-draft synchronization, deliberate-change rules, Enter/blur de-duplication, slider keyboard behavior, button single activation, preservation of unknown bitmask bits, disabled/pending editor semantics, visible focus, and 44 by 44 CSS pixel directly activatable targets.
  - Own editor-level component tests for keyboard, pointer, touch-target hooks, input boundaries, callback count/payload, draft reset, and zero callback for invalid or disabled interaction.
- Parent coverage:
  - Covers every editable control family, draft and commit behavior, accessible input operation, and editor-specific component verification.

### Proposed child 3: Descriptor Setting Row State And Unsupported Presentation

- Proposed path: `project/specs/camera-controls/descriptor-setting-row.spec.md`
- Responsibility:
  - Own `DescriptorSettingControl.tsx` as the stable public row that composes child 2 through child 1's contracts.
  - Own label/current-value association, range/step/default metadata, effective disabled reason, reserved feedback region, fixed outer geometry, busy and live-region semantics, caller-supplied pending/success/error state, driver-adjusted confirmed-value presentation, and caller-prop synchronization.
  - Own inspectable non-editable presentation for unsupported, compound, array, payload-bearing, and unknown types, including omission of raw payload bytes, device paths, and write affordances.
  - Own generic translated row/status/validation copy in `web/public/locales/en/views/live.json` and the component-level consumer harness.
  - Own row-level tests for stable structure, label/description association, effective states, feedback transitions, adjusted read-back, safe unsupported metadata, privacy omissions, and public prop-boundary integration without API requests.
- Parent coverage:
  - Covers the public reusable row boundary, stable effective-state and feedback presentation, unsupported diagnostic rendering, safe-data behavior, translation ownership, and integrated component-harness proof.

## Split Coverage And Dependencies

- Proposed candidate coverage status: **100% covered** by the three proposed children.
- Candidate responsibilities still uncovered: none.
- Inter-child dependencies:
  - Child 2 depends on child 1's descriptor, editor-kind, validation-result, and typed commit contracts and must not redefine them.
  - Child 3 depends on child 1's descriptor/state contracts and composes child 2 as the sole editable-editor boundary.
- Shared authoritative wire contract: the independently reviewed read/shared API child at `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`; the renderer children must consume its eventual approved descriptor shape rather than the split API parent.
- Shared authoritative architecture: `project/architecture/acd/usb-v4l2-camera-controls.md`.
- Paired verification ownership:
  - Split `project/specs/camera-controls/tests/descriptor-control-renderer.test-spec.md` into one paired test specification per proposed child.
  - Child 1 owns pure selection/validation fixtures and assertions.
  - Child 2 owns editable-control interaction, draft, accessibility, target-size hook, and typed callback assertions.
  - Child 3 owns public-row state transitions, stable geometry, unsupported/safe metadata, translations, and the API-free consumer-harness proof.
- Original UI-parent coverage status: **incomplete/ambiguous**. The candidate's assigned renderer boundary is fully allocated by this plan, but `descriptor-driven-camera-controls-ui.spec.md` has no durable independent split record naming all active children, and no camera-view composition or request-orchestration sibling candidate paths were supplied or found for aggregate 100% coverage.

## Findings And Gates

- Primary finding: the author undercounts four separately listed visible-data roles in addition to seven editor/presentation controls.
- Secondary finding: `web/src/types/cameraControls.ts` is absent and is a new sibling-consumable module, while the existing locale file is the actual existing-module addition.
- Additional scoring finding: safe omission of device paths/raw payload bytes and explicitly bounded descriptor-local rendering are present responsibilities and count under privacy and performance.
- Cohesion finding: the public row remains cohesive at runtime through explicit contracts and composition, while descriptor policy, editable input mechanics, and row-state/unsupported presentation are independently implementable and reviewable ownership boundaries.
- Parent coverage gate: the three-child plan covers 100% of this candidate; aggregate coverage of the original UI parent remains incomplete/ambiguous because its other split children and durable split ledger are absent.
- Prerequisite gate: the candidate points to `authenticated-camera-control-api.spec.md`, but that parent has already received `split_required`; the shared wire-contract owner is now `authenticated-camera-control-read-api.spec.md`, whose write sibling is named by the API split plan but is not yet present on disk. The proposed children must link the final approved shared-contract leaf.
- Architecture gate: sufficient for this split. The ACD defines descriptor-driven editor mappings, effective-state behavior, fail-closed unknown types, driver authority, and safe API/UI boundaries.
- Evidence gate: no factual evidence gap blocks specification splitting or deterministic component verification.
- Readiness gate: the unsplit candidate fails the mandatory sizing rule; aggregate parent lineage and the prerequisite link also require normalization before any final child can be approved.
- Dependency gate: live consumption remains gated on independent approval and implementation of the API shared-contract leaf and separately owned UI state/composition work.
- New leaves: the three proposed definitions above; no child files were created in this pass.
