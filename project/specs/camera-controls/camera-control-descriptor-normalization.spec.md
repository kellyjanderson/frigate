# Camera-Control Descriptor Wire Normalization And Effective State Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/camera-control-descriptor-contracts-review-pass-1.md`
Split provenance: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`, child 1 from independent review pass `camera-control-descriptor-contracts-pass-1`
Canonical status: Split child
Review Score: 18
Prerequisites:
- `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` - owns the final shared descriptor wire contract; its independently accepted and implemented generated schema must exist before final frontend schema binding.
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines descriptor metadata, driver authority, effective capability behavior, and fail-closed unknown-type handling.

## Source Field Carryover

- Source purpose:
  - Give all camera-control UI consumers one authoritative, safe frontend descriptor and effective-state contract derived from the authenticated read API wire schema.
- Source responsibilities by category:
  - Functions/methods: normalize one unknown API value into one descriptor normalization result.
  - Data structures/models: define the frontend scalar value, menu item, normalized descriptor, effective control state, and normalization-result contracts.
  - Dependencies/services: consume the implemented generated nested descriptor schema from `authenticated-camera-control-read-api.spec.md`; no HTTP client or runtime service is owned here.
  - Returns/outputs/signals: return one discriminated normalized-descriptor or privacy-safe unsupported result.
  - UI surfaces/components: not applicable; this is a library-only contract.
  - UI fields/elements: not applicable; visible presentation belongs to renderer siblings.
  - Reusable code plan: create the shared frontend camera-control type authority and the pure descriptor-normalization utility boundary consumed by the value-policy sibling.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: not applicable; normalization is synchronous and side-effect free.
  - Destructive/write behavior: not applicable; this child performs no request or camera mutation.
  - Security/privacy-sensitive behavior: fail closed for malformed or unsafe payloads and omit raw payload bytes, device paths, ioctl structures, and raw server exceptions.
  - Performance-sensitive behavior: not applicable; normalization processes one descriptor and its descriptor-local menu and dimensions collections.
  - Cross-screen reusable behavior: not applicable; named consumers are siblings in the camera-control surface.
- Source open questions / nuance discovered:
  - The final implemented generated schema is the field-name and scalar-encoding authority. This adapter does not rename, widen, or independently version that API contract.
  - Backend `active`, `writable`, and `read_supported` values are authoritative. Reported flags and unsupported structure may only reduce frontend capability, never grant it.
  - This child discriminates structurally supported from unsupported descriptors. Editor-kind selection and candidate-value policy belong to `camera-control-value-policy.spec.md`.
- Source split/provenance notes:
  - Independent pass `camera-control-descriptor-contracts-pass-1` rescored the parent at 28 and allocated 100% of its responsibilities between this normalization/effective-state child and a value-policy child definition.
  - This candidate covers 100% of its assigned normalization/effective-state responsibility. Together with the existing independently approved `project/specs/camera-controls/camera-control-value-policy.spec.md` sibling, active child artifacts cover 100% of the direct parent's responsibilities.
  - The earlier renderer split record remains authoritative for accessible editor and setting-row sibling ownership. The prior original UI-parent aggregate coverage finding is outside this assigned child's responsibility.

## Purpose

Convert one authenticated camera-control descriptor wire value into a safe, typed frontend descriptor with capability-reducing effective state. Expose the shared type and utility boundary without owning editor selection, candidate validation, commit intent, UI composition, or API orchestration.

## Scope

Owns:

- `CameraControlValue`, `CameraControlMenuItem`, `CameraControlDescriptor`, `DescriptorControlState`, and `DescriptorNormalizationResult` in the shared frontend type module.
- Exact API-wire normalization for identity, scalar values, menu entries, flags, element metadata, dimensions, and backend capability fields.
- Structural supported/unsupported discrimination, canonical-ID and safe-integer checks, effective active/writable/read-supported derivation, and privacy-safe fail-closed results.
- Normalization and effective-state fixtures and tests for supported, unsupported, malformed, contradictory, and privacy-sensitive inputs.

Does not own:

- `DescriptorEditorKind`, editor-kind selection, candidate-value validation, validation results or codes, commit callbacks or callback results, unknown-bit merge policy, or local draft policy.
- Concrete editor widgets, row composition, labels, translations, feedback presentation, API requests, polling, mutations, stale-result handling, or camera-view composition.
- Backend descriptor discovery, provider validation, physical-device access, shared API schema ownership, or OpenAPI generation.

## Split Coverage

- Parent spec: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
- Parent coverage status: 100% covered across this child and the existing independently approved `project/specs/camera-controls/camera-control-value-policy.spec.md` sibling under the two-child allocation in `camera-control-descriptor-contracts-pass-1`.
- Parent responsibilities owned by this child:
  - Public wire/frontend descriptor contracts, one-descriptor normalization, supported/unsupported structural discrimination, effective capability state, safe unsupported metadata, and normalization-level verification.
- Parent responsibilities still missing from children:
  - none. The approved value-policy sibling owns editor-kind selection, value validation, validation result and stable-code contracts, commit-intent callback contracts, unknown-bit preservation, and their paired verification.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/camera-control-descriptor-normalization-review-pass-3.md` | 3 | `camera-control-descriptor-normalization.spec.md` and paired test spec | none | reached |

## Implementation Routing

- Primary modules/files:
  - `web/src/types/cameraControls.ts` - authoritative public scalar, menu-item, normalized-descriptor, effective-state, and normalization-result contracts.
  - `web/src/utils/cameraControlDescriptors.ts` - pure `normalizeCameraControlDescriptor` implementation and safe parsing internals.
- Supporting modules/files:
  - none; generated API fixtures are test inputs, not implementation owned here.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `web/src/types/cameraControls.ts` - shared contract authority consumed by value-policy and renderer siblings.
  - `web/src/utils/cameraControlDescriptors.ts` - shared pure utility boundary to which the value-policy sibling adds its separately owned exports.
- Tests:
  - `web/src/utils/cameraControlDescriptors.test.ts` - exact wire normalization, effective-state, malformed/unsupported handling, safe metadata, and privacy omission coverage owned by this child.

## Chosen Defaults / Parameters

- The implemented generated nested descriptor schema emitted by `CameraControlsResponse` is authoritative. Normalization accepts its exact snake-case fields: `id`, `serialized_id`, `name`, `control_class`, `control_type`, applicable numeric bounds/default/current fields, `menu_items`, the complete reported flag representation, `element_size`, `element_count`, `dimensions`, `active`, `writable`, and `read_supported`.
- A canonical serialized ID matches lower-case `0x` followed by exactly eight hexadecimal digits. Numeric IDs, class/type encodings, scalar numbers, menu indexes and values, element metadata, and dimensions must be finite safe integers when represented as browser numbers.
- Structurally supported scalar families are boolean, integer, menu, integer-menu, button, string, and bitmask. Integer64, compound, array, byte-array, payload-bearing, unknown-type, malformed, and non-losslessly representable descriptors normalize to an unsupported result.
- The normalized descriptor preserves the authoritative snake-case wire field names. `DescriptorControlState.active` requires backend `active=true` and neither disabled nor inactive flags. `writable` requires backend `writable=true`, effective active, no read-only or grabbed flag, and a structurally supported descriptor. `readSupported` is the derived-state view of backend `read_supported`, copies it exactly, and is never inferred true.
- Effective state retains explicit `disabled`, `inactive`, `readOnly`, and `grabbed` booleans so consumers can present the authoritative reason without reinterpreting raw flags. Contradictions only reduce capability.
- A successful result contains the complete safe normalized descriptor. An unsupported result retains only validated safe identity, name, type/class metadata, effective state where derivable, and a stable normalization reason. It never carries raw byte, compound, array, device-path, ioctl, or raw exception content.
- Sparse menu indexes are preserved in source order. Menu labels are inert display data. Duplicate indexes, unsafe numeric values, malformed item shapes, or non-string labels make the descriptor unsupported rather than silently dropping entries.
- This child does not assign an editor kind and does not validate a proposed commit value. Those policies consume its successful normalized result through the value-policy sibling.

## Data Ownership

- Source of truth: the final authenticated read API descriptor payload and the live driver state represented by it.
- Read ownership: value-policy and renderer siblings import the public contracts and call `normalizeCameraControlDescriptor` with one API payload.
- Write ownership: none. No type or function here sends a request, advances request state, or mutates the camera.
- Derived/cache data: normalized scalar/menu/metadata fields, structural support, and effective capability state are recomputed from the supplied descriptor. No cache or persistence is owned.
- Privacy/logging constraints: normalization logs nothing and never returns raw payload bytes, device paths, ioctl structures, authentication details, or raw server exceptions. Only validated safe diagnostic metadata may survive an unsupported result.

## Dependencies And Routes

- Domain/service dependencies:
  - `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` supplies the final `CameraControlsResponse` nested descriptor schema.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable. Renderer consumers receive the normalized descriptor and effective state through the exported library boundary.
- Background/concurrency route, if applicable:
  - not applicable. The function starts no I/O, timers, tasks, subscriptions, or mutable work.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already defines descriptor fields, driver authority, effective-state behavior, and fail-closed unknown-type handling.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - verifies the deployed Linux V4L2 route and hardware control enumeration.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` - independent acceptance and implementation of its generated descriptor schema must precede final frontend schema binding.
- Progression handling:
  - prerequisite implementation must run first. This candidate remains proposed and requires independent specification review.

## Application Integration

- App type: library-only.
- User/caller surface: `camera-control-value-policy` and descriptor renderer siblings.
- Invocation route: a consumer passes one raw nested descriptor from `CameraControlsResponse` to `normalizeCameraControlDescriptor` and branches on the discriminated result before using descriptor/state fields.
- Wiring owner/module: `web/src/utils/cameraControlDescriptors.ts`, with shared contracts in `web/src/types/cameraControls.ts`.
- Observable result: one complete safe normalized descriptor with effective state or one privacy-safe unsupported result with no writable capability.
- Integration validation: `cameraControlDescriptors.test.ts` passes exact implemented generated-schema fixtures through the exported public function and a type-checked consumer harness that imports only the public result and descriptor contracts.
- Incomplete status risk: designed. Private-parser-only tests, duplicated consumer types, widened API fields, or any unsupported result that exposes writable capability do not satisfy this route.

App-type-specific proof:

- Library-only: tests invoke the exported function and public contracts through the same input/result seam used by the named value-policy and renderer consumers. No private helper, component, API request, or physical camera substitutes for that proof.

## Reuse And Extraction Plan

- Existing code to reuse:
  - none; the generated descriptor schema is the prerequisite contract and fixture source, not reusable frontend implementation.
- Current reuse readiness:
  - create the shared frontend type module and pure descriptor utility module after the API schema prerequisite is implemented.
- Extraction/wrapping needed:
  - none; no existing editor, row, or camera-view logic moves into this child.
- Additions to existing library/modules:
  - none.
- New reusable modules to expose:
  - `web/src/types/cameraControls.ts` - public descriptor normalization contracts shared with the value-policy and renderer siblings.
  - `web/src/utils/cameraControlDescriptors.ts` - public one-descriptor normalization boundary shared with the value-policy sibling.
- One-off code justification, if any:
  - none.

## Required DTOs / Functions / Components

- DTOs/models:
  - `CameraControlValue` - scalar union `boolean | number | string | null`; numbers are finite safe integers and `null` represents button or unavailable scalar state without implying editability.
  - `CameraControlMenuItem` - normalized item with safe integer `index`, integer-menu `value: number | null`, and inert string `label`.
  - `DescriptorControlState` - explicit backend and effective `active`, `writable`, and `readSupported` values plus normalized `disabled`, `inactive`, `readOnly`, and `grabbed` reasons; it owns no request feedback or mutation state.
  - `CameraControlDescriptor` - exact API-aligned safe identity, type/class, scalar, bounds/default, menu, flags, element, and dimensions fields using the authoritative snake-case wire names, plus structural support and `DescriptorControlState`.
  - `DescriptorNormalizationResult` - discriminated `{ok: true, descriptor}` or `{ok: false, reason, safeMetadata}` result; the failure branch exposes no editable/writable value or unsafe payload content.
- Functions/methods:
  - `normalizeCameraControlDescriptor(input: unknown) -> DescriptorNormalizationResult` - validate the exact wire shape, normalize safe descriptor-local data, classify structural support, derive capability-reducing state, and fail closed when any required invariant is unsafe or unsupported.
- UI fields / visible data, if applicable:
  - not applicable; safe metadata is a data contract and its visible presentation belongs to the setting-row sibling.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Not performance-sensitive. One call processes one descriptor and only its descriptor-local menu and dimensions collections. It performs no camera-wide scan, collection sort, polling, network access, subscription, or timer work.

## Error And State Behavior

- Missing or malformed required fields, noncanonical IDs, unsafe integers, invalid menu entries, contradictory scalar/type pairs, raw payload values, and unsupported element shapes return `{ok: false}` with a stable reason and no writable capability.
- Known descriptors with disabled, inactive, read-only, grabbed, backend-nonwritable, or contradictory capability fields remain inspectable when their safe shape is valid, but effective writable is false.
- Integer64, compound, array, byte-array, payload-bearing, and unknown control types never fall back to string, numeric, or another editable scalar representation.
- Backend `read_supported=false` remains false even if a safe current value happens to be present. Missing or unsafe current data never causes a read capability to be inferred.
- The function is pure and stateless. It owns no loading, retry, pending, success, error-feedback, or stale-result lifecycle.

## Test Strategy

- Unit tests:
  - Normalize exact API-shaped fixtures for boolean, integer, menu, integer-menu, button, string, labeled and unlabeled bitmask, disabled, inactive, read-only, grabbed, unknown, integer64, payload, compound, and array descriptors.
  - Exercise every required field, scalar variant, safe-integer boundary, canonical-ID rule, sparse menu form, flag/capability contradiction, element/dimensions shape, unsupported reason, safe metadata field, and privacy omission.
  - Assert effective active, writable, read-supported, disabled, inactive, read-only, and grabbed values for every relevant backend/flag combination, including contradictions.
- Service/DB tests:
  - not applicable.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - A compile-time and runtime consumer harness imports only public contracts, passes exact implemented generated-schema fixtures through `normalizeCameraControlDescriptor`, and handles both result branches. Assert the value-policy sibling can consume a successful descriptor without redefining the wire type.
- Production-data rule:
  - Tests use deterministic synthetic descriptors derived from the implemented generated API schema and require no camera, API server, production configuration, database, recording, or device path.

## Acceptance Criteria

- Public scalar, menu-item, descriptor, effective-state, and normalization-result contracts map every final read API descriptor field without renaming, widening, or duplicating API authority.
- Every structurally supported descriptor normalizes its safe identity, scalar/menu metadata, flags, element metadata, and backend capability fields exactly; malformed and unsupported families fail closed.
- Effective active, writable, and read-supported state never grants a capability denied by backend fields, reported flags, unsupported structure, or unsafe scalar representation.
- Unsupported results retain only validated safe diagnostic metadata and omit raw payload bytes, device paths, ioctl structures, authentication details, and raw exception content.
- Deterministic public-boundary tests cover exact generated-schema fixtures, all relevant flag contradictions, supported and unsupported families, malformed shapes, and privacy omissions without API requests, hardware, or production data.

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
- [x] Split coverage is complete, or marked not applicable. This candidate and the independently approved value-policy sibling provide 100% active direct-parent coverage with no uncovered responsibility.
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
- Prior recorded score: 120 from independent review pass `camera-control-descriptor-normalization-pass-3`; adversarial input, not trusted for this revision.
- Adversarial rescore basis: recounted this normalization-only child after reconciling active split coverage with the existing independently approved value-policy sibling. One pure operation, five public model contracts, one API dependency, one discriminated output, two new reusable modules, and one fail-closed privacy boundary remain counted. Direct-parent coverage is 100%, so no readiness or unresolved-gap points remain. Editor-kind and validation functions, validation/callback contracts, concrete components, UI fields, translations, API orchestration, async state, camera writes, and performance-sensitive collection work remain excluded. The 18-point result is in the policy's explicit split-review band, but the candidate remains cohesive because all owned contracts enforce one wire-descriptor-to-effective-state normalization boundary, share the same fixtures, and expose no independently reachable UI or service route.
- Functions/methods: 1 x 2 = 2
- Data structures/models: 5 x 1 = 5
- Dependencies/services: 1 x 1 = 1
- Returns/outputs/signals: 1 x 1 = 1
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
- Total: 18
- If total matches prior score, adversarial survival reason: not applicable; the author recount resolves the stale coverage condition that produced the pass-3 score of 120.
