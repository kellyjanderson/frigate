# Authenticated Camera-Control API Candidate Record

Date: 2026-08-19
Status: awaiting_independent_review
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-c92d6b76-48c0-4f52-a3a3-0ed10de3c36a`

- Candidate path: `project/specs/camera-controls/authenticated-camera-control-api.spec.md`
- Lineage/source body: `dispatch-280945bb-a158-48c8-94a3-a21695661b86` combined provider/API work order, terminated as `specification_sizing_gap`; ACD Required Specification Leaf 3.
- Assigned responsibility: administrator-only camera-scoped descriptor retrieval, bounded value refresh and control update endpoints; configured-camera-to-provider routing; request/response models; stable permission, validation, unavailable-device, and write-failure responses; async provider delegation; OpenAPI auth artifact regeneration; deterministic mocked-provider endpoint tests and route-level proof. V4L2 ioctl/provider implementation is excluded.
- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Implementation-spec template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Specification-review scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Provisional author Review Score: 24.5. This lies in the policy's explicit split-review band; the authoring cohesion basis is that all three handlers form one administrator-authenticated camera-control resource over one provider contract and share one error/model/OpenAPI boundary. This is not independent approval.
- Paired test-spec path: `project/specs/camera-controls/tests/authenticated-camera-control-api.test-spec.md`
- Files changed:
  - `project/specs/camera-controls/authenticated-camera-control-api.spec.md`
  - `project/specs/camera-controls/tests/authenticated-camera-control-api.test-spec.md`
  - `project/specs/camera-controls/review-ledger/authenticated-camera-control-api-candidate.md`
