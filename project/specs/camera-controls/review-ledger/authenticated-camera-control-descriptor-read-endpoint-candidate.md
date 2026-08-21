# Authenticated Camera-Control Descriptor Read Endpoint Candidate Record

Date: 2026-08-20
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-626555f2-505f-4ddf-9f75-ae0aec473f73`

## Candidate

- Candidate path: `project/specs/camera-controls/authenticated-camera-control-descriptor-read-endpoint.spec.md`
- Paired test-spec path: `project/specs/camera-controls/tests/authenticated-camera-control-descriptor-read-endpoint.test-spec.md`
- Lineage/source body: descriptor child of `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`, assigned by independent split record `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-endpoints-review-pass-1.md` pass `authenticated-camera-control-read-endpoints-pass-1`.
- Assigned responsibility: the administrator-only descriptor GET, default and explicit refresh forwarding, exactly one `V4L2ControlProvider.get_controls` call, provider enumeration order, API-owned descriptor success models, safe HTTP JSON projection of provider `current_value` including bytes and tuples without raw payload exposure, non-scalar route tests, descriptor refresh performance, route registration, and generated admin-auth OpenAPI proof. Selected-values reads, all writes, and shared-foundation contracts are excluded.

## Authorities And Gates

- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Direct parent and exact split record:
  - `project/specs/camera-controls/authenticated-camera-control-read-endpoints.spec.md`
  - `project/specs/camera-controls/review-ledger/authenticated-camera-control-read-endpoints-review-pass-1.md`, verified SHA-256 `d72ea9d37cf224c98427c99c8d17fa6df40b36d508c2de3e573413eea41c62e2`
- Related artifacts:
  - `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
  - `project/specs/camera-controls/camera-control-api-shared-foundation.spec.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority verification: the supplied template, policy, and split-review fingerprints matched the files read during authoring.
- Architecture gap: none identified; the ACD defines the assigned administrator, configured-camera, descriptor-read, explicit-refresh, async, safe-error, inspectable metadata, and authenticated OpenAPI boundaries.
- Evidence gap: none identified; the exact split review, parent artifacts, implemented shared foundation, final provider specifications, and architecture anchors define the assigned contracts.
- Dependency gates:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` remains an unimplemented prerequisite.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` remains an unimplemented prerequisite.

## Authoring Result

- Provisional author Review Score: `22`.
- Parent independent review fact: score `27`, result `split_required`, pass `authenticated-camera-control-read-endpoints-pass-1`.
- Parent coverage: `100%` across this child and the reviewer-defined Authenticated Camera-Control Selected-Values Read Endpoint sibling; uncovered responsibilities `none`.
- Projection decision: provider scalar `bool`, `int`, and `str` values pass through; provider `None`, bytes, and tuples become JSON null with `unavailable`, `redacted_binary`, or `redacted_sequence`. Bytes and tuple content are never decoded, encoded, hashed, stringified, logged, or generically dumped into the HTTP model.
- Cohesion fact: at 22, the candidate is in the policy's explicit split-review range. It remains one endpoint-sized responsibility because the handler, projection, response models, refresh bound, route tests, and generated schema are one independently implementable descriptor-read contract.
- Separate ownership: selected-values reads, writes, provider mechanics, and all shared foundation contracts remain outside this child.
- Independent approval: not claimed; this record is awaiting a fresh independent review.

## Files Changed

- `project/specs/camera-controls/authenticated-camera-control-descriptor-read-endpoint.spec.md`
- `project/specs/camera-controls/tests/authenticated-camera-control-descriptor-read-endpoint.test-spec.md`
- `project/specs/camera-controls/review-ledger/authenticated-camera-control-descriptor-read-endpoint-candidate.md`
