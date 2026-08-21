# Authenticated Camera-Control Read Endpoints Candidate Record

Date: 2026-08-20
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-17179e43-73ee-47b3-83c1-b32a5755adde`

## Candidate

- Candidate path: `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`
- Paired test-spec path: `project/specs/camera-controls/tests/authenticated-camera-control-read-endpoints.test-spec.md`
- Lineage/source body: child 2 of `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`, assigned by independent split record `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-api-review-pass-1.md` pass `authenticated-camera-control-read-api-pass-1`.
- Assigned responsibility: the two administrator-only camera-control GET endpoints, descriptor refresh forwarding, exact bounded selected-read delegation to `V4L2ControlProvider.get_control_values`, two success models, GET-specific authorization/response behavior, route registration, generated OpenAPI operation proof, and deterministic route tests. Shared router/auth/configured-camera/provider seam/error/cancellation/logging contracts, provider selection mechanics, mutation/write behavior, frontend work, and hardware validation are excluded.

## Authorities And Gates

- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Implemented shared prerequisite:
  - `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` - approved and merged in PR #6 from exact head `eb59f3d6bb0a5d6a12c4fb2621bb6b3be88e7b5d`, findings none; consumed without redefining its contracts.
- Final provider prerequisites:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - independently approved and not yet implemented.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - independently approved and not yet implemented; owns selected-ID validation, ordering, missing-ID behavior, and `get_control_values`.
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority verification: both supplied fingerprints matched the files read during authoring.
- Architecture gap: none identified; the ACD defines the assigned administrator, configured-camera, trusted-path, async, safe-error, read-endpoint, and OpenAPI boundary.
- Evidence gap: none identified; the parent split record, merged shared-foundation completion facts, final provider leaves, and architecture anchors define the assigned contracts.

## Authoring Result

- Provisional author Review Score: `23`.
- Parent independent review fact: `26.5`, result `split_required`, pass `authenticated-camera-control-read-api-pass-1`.
- Split coverage: `100%` across this read-endpoints child and `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md`; no parent responsibility is unassigned.
- Cohesion fact: the score is in the explicit split-review range. The candidate remains one cohesive resource-family read surface because both GET operations consume the same merged router/helper and provider read contract, add success models in the same response module, share generated registration, and are proven by one route suite.
- Provider delegation fact: values GET passes FastAPI's repeated serialized-ID list unchanged to exactly one `V4L2ControlProvider.get_control_values(camera_config, control_ids)` call; the API does not reimplement provider-owned canonical-ID validation, bounds, ordering, selected reads, or missing-ID behavior.
- Separate ownership: shared foundation contracts and all mutation/write endpoints remain outside this child.
- Independent approval: not claimed; this record is awaiting a fresh independent review.

## Files Changed

- `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`
- `project/specs/camera-controls/tests/authenticated-camera-control-read-endpoints.test-spec.md`
- `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-endpoints-candidate.md`
