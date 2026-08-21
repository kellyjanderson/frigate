# Camera-Control Descriptor Contracts Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/specs/camera-controls/descriptor-control-renderer.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/descriptor-control-renderer-review-pass-1.md`
Split provenance: `project/specs/camera-controls/descriptor-control-renderer.spec.md`, child 1 from independent review pass `descriptor-control-renderer-pass-1`
Canonical status: Split child
Review Score: 24
Prerequisites:
- `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` - owns the final shared descriptor wire contract that these frontend contracts consume without redefining the API schema.
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines driver authority, descriptor metadata, supported editor mappings, effective states, and fail-closed handling.

## Source Field Carryover

- Source purpose:
  - Give every camera-control UI consumer one typed, deterministic interpretation of the authenticated read API descriptor contract without coupling type policy to a concrete editor or row.
- Source responsibilities by category:
  - Functions/methods: normalize one API descriptor, discriminate its supported editor kind, and validate or normalize one candidate commit value.
  - Data structures/models: define the frontend camera-control value, menu item, descriptor, and caller-supplied control-state contracts.
  - Dependencies/services: consume the final shared nested descriptor schema from `authenticated-camera-control-read-api.spec.md`; no HTTP client or runtime service is owned here.
  - Returns/outputs/signals: return a typed normalization result, an editor-kind result, a validation result, and a synchronous typed commit-intent callback contract.
  - UI surfaces/components: not applicable; this child exposes library contracts only.
  - UI fields/elements: not applicable; visible controls and presentations belong to renderer siblings.
  - Reusable code plan: create one shared frontend type module and one pure descriptor-policy utility module.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: not applicable; every operation is synchronous and side-effect free.
  - Destructive/write behavior: not applicable; the callback contract reports intent and performs no request or device write.
  - Security/privacy-sensitive behavior: reject unsafe or unrepresentable payload shapes, never normalize raw payload bytes into an editable value, and fail closed for unknown or unsupported types.
  - Performance-sensitive behavior: not applicable; each helper processes one descriptor and its descriptor-local menu collection.
  - Cross-screen reusable behavior: not applicable; the named consumers are the two sibling renderer leaves within one camera-control surface.
- Source open questions / nuance discovered:
  - The API field names and scalar encodings remain authoritative. The frontend adapter must be checked against the generated schema from the final read/shared API implementation rather than silently renaming or widening fields.
  - Backend `active`, `writable`, and `read_supported` values remain authoritative, but contradictory flags can only reduce frontend capability. A contradiction never enables an editor.
  - Button commit value is `null`; editable scalar values are boolean, safe integer, or string. Unsupported compound, array, byte, and unknown values remain non-editable diagnostic data.
- Source split/provenance notes:
  - The reviewed parent scored 36 and was split into descriptor contracts, accessible value editors, and setting-row state/unsupported presentation. The exact split plan assigns all normalization, discrimination, validation, callback/result, and helper-test responsibility to this child.

## Purpose

Provide the stable frontend contract that converts authenticated camera-control descriptors into safe typed values, effective capability state, editor selection, and validated commit intent. This child is independent of concrete React controls, row layout, API execution, polling, mutation reconciliation, and camera-view composition.

## Scope

Owns:

- `CameraControlValue`, `CameraControlMenuItem`, `CameraControlDescriptor`, and `DescriptorControlState` frontend contracts aligned to the final read/shared API schema.
- Explicit API-wire-to-frontend field and value mapping, including effective active, writable, read-supported, and supported-editor decisions.
- Pure descriptor normalization, supported editor-kind discrimination, candidate value validation, validation result, and typed commit callback contracts.
- Fail-closed handling for malformed, payload-bearing, compound, array, integer64, and unknown control types, plus deterministic contract tests.

Does not own:

- Boolean, numeric, menu, button, string, or bitmask editor components; draft lifecycle; keyboard/pointer behavior; or touch-target presentation.
- Row layout, labels, metadata display, translations, reserved feedback regions, pending/success/error presentation, or unsupported diagnostic markup.
- HTTP fetching, OpenAPI generation, polling, retry, mutation, cancellation, stale-result rejection, write read-back reconciliation, permissions, or camera-view composition.
- Backend descriptor discovery, provider validation, physical-device access, or API schema ownership.

## Split Coverage

- Parent spec: `project/specs/camera-controls/descriptor-control-renderer.spec.md`
- Parent coverage status: 100% covered by the three-child split plan in `project/specs/camera-controls/review-ledger/descriptor-control-renderer-review-pass-1.md`.
- Parent responsibilities owned by this child:
  - Typed descriptor/state/value contracts, wire normalization, editor-kind selection, candidate validation and normalization, fail-closed type policy, typed commit/result contracts, and pure helper tests.
- Parent responsibilities still missing from children:
  - none in the recorded three-child plan. Aggregate coverage of `project/specs/camera-controls/descriptor-driven-camera-controls-ui.spec.md` remains outside this child's authority.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/descriptor-control-renderer-review-pass-1.md` | 1 | `project/specs/camera-controls/descriptor-control-renderer.spec.md` and paired test spec | this child, `descriptor-value-editors.spec.md`, and `descriptor-setting-row.spec.md` definitions | continue |

## Implementation Routing

- Primary modules/files:
  - `web/src/types/cameraControls.ts` - public value, menu-item, descriptor, state, result, and callback type contracts.
  - `web/src/utils/cameraControlDescriptors.ts` - pure normalization, editor-kind discrimination, and candidate-value validation.
- Supporting modules/files:
  - none; API calls and translations are excluded.
- GUI/QML files, if applicable:
  - not applicable; this is a TypeScript library-only boundary.
- Reusable library/module files:
  - `web/src/types/cameraControls.ts` - single frontend camera-control contract authority shared by the two renderer siblings.
  - `web/src/utils/cameraControlDescriptors.ts` - single pure descriptor policy used by the editable-editor and setting-row siblings.
- Tests:
  - `web/src/utils/cameraControlDescriptors.test.ts` - API fixture normalization, type discrimination, effective-state, validation, callback typing, and fail-closed contract coverage.

## Chosen Defaults / Parameters

- The final nested descriptor schema emitted by `CameraControlsResponse` is authoritative. Frontend normalization accepts its exact snake-case fields: `id`, `serialized_id`, `name`, `control_class`, `control_type`, numeric bounds/default/current fields where applicable, `menu_items`, the complete reported flag representation, `element_size`, `element_count`, `dimensions`, `active`, `writable`, and `read_supported`.
- A canonical serialized ID must match lower-case `0x` plus eight hexadecimal digits. Numeric IDs, control classes, control types, menu indexes/values, dimensions, and applicable scalar bounds must be finite safe integers in the browser contract.
- Supported editable kinds are boolean, integer, menu, integer-menu, button, string, labeled bitmask, and numeric bitmask. Integer64, compound, array, payload-bearing, byte-array, unrecognized type, malformed descriptor, and any value not losslessly representable as a browser scalar resolve to `unsupported`.
- Frontend effective state is capability-reducing: `active` requires the backend active value and no disabled or inactive flag; `writable` requires backend writable, effective active, no read-only or grabbed flag, and a supported editable kind. `read_supported` is copied from the backend and never inferred true.
- Normalization returns a discriminated success or failure result. Failure retains only safe identity and diagnostic metadata needed by the row sibling and never includes raw byte or compound payload content.
- Integer candidates must be finite safe integers inside inclusive bounds and aligned to positive step relative to minimum. A missing or non-positive step is normalized to 1 only for a supported ordinary integer descriptor.
- Ordinary menu commits use the sparse menu item's `index`; integer-menu commits use its non-null `value`. A candidate absent from the applicable sparse item set is invalid.
- Button commit value is exactly `null`. Boolean values accept booleans only. Strings accept strings only and enforce the descriptor's finite minimum/maximum length constraints without coercing another primitive.
- Bitmask input accepts a safe nonnegative integer or a full-string decimal/`0x` hexadecimal representation that normalizes to one. Validation never clears unknown set bits. A labeled-bit editor consumer must merge a changed known bit into the last confirmed full integer and submit that whole value.
- The commit callback is synchronous intent only: `(controlId, value) => void`. It returns no request promise, success state, error state, timer, or cancellation handle.

## Data Ownership

- Source of truth: the final authenticated read/shared API descriptor payload and the live driver state it represents.
- Read ownership: renderer siblings import the public frontend contracts and call the pure descriptor utilities with one descriptor or candidate.
- Write ownership: none. The typed callback transfers validated intent to a separately owned mutation boundary; only backend/provider specifications own physical writes.
- Derived/cache data: normalized scalar value, effective capability state, editor kind, and validation outcome are recomputed from one supplied descriptor. This child owns no cache or persistence.
- Privacy/logging constraints: helpers log nothing and never return raw payload bytes, device paths, ioctl structures, or raw server exceptions. Safe descriptor identity/type metadata may remain available for an inspectable unsupported result.

## Dependencies And Routes

- Domain/service dependencies:
  - `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` supplies the final `CameraControlsResponse` nested descriptor wire schema.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable. The editable-editor sibling calls the utilities and emits the typed callback; the setting-row sibling consumes descriptor/state contracts for presentation.
- Background/concurrency route, if applicable:
  - not applicable. No helper starts I/O, timers, tasks, subscriptions, or stateful work.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already defines descriptor metadata, editor mappings, driver authority, effective states, and fail-closed unknown-type behavior.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - verifies the deployed Linux V4L2 route and hardware control enumeration.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` - its independently accepted and implemented generated wire schema must precede final frontend schema binding.
- Progression handling:
  - prerequisite implementation must run first. This candidate remains proposed and requires independent specification review.

## Application Integration

- App type: library-only.
- User/caller surface: `DescriptorValueEditor` and `DescriptorSettingControl` sibling components.
- Invocation route: a consumer normalizes one descriptor payload, obtains its editor kind/effective state, validates a candidate, and invokes the typed commit callback only for a successful validation result.
- Wiring owner/module: `web/src/utils/cameraControlDescriptors.ts`, with public contracts in `web/src/types/cameraControls.ts`.
- Observable result: one safe normalized descriptor or unsupported result, one deterministic editor kind, one typed validation result, and one exact callback payload contract.
- Integration validation: `cameraControlDescriptors.test.ts` passes fixtures shaped exactly like the read/shared API's generated nested schema through the exported public functions, then a type-checked consumer harness accepts the successful value and records the callback tuple.
- Incomplete status risk: designed. Private parsing tests, duplicated sibling types, or a helper that accepts malformed/unsupported input as editable do not satisfy the library route.

App-type-specific proof:

- Library-only: tests invoke the exported functions and public type contracts used by the named renderer siblings. They verify the API-shaped input through callback-shaped output route without a component, network request, camera, or private helper shortcut.

## Reuse And Extraction Plan

- Existing code to reuse:
  - none; the generated OpenAPI descriptor schema is a prerequisite contract authority and test-fixture source, not reusable implementation code owned by this child.
- Current reuse readiness:
  - create one shared frontend type module and one pure utility module after the API schema prerequisite is implemented.
- Extraction/wrapping needed:
  - none; no existing editor or camera-view logic moves into this child.
- Additions to existing library/modules:
  - none.
- New reusable modules to expose:
  - `web/src/types/cameraControls.ts` - public descriptor/value/state/result/callback contracts.
  - `web/src/utils/cameraControlDescriptors.ts` - public pure normalization, discrimination, and validation functions.
- One-off code justification, if any:
  - none.

## Required DTOs / Functions / Components

- DTOs/models:
  - `CameraControlValue` - frontend scalar union `boolean | number | string | null`; numbers are finite safe integers, and `null` is the button action or unavailable scalar value, never an implicit editable fallback.
  - `CameraControlMenuItem` - exact normalized menu item with safe integer `index`, integer-menu `value: number | null`, and driver label as inert display data.
  - `CameraControlDescriptor` - API-aligned normalized descriptor carrying exact identity/type/metadata fields, scalar value union where representable, menu items, complete flags, element metadata, backend effective fields, and capability-reducing frontend active/writable/supported state.
  - `DescriptorControlState` - caller-supplied confirmed value plus `idle | pending | success | error`, optional caller-safe error code/message, and optional success indication. It contains no request, timer, or mutation method.
- Functions/methods:
  - `normalizeCameraControlDescriptor(input: unknown) -> DescriptorNormalizationResult` - validate the exact shared wire shape, preserve safe metadata, derive capability-reducing effective state, and return a normalized descriptor or fail-closed unsupported result.
  - `getDescriptorEditorKind(descriptor: CameraControlDescriptor) -> DescriptorEditorKind` - return the supported editor-kind union or `unsupported` based on exact type, payload/element shape, scalar representation, flags, and effective state without granting capability omitted by the backend.
  - `validateDescriptorValue(descriptor: CameraControlDescriptor, candidate: unknown) -> DescriptorValidationResult` - return `{ok: true, value}` only for the type-correct normalized scalar, otherwise `{ok: false, code}` with a stable local validation code and no commit value.
  - `DescriptorCommitCallback` - synchronous `(controlId: string, value: CameraControlValue) => void`; consumers call it only with a successful validation result and the descriptor's canonical serialized ID.
- UI fields / visible data, if applicable:
  - not applicable; safe diagnostic metadata is a data contract, while its visible presentation belongs to the setting-row sibling.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Not performance-sensitive. Each pure operation processes one descriptor and, where applicable, one descriptor-local menu list or dimensions list. It performs no collection-wide sort, polling, network access, subscription, or timer work.

## Error And State Behavior

- A malformed required field, noncanonical ID, unsafe integer, invalid menu item, contradictory value/type pair, raw payload value, or unsupported element shape returns a fail-closed normalization result and no editable kind.
- A known descriptor with disabled, inactive, read-only, grabbed, backend-nonwritable, or contradictory effective state remains typed and inspectable but cannot become frontend-writable.
- Unknown control types, integer64, compound/array types, and payload-bearing types always produce `unsupported`; they never fall back to string or numeric input.
- Validation performs no coercion except full-string decimal/hex bitmask parsing. It returns stable codes for type, finite-integer, safe-integer, range, step, menu-membership, string-length, bitmask, effective-state, and unsupported-type failures.
- `DescriptorControlState` treats caller-confirmed values as authoritative. This child does not advance pending/success/error state or substitute a local draft for confirmed driver state.

## Test Strategy

- Unit tests:
  - Normalize exact API-shaped fixtures for boolean, integer, menu, integer-menu, button, string, labeled/unlabeled bitmask, disabled/inactive/read-only/grabbed, unknown, integer64, payload, compound, and array descriptors.
  - Exercise every required field, scalar variant, safe-integer boundary, canonical ID rule, sparse menu form, flag/effective-state contradiction, unsupported result, and privacy omission.
  - Exercise inclusive numeric bounds, step relative to minimum, missing/non-positive integer step normalization, ordinary versus integer-menu membership, string constraints, decimal/hex bitmasks, unknown-bit preservation, button null, and every stable validation failure code.
- Service/DB tests:
  - not applicable.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Use a compile-time and runtime consumer harness that passes an exact API fixture through the three exported functions and records one `DescriptorCommitCallback` tuple only after successful validation. Assert unsupported and invalid fixtures cannot supply a commit value.
- Production-data rule:
  - Tests use deterministic synthetic descriptors derived from the generated API schema and require no camera, API server, production configuration, database, recording, or device path.

## Acceptance Criteria

- Frontend descriptor, menu-item, scalar-value, and control-state contracts map every final read/shared API descriptor field without renaming, widening, or duplicating API authority.
- Every supported scalar descriptor normalizes to the correct editor kind and typed value, while integer64, malformed, payload-bearing, compound, array, and unknown types fail closed with no editable fallback.
- Frontend active/writable/read-supported state never grants a capability denied by backend effective fields or reported flags.
- Validation returns a commit value only for exact type, safe-integer, bound, step, sparse-menu, string, button-null, and bitmask rules; it never drops unknown bitmask bits.
- The callback contract carries exactly the canonical serialized control ID and validated scalar value and owns no request lifecycle or physical mutation.
- Deterministic tests prove the exported library route against generated-schema-shaped fixtures without components, API requests, hardware, or production data.

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
- Adversarial rescore basis: recounted this contract-only child. The three pure operations, four persistent model families, API dependency, four public outputs, two new reusable modules, and fail-closed privacy boundary remain counted. Editor components, UI fields, translations, row presentation, async state, requests, polling, physical writes, and performance-sensitive collection work are excluded. The 24-point result receives explicit split review because it is in the policy's 16 through 24 band; it remains one cohesive leaf because all outputs enforce one API-descriptor-to-validated-commit type boundary, share the same two modules and fixtures, and have no independently reachable UI or service route.
- Functions/methods: 3 x 2 = 6
- Data structures/models: 4 x 1 = 4
- Dependencies/services: 1 x 1 = 1
- Returns/outputs/signals: 4 x 1 = 4
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 0 x 0.5 = 0
- Adding code to an existing library/module: 0 x 1 = 0
- Creating a new reusable library/module: 2 x 3 = 6
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 0 x 3 = 0
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 0 x 2 = 0
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 24
- If total matches prior score, adversarial survival reason: not applicable; this child score is lower than the independently reviewed parent score.
