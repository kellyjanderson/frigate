# Authenticated Camera-Control Selected-Values Read Endpoint Candidate Record

Date: 2026-08-20
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-8924f2e6-0df1-4fab-a505-2997c0b3100c`

## Candidate

- Candidate path: `project/specs/camera-controls/authenticated-camera-control-selected-values-read-endpoint.spec.md`
- Paired test-spec path: `project/specs/camera-controls/tests/authenticated-camera-control-selected-values-read-endpoint.test-spec.md`
- Lineage/source body: selected-values child of `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`, assigned by independent split record `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-endpoints-review-pass-1.md` pass `authenticated-camera-control-read-endpoints-pass-1`.
- Assigned responsibility: authenticated selected-values HTTP success behavior, unchanged delegation to exactly one `V4L2ControlProvider.get_control_values` call, bounded selected-read performance, direct ordered scalar mapping projection, provider-owned bounds and missing-ID failure propagation, values-route registration and generated OpenAPI proof, and paired response/ordering/bounds/missing-ID verification. Descriptor projection/refresh, mutation/write behavior, and shared-foundation contracts are excluded.

## Authorities And Gates

- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Parent split review:
  - `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-endpoints-review-pass-1.md` - SHA-256 `d72ea9d37cf224c98427c99c8d17fa6df40b36d508c2de3e573413eea41c62e2`, pass `authenticated-camera-control-read-endpoints-pass-1`, independent score `27`, parent coverage `100%`.
- Implemented shared prerequisite:
  - `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md` - approved and merged in PR #6 from exact head `eb59f3d6bb0a5d6a12c4fb2621bb6b3be88e7b5d`, findings none; consumed without redefining its contracts.
- Final provider prerequisites:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - independently approved and not yet implemented.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - independently approved and not yet implemented; owns `get_control_values`, selected-ID validation, uniqueness, 1 through 64 bounds, ordering, missing-ID behavior, and selected reads.
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority verification: both supplied fingerprints and the split-review fingerprint matched the files read during authoring.
- Architecture gap: none identified; the supplied ACD and current-runtime anchors define the assigned administrator, configured-camera, trusted-path, async, safe-error, selected-value-read, and authenticated OpenAPI boundaries.
- Evidence gap: none identified; the parent candidate/test, exact split record, implemented shared-foundation facts, supplied provider dependency gates, related artifacts, and architecture anchors define the assigned contracts.

## Authoring Result

- Provisional author Review Score: `19`.
- Parent independent review fact: score `27`, result `split_required`, pass `authenticated-camera-control-read-endpoints-pass-1`; treated as adversarial input rather than child approval.
- Split coverage: `100%` across this selected-values child and the descriptor endpoint sibling; no parent responsibility is unassigned.
- Cohesion fact: the score is in the explicit split-review range. The candidate remains one cohesive independently ownable endpoint because it contains one handler, one success model, one provider method, one generated operation, and one bounded route-test surface.
- Provider delegation fact: values GET passes FastAPI's repeated serialized-ID list unchanged to exactly one `V4L2ControlProvider.get_control_values(camera_config, control_ids)` call; the API does not reimplement provider-owned canonical-ID validation, uniqueness, bounds, membership, ordering, selected reads, or missing-ID behavior.
- Separate ownership: descriptor projection/refresh, shared foundation contracts, and all mutation/write endpoints remain outside this child.
- Independent approval: not claimed; this record is awaiting fresh independent review.

## Files Changed

- `project/specs/camera-controls/authenticated-camera-control-selected-values-read-endpoint.spec.md`
- `project/specs/camera-controls/tests/authenticated-camera-control-selected-values-read-endpoint.test-spec.md`
- `project/specs/camera-controls/review-ledger/authenticated-camera-control-selected-values-read-endpoint-candidate.md`
