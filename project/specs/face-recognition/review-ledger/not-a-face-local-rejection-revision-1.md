# Not-a-Face Local Rejection Revision 1 Record

Date: 2026-08-21
Status: `awaiting_independent_review`

- Candidate path: `project/specs/face-recognition/not-a-face-local-rejection.spec.md`
- Lineage/source body: user request and narrowing dated 2026-08-21; bounded revision of independent review pass 1.
- Assigned responsibility: correct score arithmetic, add the paired feature test specification, and make pending confirmation ownership explicit without adding a backend endpoint.
- Review input: `project/specs/face-recognition/review-ledger/not-a-face-local-rejection-review-pass-1.md`
- Review input result: `revision_required` with independent Review Score `24`; split not required; parent coverage not applicable.
- Architecture/ACD anchors: none by explicit direct-to-spec exception; independent review found no architecture gap.
- Implementation-spec template: `/Users/k/Documents/Projects/.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `/Users/k/Documents/Projects/.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Paired test-spec template: `/Users/k/Documents/Projects/.agents/process/templates/test-specification-template.md`
- Paired test-spec template SHA-256: `551d18532c5c6bea8d1a503fe37cc46bf039e535ac2e118584bf1d9b3d028bef`
- Provisional author Review Score: `20`
- Cohesion decision: score 20 remains below the forced-split threshold; confirmation, pending ownership, one exact-file delete request, refresh, and feedback form one independently deliverable destructive user operation.
- Corrections applied:
  - Corrected the implementation-responsibility subtotal and candidate total from `18` to `20`; resolved readiness blockers are now zero.
  - Created and linked `project/specs/face-recognition/tests/not-a-face-local-rejection.test-spec.md` with manual, automated, route, failure, pending, focus, input, reload, and production-data contracts.
  - Assigned confirmation and pending state to `FaceAttemptGroup` and made `FaceLibrary.onDelete` an awaitable success-result callback so the dialog stays open and duplicate confirmation is disabled during the request.
- Evidence/authority gaps: none; authority fingerprints matched, and independent review reported no architecture, evidence, implementation-prerequisite, or scoring-authority gap.
- Paired test-spec path: `project/specs/face-recognition/tests/not-a-face-local-rejection.test-spec.md`
- Files changed:
  - `project/specs/face-recognition/not-a-face-local-rejection.spec.md`
  - `project/specs/face-recognition/tests/not-a-face-local-rejection.test-spec.md`
  - `project/specs/face-recognition/review-ledger/not-a-face-local-rejection-revision-1.md`
