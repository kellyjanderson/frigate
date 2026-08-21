# Authenticated Camera-Control Read API Candidate Record

Date: 2026-08-19
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-d46c1123-c51e-4ad3-bc06-3f6306b60056`

## Candidate

- Candidate path: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- Paired test-spec path: `project/specs/camera-controls/tests/authenticated-camera-control-read-api.test-spec.md`
- Lineage/source body: `project/specs/camera-controls/authenticated-camera-control-api.spec.md`
- Split-plan record: `project/specs/camera-controls/review-ledger/authenticated-camera-control-api-review-pass-1.md`
- Assigned responsibility: authenticated descriptor and bounded current-value GET routes plus the router, administrator dependency, configured-camera support, safe response/error envelope, provider-error translation, shared wire models, GET OpenAPI declarations, deterministic mocked-provider tests, and route proof shared with the write sibling. Control mutation is excluded.

## Authorities And Gates

- Architecture anchor: `project/architecture/acd/usb-v4l2-camera-controls.md`
- Current-runtime anchor: `project/architecture/current-camera-runtime.md`
- Provider prerequisite: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`; independent approval and implementation are required before API integration.
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority verification: both supplied fingerprints matched the files read during authoring.
- Architecture gap: none identified in the bounded independent review facts or this authoring pass.
- Evidence gap: none identified for deterministic mocked-provider API specification and route proof.

## Authoring Result

- Provisional author Review Score: `24.5`
- Parent independent review fact: `30.5`, result `split_required`, pass `authenticated-camera-control-api-pass-1`.
- Parent coverage: `100%` across this child and the assigned write sibling.
- Inter-child dependency: the write child consumes this child's router, provider composition point, administrator/configured-camera conventions, common error envelope, and provider-error translation contract without redefining them.
- Independent approval: not claimed; this record is awaiting a fresh independent review.

## Files Changed

- `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- `project/specs/camera-controls/tests/authenticated-camera-control-read-api.test-spec.md`
- `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-api-candidate.md`
