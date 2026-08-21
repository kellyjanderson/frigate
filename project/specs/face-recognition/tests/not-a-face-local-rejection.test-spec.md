# Not-a-Face Local Rejection Test Specification

Date: 2026-08-21
Status: Proposed
Feature spec: `project/specs/face-recognition/not-a-face-local-rejection.spec.md`
Feature spec canonical status: `Draft candidate awaiting independent review`
Architecture ancestor: `not applicable by explicit user-authorized direct-to-spec process exception`

## Overview

Verify that a user can reject exactly one saved Face Library attempt as not a face through a confirmed, local-only deletion that preserves related media and other face data.

## Application Integration Under Test

- App type: `mixed GUI and existing API-service route`
- User/caller surface: one saved attempt in Face Library Train.
- Invocation route: translated action, `FaceAttemptGroup` confirmation and pending state, awaitable `FaceLibrary.onDelete`, `/faces/train/delete`, then Face Library revalidation.
- Wiring owner/module: `FaceAttemptGroup` and `FaceLibrary.onDelete` in `web/src/pages/FaceLibrary.tsx`.
- Observable result: only the chosen crop disappears after success and remains absent after reload; failure leaves the dialog and crop available for retry.
- Integration validation: Playwright in `web/e2e/specs/face-library.spec.ts` through the real `/faces` Train route with disposable API fixtures.

## Manual Smoke

- Open Face Library with at least two disposable saved attempts, activate `That's not a face` on one attempt, and verify translated confirmation says the crop is removed while the event and recording remain.
- Confirm with pointer, then reload Face Library and verify only the chosen crop remains absent while the sibling crop and parent event media remain available.
- Repeat with keyboard activation and a deliberately held request: verify focus is visible, the dialog stays open, cancel and confirm are disabled while pending, and repeated activation does not issue another request.
- Exercise the action at a narrow/mobile viewport with touch and verify action, copy, and controls remain visible without clipping.
- Force a delete failure and verify the dialog and crop remain visible, pending clears, retry is possible, and translated error feedback appears without success feedback.

## Automated Smoke Tests

- Seed grouped Train attempts with disposable filenames, open `/faces`, expose the per-attempt action, and assert its translated accessible name is `That's not a face`.
- Activate the action and assert the confirmation is reachable through the rendered Face Library route before any delete request is sent.

## Automated Acceptance Tests

- Unit/helper behavior:
  - No standalone helper test is required; the behavior is a thin stateful UI route around existing deletion machinery and must be proven through the integrated component route.
- Integrated route behavior:
  - Click one attempt's action and verify cancel sends no request and leaves both attempts visible.
  - Confirm and assert exactly one POST targets `/api/faces/train/delete` with `{ "ids": [selectedFilename] }`; no sibling filename or external endpoint is included.
  - After the successful response, update the disposable `/api/faces` fixture to omit only the selected filename, verify the dialog closes and only that crop disappears, reload, and assert it remains absent while the sibling stays visible.
  - Verify deleting the last disposable attempt reaches the established Train empty state.
  - Verify keyboard activation opens confirmation, focus enters the dialog, and after successful removal focus lands on a stable adjacent action or the Train heading.
  - Run the accessible action and confirmation assertions in desktop and mobile projects so pointer, keyboard, and touch-sized/narrow-screen behavior are covered.
- Failure and stale-result behavior, if applicable:
  - Hold the POST unresolved, activate confirm repeatedly, and assert only one request is observed while the dialog remains open and cancel and confirm are disabled.
  - Fulfill the held request successfully, then verify controls do not act on the stale removed crop and the refreshed list contains the sibling only.
  - Return an error response and assert pending clears, the dialog and selected crop remain visible, retry can issue one new request, translated error feedback appears, and no success feedback appears.

## App-Type Proof

- GUI proof:
  - The visible per-attempt action, confirmation, pending controls, focus transfer, error/retry state, last-item empty state, and desktop/mobile route are asserted through `/faces`.
- Console proof:
  - `not applicable`
- API/service proof:
  - The existing authenticated application route receives `name=train` in the URL and exactly one sanitized disposable filename in the request body; success and error responses drive the specified UI outcomes.
- Mixed-surface proof:
  - The same Playwright flow proves both the visible Face Library interaction and the exact existing delete request/side effect; helper-only or direct-endpoint-only coverage is insufficient.
- Library-only proof:
  - `not applicable`

## Fixtures And Data

- Extend the existing disposable Face Library mocks in `web/e2e/fixtures/mock-data/faces` or construct an equivalent per-test payload containing at least two distinct Train attempt filenames associated with a disposable grouped event.
- Route `/api/faces/train/delete` in Playwright to capture request count/body and independently control pending, success, and error responses.
- Route `/api/faces` so successful revalidation removes exactly the selected filename while retaining the sibling; keep the pre-delete payload for failure cases.
- Use existing disposable event/media fixtures to prove parent media is unchanged without reading or mutating real recordings.
- Production-data rule: tests must not require production data or real face images.

## Acceptance

- [ ] Feature spec is canonical, or this test spec is explicitly temporary while split coverage is incomplete.
- [ ] Route-level proof exists for the mixed GUI and API-service app type.
- [ ] Helper-only tests cannot satisfy this feature contract.
- [ ] Exact-file request, success-after-reload, sibling/media preservation, and last-item behavior are asserted or manually checked.
- [ ] Failure, retry, pending duplicate prevention, stale-result behavior, and translated feedback are covered.
- [ ] Keyboard, focus, pointer, touch, and narrow/mobile behavior are covered.
- [ ] Tests use disposable fixtures and do not require production data.
