# V4L2 Camera-Control Provider Candidate Record

Date: 2026-08-19
Status: awaiting_independent_review
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-d41e0cfe-3b67-4b03-9666-d745b33295dc`

- Candidate path: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
- Lineage/source body: `project/architecture/acd/usb-v4l2-camera-controls.md`, required specification leaf 2; child of the sizing result from `dispatch-280945bb-a158-48c8-94a3-a21695661b86`.
- Assigned responsibility: V4L2 descriptor discovery and sparse menu expansion, current-value reads, validated writes with read-back, stable configured-device resolution, per-device serialization, disconnect/reconnect cache behavior, blocking ioctl isolation from async callers, deterministic mocked-driver tests, and provider-level failure categories. HTTP and authorization behavior are excluded.
- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Implementation-spec template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Specification-review scoring policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Provisional author Review Score: 24.5
- Paired test-spec path: `project/specs/camera-controls/tests/v4l2-camera-control-provider.test-spec.md`
- Files changed:
  - `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
  - `project/specs/camera-controls/tests/v4l2-camera-control-provider.test-spec.md`
  - `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-candidate.md`
- Review status: `awaiting_independent_review`; no independent review pass is claimed by the author.
