# Camera-Control Editor Kind, Value Validation, And Commit Intent Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/camera-control-descriptor-contracts-review-pass-1.md`
Split provenance: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`, child 2 from independent review pass `camera-control-descriptor-contracts-pass-1`
Canonical status: Split child
Review Score: 19.5
Prerequisites:
- `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md` - supplies the authoritative normalized descriptor, scalar value, menu-item, effective-state, and normalization-result contracts consumed here without redefinition.
- `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` - owns the final shared descriptor wire contract; its independently accepted and implemented generated schema must exist before final frontend schema binding.
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines descriptor-driven editor mappings, driver authority, effective-state denial, and fail-closed handling.

## Source Field Carryover

- Source purpose:
  - Give renderer consumers one deterministic policy for selecting an editor, validating a proposed scalar value, emitting commit intent, and representing caller-supplied commit feedback without duplicating normalized wire contracts.
- Source responsibilities by category:
  - Functions/methods: select one editor kind and validate one candidate commit value.
  - Data structures/models: define editor-kind, stable validation-code/result, synchronous commit-callback, and caller-supplied commit-state contracts.
  - Dependencies/services: consume the normalization sibling's public descriptor/value/effective-state contracts and pure normalization result; no HTTP client or runtime service is owned here.
  - Returns/outputs/signals: return an editor kind, return a validation result, emit an exact canonical-ID/value intent tuple, and represent idle/pending/success/error feedback with an authoritative value.
  - UI surfaces/components: not applicable; this is a library-only policy boundary.
  - UI fields/elements: not applicable; editor widgets and feedback presentation belong to renderer siblings.
  - Reusable code plan: add public policy contracts to the normalization sibling's shared type module and add pure selection/validation exports to its utility module.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: not applicable; helpers and callback intent are synchronous, while request identity and stale-response rejection belong to mutation orchestration.
  - Destructive/write behavior: not applicable; the callback reports intent and performs no request or camera write.
  - Security/privacy-sensitive behavior: invalid or denied candidates expose no commit value; commit feedback carries stable caller-safe codes/messages and never raw exceptions, device paths, ioctl data, or submitted string values in logs.
  - Performance-sensitive behavior: not applicable; each operation examines one normalized descriptor and its descriptor-local menu collection.
  - Cross-screen reusable behavior: not applicable; named consumers are camera-control renderer siblings.
- Source open questions / nuance discovered:
  - Editor kind describes the structurally appropriate presentation even when effective state denies editing. `validateDescriptorValue` is the mandatory capability gate and rejects inactive or nonwritable descriptors before type-specific validation.
  - A pending or failed write never replaces the last authoritative value with the submitted candidate. Success uses caller-supplied driver read-back, including a clamped or otherwise adjusted value.
  - Unknown set bitmask bits are part of the authoritative full scalar and must survive a labeled known-bit change.
- Source split/provenance notes:
  - Independent pass `camera-control-descriptor-contracts-pass-1` rescored the parent at 28 and allocated 100% of its responsibilities between the normalization/effective-state child and this value-policy child.
  - This candidate owns exactly the second child's editor-kind, validation, callback/result, reconciliation-policy, and verification responsibility. The earlier renderer split remains authoritative for concrete editors and row presentation.

## Purpose

Convert one successfully normalized camera-control descriptor and candidate into a deterministic editor kind or validated commit value. Define the synchronous commit-intent and caller-supplied feedback contracts that preserve driver read-back as authoritative without owning UI controls or request execution.

## Scope

Owns:

- `DescriptorEditorKind`, `DescriptorValidationCode`, `DescriptorValidationResult`, `DescriptorCommitCallback`, and `DescriptorCommitState` public contracts.
- `getDescriptorEditorKind` and `validateDescriptorValue` as pure additions to the shared descriptor utility.
- Scalar, menu, bitmask, string, and button value representation; inclusive range, positive-step, sparse membership, and text validation; stable local failure codes; and denial when effective state is not writable.
- Exact canonical-ID/value commit intent, caller-supplied idle/pending/success/error state, driver-authoritative value reconciliation, unknown-bit preservation policy, and deterministic public-boundary tests.

Does not own:

- `CameraControlValue`, `CameraControlMenuItem`, `CameraControlDescriptor`, `DescriptorControlState`, `DescriptorNormalizationResult`, wire normalization, structural support classification, or effective-state derivation.
- Concrete editor widgets, draft ownership, row composition, labels, translations, feedback layout, accessibility interaction mechanics, or camera-view composition.
- API fetching, polling, mutation execution, retry, cancellation, request identity, stale-response rejection, authorization, OpenAPI generation, provider validation, or physical camera writes.

## Split Coverage

- Parent spec: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
- Parent coverage status: 100% covered by this candidate and `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md` under the two-child allocation in `camera-control-descriptor-contracts-pass-1`.
- Parent responsibilities owned by this child:
  - Editor-kind selection, candidate-value validation and normalization, validation result and stable codes, commit intent and caller feedback contracts, authoritative-value reconciliation, unknown-bit preservation, and policy-level verification.
- Parent responsibilities still missing from children:
  - none.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/camera-control-descriptor-contracts-review-pass-1.md` | 1 | `camera-control-descriptor-contracts.spec.md` and paired test spec | this child and `camera-control-descriptor-normalization.spec.md` definitions | continue |

## Implementation Routing

- Primary modules/files:
  - `web/src/types/cameraControls.ts` - add editor-kind, validation, callback, and caller-supplied commit-state contracts beside the normalization sibling's authoritative types.
  - `web/src/utils/cameraControlDescriptors.ts` - add pure editor selection and candidate validation beside the normalization sibling's exported normalizer.
- Supporting modules/files:
  - none.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `web/src/types/cameraControls.ts` - retain one shared camera-control type authority; this child adds only its owned public contracts.
  - `web/src/utils/cameraControlDescriptors.ts` - retain one shared pure policy boundary; this child adds only its two owned public functions.
- Tests:
  - `web/src/utils/cameraControlDescriptors.test.ts` - add editor-kind, candidate-validation, callback, commit-state, authoritative reconciliation, and unknown-bit preservation coverage.

## Chosen Defaults / Parameters

- `DescriptorEditorKind` is `boolean | integer | menu | integer-menu | button | string | labeled-bitmask | numeric-bitmask | unsupported`. A successfully normalized boolean, integer, menu, integer-menu, button, or string maps directly. Bitmask maps to `labeled-bitmask` when normalized labeled bit metadata is nonempty and otherwise to `numeric-bitmask`. Any defensively encountered unmapped type returns `unsupported`.
- Editor kind is structural, not permission-bearing. A known inactive, read-only, grabbed, disabled, or backend-nonwritable descriptor retains its type-appropriate kind so a renderer can show it consistently, but validation returns `control_not_editable` and no value.
- `DescriptorValidationCode` is the stable union `control_not_editable | unsupported_type | invalid_type | non_finite_integer | unsafe_integer | out_of_range | step_mismatch | menu_value_not_found | invalid_string_length | invalid_bitmask`.
- Validation never coerces booleans, ordinary integers, menu values, strings, or button values. Numeric validation requires a JavaScript `number` that is finite and integral, then safe; the distinct numeric codes are returned in that order.
- Ordinary integer candidates are valid only inside inclusive normalized minimum/maximum bounds and aligned by `(candidate - minimum) % effectiveStep === 0`. `effectiveStep` is the normalized positive integer step, or 1 when the normalized step is missing or non-positive.
- Ordinary menu candidates are the safe integer `index` of an existing sparse item. Integer-menu candidates are the safe integer non-null `value` of an existing item. Source order and holes are preserved; index and value are never substituted for one another.
- Boolean accepts only `true` or `false`. Button accepts exactly `null`. String accepts only a string, preserves it without trimming or normalization, and validates its Unicode code-point length against applicable inclusive normalized minimum/maximum length bounds.
- Bitmask accepts either a safe nonnegative integer or a full-string unsigned decimal or lower/upper-case `0x` hexadecimal representation. Parsed output is a safe nonnegative integer and must satisfy applicable inclusive normalized bounds. Signs, whitespace, separators, fractions, exponents, empty digits, trailing characters, and unsafe results return `invalid_bitmask` or `unsafe_integer` with no value.
- `validateDescriptorValue` never clears bits. A labeled-bit editor must derive its next whole value from the latest authoritative full bitmask by setting or clearing only the selected known mask, then validate and submit the whole value. Unknown set bits therefore remain unchanged.
- `DescriptorCommitCallback` is synchronous `(controlId: string, value: CameraControlValue) => void`. The control ID is the descriptor's canonical `serialized_id`; the value must come from `{ok: true, value}`. It returns no promise, request result, timer, cancellation handle, or optimistic value.
- `DescriptorCommitState` is a caller-supplied discriminated union with `idle`, `pending`, `success`, and `error`. Every branch contains `authoritativeValue`; pending also contains `submittedValue`; success contains `submittedValue` and the authoritative driver read-back; error contains `submittedValue`, a stable caller-safe code/message, and the unchanged last authoritative value.
- During pending, the authoritative value remains the last confirmed driver value. On success, the returned driver read-back replaces it even when it differs from the submitted candidate. On error, the submitted candidate is discarded and the last confirmed value remains authoritative. Request ownership and stale-result filtering occur before callers construct this state.

## Data Ownership

- Source of truth: the normalized descriptor and effective state supplied by the normalization sibling, plus caller-supplied driver read-back for commit outcomes.
- Read ownership: renderer siblings call the two exported pure functions and receive `DescriptorCommitState` from their request-orchestration caller.
- Write ownership: none. This child validates and reports synchronous intent only; a separate mutation owner performs requests and supplies current feedback state.
- Derived/cache data: editor kind, validation output, and whether a success was driver-adjusted are derived from supplied values. This child owns no cache, optimistic persistence, timer, or request state.
- Privacy/logging constraints: helpers log nothing. Validation results contain only stable local codes. Commit-state errors contain caller-safe code/message fields and must not contain device paths, raw server exceptions, ioctl structures, authentication data, or raw submitted string values in logs.

## Dependencies And Routes

- Domain/service dependencies:
  - `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md` supplies the authoritative public value, descriptor, effective-state, menu-item, and normalization-result contracts plus `normalizeCameraControlDescriptor` for the integrated consumer harness.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable. Renderer siblings consume the public kind, result, callback, and commit-state contracts; concrete rendering is outside this library-only child.
- Background/concurrency route, if applicable:
  - not applicable. The helpers and callback intent are synchronous. Callers own request execution, request identity, cancellation, stale-result rejection, and creation of the current commit-state value.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already defines descriptor-driven editor mappings, driver authority, effective-state behavior, fail-closed unknown types, and authoritative post-write read-back.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - verifies the deployed Linux V4L2 route and hardware control enumeration.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md` - must be independently accepted and implemented first because it owns the types and utility seam extended here.
  - `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md` - independent acceptance and implementation of its generated descriptor schema must precede final frontend schema binding.
- Progression handling:
  - prerequisite implementation must run first. This candidate remains proposed and requires independent specification review.

## Application Integration

- App type: library-only.
- User/caller surface: `DescriptorValueEditor`, `DescriptorSettingControl`, and the separately owned camera-control request-state consumer.
- Invocation route: a consumer branches on successful descriptor normalization, selects the editor kind, validates a deliberate candidate, emits the canonical-ID/value callback tuple only on validation success, and later supplies caller-filtered commit state whose authoritative value comes from driver read-back or the last confirmed value.
- Wiring owner/module: `web/src/utils/cameraControlDescriptors.ts`, with owned public contracts added to `web/src/types/cameraControls.ts`.
- Observable result: one deterministic editor kind, one discriminated validation result, zero or one exact callback tuple, and one caller-supplied commit-state value that never promotes an unconfirmed candidate to authoritative state.
- Integration validation: `cameraControlDescriptors.test.ts` passes a normalization-sibling fixture through the exported public functions and a type-checked callback/state harness, including adjusted success and error rollback.
- Incomplete status risk: designed. Private-helper-only tests, duplicated descriptor types, a callback fired from an invalid result, or a state that treats a pending/failed candidate as authoritative do not satisfy the library route.

App-type-specific proof:

- Library-only: tests import the shared public normalization and value-policy contracts, exercise the normalization-to-kind-to-validation-to-callback route, and apply caller-supplied pending/success/error states through the same public boundary used by named consumers. No component, request mock, API server, or physical camera substitutes for that proof.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `normalizeCameraControlDescriptor` and its public success result from `web/src/utils/cameraControlDescriptors.ts` - supply the only accepted descriptor input to the integrated consumer route.
- Current reuse readiness:
  - add this child's exports to the normalization sibling's shared type and utility modules after that prerequisite is implemented.
- Extraction/wrapping needed:
  - none; no editor, row, request, or camera-view code moves into this child.
- Additions to existing library/modules:
  - `web/src/types/cameraControls.ts` - add the five owned public contracts without redefining normalization-owned types.
  - `web/src/utils/cameraControlDescriptors.ts` - add the two owned pure functions without changing normalization ownership.
- New reusable modules to expose:
  - none.
- One-off code justification, if any:
  - none.

## Required DTOs / Functions / Components

- DTOs/models:
  - `DescriptorEditorKind` - structural editor-kind union `boolean | integer | menu | integer-menu | button | string | labeled-bitmask | numeric-bitmask | unsupported`.
  - `DescriptorValidationCode` - stable local failure-code union defined in Chosen Defaults.
  - `DescriptorValidationResult` - discriminated `{ok: true, value: CameraControlValue}` or `{ok: false, code: DescriptorValidationCode}`; the failure branch has no value member.
  - `DescriptorCommitCallback` - synchronous `(controlId: string, value: CameraControlValue) => void` intent contract using canonical `serialized_id` and a successful validation value.
  - `DescriptorCommitState` - caller-supplied `idle | pending | success | error` union carrying the authoritative value on every branch, submitted value on non-idle branches, and caller-safe error details only on error.
- Functions/methods:
  - `getDescriptorEditorKind(descriptor: CameraControlDescriptor) -> DescriptorEditorKind` - map one successful normalized descriptor to its structural editor kind without granting write capability.
  - `validateDescriptorValue(descriptor: CameraControlDescriptor, candidate: unknown) -> DescriptorValidationResult` - enforce effective writability and exact type/range/step/menu/text/bitmask/button policy, returning a commit value only on success.
- UI fields / visible data, if applicable:
  - not applicable; commit state is a data contract and its visible rendering belongs to the setting-row sibling.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Not performance-sensitive. Each function examines one normalized descriptor and at most its descriptor-local menu collection. It performs no camera-wide scan, sort, network access, polling, subscription, task, timer, or persistent update.

## Error And State Behavior

- Unsupported or defensively unmapped descriptor types return editor kind `unsupported`; validation returns `unsupported_type` with no value.
- Effective inactive or nonwritable state returns `control_not_editable` before candidate parsing. All other invalid results use the exact stable code order and expose no commit value.
- Pending preserves the last authoritative value and disables no state outside the consuming row. Success adopts caller-supplied driver read-back, including clamping or coupled adjustment. Error retains the last authoritative value and exposes only caller-safe error details.
- A callback invocation does not imply acceptance, success, or persistence. The driver read-back supplied by the caller is the only new authoritative value.
- Helpers are pure and stateless. This child owns no loading operation, retry, optimistic mutation, cancellation, request matching, or stale-result transition.

## Test Strategy

- Unit tests:
  - Exercise every editor kind from successful normalized fixtures, including labeled and unlabeled bitmask, plus defensive unsupported mapping and every effective-state denial.
  - Exercise boolean exactness; integer finite/integer/safe/range/step boundaries; sparse ordinary-menu index and integer-menu value membership; button null; exact string preservation and code-point length bounds; decimal/hex bitmask parsing; safe nonnegative/bound rules; every stable failure code; and absence of a value on every failure.
  - Toggle each known labeled bit from an authoritative full value containing unknown set bits and assert only the selected known mask changes before whole-value validation.
  - Exercise idle, pending, adjusted success, unchanged success, and error commit states; assert pending/error retain the prior authoritative value and success uses read-back rather than the submitted value.
- Service/DB tests:
  - not applicable.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - A compile-time and runtime consumer harness imports the normalization sibling's public result and this child's public contracts, processes exact generated-schema-shaped fixtures, records one canonical-ID/value tuple only after successful validation, and applies caller-supplied commit states without redefining wire or effective-state types.
- Production-data rule:
  - Tests use deterministic synthetic descriptors derived from the implemented generated API schema and require no camera, API server, production configuration, database, recording, timer, or physical device.

## Acceptance Criteria

- Every successfully normalized supported scalar family maps to exactly one structural editor kind; effective state never grants commit permission and unsupported types never gain an editable fallback.
- Validation returns a value only for exact boolean, safe aligned bounded integer, applicable sparse menu member, exact button null, bounded unmodified string, or safe bounded bitmask input, with the documented stable code for every denial.
- A labeled-bit change preserves all unknown bits from the latest authoritative full bitmask and submits the whole validated value.
- The callback emits only the descriptor's canonical serialized ID and a successful validation value, synchronously and without request or success semantics.
- Pending and error retain the prior authoritative value; success adopts caller-supplied driver read-back even when it differs from the submitted candidate; stale-result filtering remains outside this contract.
- Deterministic public-boundary tests cover selection, every validation rule/code, callback count/payload, unknown-bit preservation, and authoritative reconciliation without components, requests, hardware, or production data.

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
- Prior recorded score: none; this is the first authoring score for the child artifact.
- Adversarial rescore basis: recounted only this value-policy child. Two pure functions, five public policy contracts, one normalization dependency, four observable result/signal roles, one normalization export reused as-is, additions to two sibling-created shared modules, and one fail-closed privacy boundary are counted. Wire normalization and its five models, concrete editors, row fields and feedback presentation, translations, request/polling/mutation orchestration, concurrency, camera writes, API/OpenAPI behavior, and camera-view composition remain excluded. At 19.5 points the candidate is in the policy's explicit split-review band but remains cohesive because editor discrimination, validation, commit intent, and authoritative feedback share one scalar-policy seam and one deterministic consumer route; separating them would duplicate the exact type/value rules that make callback and reconciliation states safe.
- Functions/methods: 2 x 2 = 4
- Data structures/models: 5 x 1 = 5
- Dependencies/services: 1 x 1 = 1
- Returns/outputs/signals: 4 x 1 = 4
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 1 x 0.5 = 0.5
- Adding code to an existing library/module: 2 x 1 = 2
- Creating a new reusable library/module: 0 x 3 = 0
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 0 x 3 = 0
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 0 x 2 = 0
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 19.5
- If total matches prior score, adversarial survival reason: not applicable; no prior child score exists.
