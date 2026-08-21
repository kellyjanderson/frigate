# Not-a-Face Local Rejection Specification

Date: 2026-08-21
Status: Proposed
Primary ancestor: `User request dated 2026-08-21`
Architecture ancestor: `not applicable by explicit user-authorized direct-to-spec process exception`
Source artifact: `User request; current Face Library saved-attempt deletion path`
Split provenance: `none`
Canonical status: `Draft candidate`
Review Score: 20
Prerequisites:
- `web/src/pages/FaceLibrary.tsx` - existing `onDelete` request behavior supports the `train` collection; this candidate extends its return contract.
- `frigate/api/classification.py::deregister_faces` - existing sanitized local file deletion.
- `project/specs/face-recognition/tests/not-a-face-local-rejection.test-spec.md` - paired feature verification contract.

## Source Field Carryover

- Source purpose: add a `That's not a face` button that deletes one false face detection from saved attempts.
- Source responsibilities by category:
  - Functions/methods: invoke existing deletion for the selected attempt.
  - Data structures/models: not applicable; use the existing filename.
  - Dependencies/services: Face Library state and existing delete endpoint.
  - Returns/outputs/signals: removed crop, refreshed state, and feedback.
  - UI surfaces/components: one saved-attempt action.
  - UI fields/elements: button, confirmation, cancel, and feedback.
  - Reusable code plan: reuse the alert-dialog primitives, translated toast pattern, existing delete endpoint, and `delete_face_ids` local deletion as-is; extend the existing Face Library module's callback contract.
  - Database queries/tables/migrations: not applicable; attempts are files.
  - Async/concurrency behavior: one delete request followed by revalidation.
  - Destructive/write behavior: delete exactly one file from `FACE_DIR/train`.
  - Security/privacy-sensitive behavior: no new sensitive-data handling.
  - Performance-sensitive behavior: not applicable.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - Parent event, recording, snapshot, and named face libraries remain unchanged.
- Source split/provenance notes:
  - One action, one existing route, one file, and one result form a cohesive candidate.

## Purpose

Let the user remove one saved recognition crop that is not actually a face by using the deletion machinery already managing the Train collection.

## Scope

Owns:

- A visible `That's not a face` action for each saved attempt.
- Confirmation, exact-file deletion, refresh, and local feedback.

Does not own:

- Sending images or metadata to any external service.
- Changing models, thresholds, training data, or named face libraries.
- Deleting the parent event, recording, snapshot, or sibling attempts.
- A new backend endpoint or persistence model.

## Split Coverage

- Parent spec: `none`
- Parent coverage status: `not applicable`
- Parent responsibilities owned by this child: `not applicable`
- Parent responsibilities still missing from children: `none`

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/face-recognition/review-ledger/not-a-face-local-rejection-revision-1.md` | revision 1 | this candidate | none | independent review required |

## Implementation Routing

- Primary modules/files:
  - `web/src/pages/FaceLibrary.tsx` - add the action to `FaceAttemptGroup` and call existing deletion with `train` and the filename.
  - `web/public/locales/en/views/faceLibrary.json` - translated action, confirmation, and feedback.
- Supporting modules/files:
  - `web/src/components/card/ClassificationCard.tsx` - existing action slot; no change expected.
  - `frigate/api/classification.py` - existing endpoint; no change expected.
- GUI/QML files, if applicable: `not applicable; React web UI`
- Reusable library/module files: `none`
- Tests:
  - `web/e2e/specs/face-library.spec.ts` - action, request, error, and post-refresh absence.

## Chosen Defaults / Parameters

- Action text and accessible name are `That's not a face`.
- The action applies to one displayed crop.
- Confirmation says the crop is removed while the event and recording remain.
- Confirm uses `/faces/train/delete` with only the selected filename.
- `FaceAttemptGroup` owns the selected-attempt confirmation and its pending state.
- The confirmation remains open and its destructive confirm is disabled while the delete request is pending; success closes it, while failure leaves it open for retry.
- No outbound submission control or request exists.

## Data Ownership

- Source of truth: saved attempt file under `FACE_DIR/train`.
- Read ownership: existing Face Library data.
- Write ownership: existing delete API and `EmbeddingsContext.delete_face_ids`.
- Derived/cache data: Face Library SWR state, revalidated after success.
- Privacy/logging constraints: existing constraints remain; no new image or identity logging.

## Dependencies And Routes

- Domain/service dependencies: existing Face Library `onDelete` and admin delete API; `onDelete` is extended from a fire-and-forget `void` callback to an awaitable success result for this UI flow.
- Database dependencies: `none`
- GUI route: Face Library, Train, attempt, action, confirmation, delete, refresh.
- Background/concurrency route: `FaceAttemptGroup` captures the filename at confirmation, sets its local pending owner before awaiting `onDelete`, disables duplicate confirmation while pending, closes on a successful result, and retains the dialog and crop on failure; the shared callback revalidates after success.

## Prerequisite Handling

- Architecture feedback artifacts: `none; explicitly waived for this direct-to-spec experiment`
- Architecture feedback status: `not applicable`
- Already implemented prerequisites: `FaceLibrary.onDelete`, `/faces/{name}/delete`, and `delete_face_ids`.
- Missing prerequisite architecture: `none under the user-authorized process exception`
- Missing prerequisite specifications: `none`
- Unimplemented prerequisite specifications: `none`
- Progression handling: candidate can proceed to independent review.

## Application Integration

- App type: `mixed GUI and existing API-service route`
- User/caller surface: one saved attempt in Face Library Train.
- Invocation route: action, `FaceAttemptGroup` confirmation/pending state, awaitable existing delete callback, refresh.
- Wiring owner/module: `FaceAttemptGroup` in `web/src/pages/FaceLibrary.tsx`.
- Observable result: only the selected crop disappears and remains absent after reload.
- Integration validation: Playwright through the real Train card route with disposable fixtures.
- Incomplete status risk: helper or translation-only work is insufficient; the action must be reachable in Face Library.

App-type-specific proof:

- GUI: visible action, keyboard/touch activation, focus, confirmation, loading, error, last-item, and narrow-screen states.
- API/service: request uses `name=train` and one sanitized filename.
- Mixed: prove the visible action and persisted file removal.

## Reuse And Extraction Plan

- Existing code to reuse:
  - Alert-dialog primitives - present confirmation accessibly without introducing another dialog family.
  - Existing translated toast pattern - preserve success and retryable error feedback.
  - `/faces/{name}/delete` - accept the existing exact-filename request for `train`.
  - `EmbeddingsContext.delete_face_ids` - preserve sanitized, local exact-file deletion.
- Current reuse readiness: `add to existing library/module`
- Extraction/wrapping needed: `none; keep confirmation and pending ownership local to FaceAttemptGroup`
- Additions to existing library/modules:
  - `FaceLibrary.onDelete` returns an awaitable success result after its existing request, feedback, and refresh responsibilities.
  - `FaceAttemptGroup` gains one semantic action, confirmation state, and pending state that supplies `train` plus the selected filename to the callback.
- New reusable modules to expose: `none`
- One-off code justification, if any: thin entrypoint into existing deletion behavior.

## Required DTOs / Functions / Components

- DTOs/models: `none`
- Functions/methods:
  - `onDelete(name, ids, isName?) -> Promise<boolean>` - extend the existing callback to resolve `true` after server acceptance and refresh dispatch, or `false` after translated failure feedback; `FaceAttemptGroup` awaits it and does not receive a thrown request error.
- UI fields / visible data: action, confirmation copy, and existing result feedback.
- UI elements / controls: labeled action, cancel, and destructive confirm; cancel and confirm are disabled while pending.
- UI components: existing attempt action area and alert-dialog family, with `FaceAttemptGroup` as the confirmation/pending owner.

## Performance Contract

- Use already-loaded attempt data.
- Issue one delete request and one revalidation per success.

## Error And State Behavior

- Keep dialog and card layout stable while active; `FaceAttemptGroup` disables cancel, destructive confirm, and duplicate activation while its selected filename is pending.
- Deleting the last attempt reveals the established Train empty state.
- Failure resolves the callback as unsuccessful, keeps the dialog and crop visible, clears pending, and shows translated retryable feedback.
- Success resolves the callback as successful, closes the dialog, and removes only the matching crop after server acceptance and revalidation.
- Move focus to a stable adjacent control or Train heading when the card disappears.
- Controls and translated copy remain usable without clipping on mobile.

## Test Strategy

- Unit tests: not required for the thin call into existing behavior.
- Service/DB tests: existing endpoint coverage proves filename sanitization and exact-file deletion.
- GUI/controller tests: semantics, confirmation, duplicate-submit prevention, focus, and error.
- Integrated route tests:
  - Playwright confirms `/faces/train/delete` receives only the clicked filename and the crop stays absent after refresh.
  - A held request proves the dialog stays open and the confirm cannot submit twice; an error response keeps the dialog and crop visible and omits success feedback.
  - `project/specs/face-recognition/tests/not-a-face-local-rejection.test-spec.md` defines the complete manual and automated feature contract.
- Production-data rule: tests must not require production data or real face images.

## Acceptance Criteria

- Every saved attempt exposes a translated `That's not a face` action.
- Confirmation sends exactly one filename to existing `faces/train/delete`.
- While deletion is pending, the owning attempt confirmation stays open and cannot submit a duplicate request.
- Success removes only that crop and persists after reload.
- Parent media, sibling attempts, and named libraries remain unchanged.
- Failure preserves the crop and provides retryable feedback.
- No image or metadata is submitted externally.
- Keyboard, pointer, touch, focus, and mobile behavior remain usable.

## Readiness Checklist

- [x] Primary and architecture ancestors are explicit.
- [x] Front-matter and final Review Scores match.
- [x] Current template source is recorded.
- [x] Score was recounted from this text.
- [x] Unresolved deferral/gap markers are absent.
- [x] Source fields and canonical status are explicit.
- [x] Prerequisites and split coverage are resolved or not applicable.
- [x] Candidate ledger, implementation owner, and reuse decision are explicit.
- [x] UI elements, defaults, ownership, route, app type, and validation are explicit.
- [x] Performance and privacy constraints are explicit.
- [x] Tests avoid production data and acceptance criteria are testable.

## Review Score Calculation

- Template source: `/Users/k/Documents/Projects/.agents/process/templates/implementation-spec-template.md` (SHA-256 `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`)
- Prior recorded score: 18 (adversarial input, not trusted)
- Adversarial rescore basis: recounted every category from the revised text, corrected the previous arithmetic undercount, resolved the absent paired-test and ambiguous pending-owner blockers, and excluded all model-feedback behavior.
- Functions/methods: 1 x 2 = 2
- Data structures/models: 0 x 1 = 0
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 2 x 1 = 2
- UI surfaces/components: 1 x 2 = 2
- UI fields/elements: 3 x 1 = 3
- Existing reusable code reused as-is: 4 x 0.5 = 2
- Adding code to an existing library/module: 1 x 1 = 1
- Creating a new reusable library/module: 0 x 3 = 0
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 1 x 3 = 3
- Security/privacy-sensitive behavior: 0 x 3 = 0
- Performance-sensitive behavior: 0 x 2 = 0
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 20
- If total matches prior score, adversarial survival reason: not applicable; the corrected total differs from the prior score.
