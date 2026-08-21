# V4L2 Camera-Control Provider Foundation Candidate Record

Date: 2026-08-19
Status: awaiting_independent_review
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-f985b8e2-1709-4085-a1f1-de1a8a78e5b7`

- Candidate path: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
- Lineage/source body: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`, split by `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-review-pass-1.md` pass `v4l2-control-provider-pass-1`.
- Assigned responsibility: shared provider module and public callable contract; configured V4L2 device identity and resolution; adapter/ioctl seam; device, descriptor, menu, DTO, and error models; per-device transaction lock and descriptor cache; descriptor enumeration; full and bounded current-value reads; disconnect/reconnect and cancellation recovery; blocking-call isolation; and deterministic foundation/read tests. Validated writes and write read-back are excluded.
- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Implementation-spec template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Specification-review scoring policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Provisional author Review Score: 24.5
- Paired test-spec path: `project/specs/camera-controls/tests/v4l2-camera-control-provider-foundation.test-spec.md`
- Files changed:
  - `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
  - `project/specs/camera-controls/tests/v4l2-camera-control-provider-foundation.test-spec.md`
  - `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-candidate.md`
- Review status: `awaiting_independent_review`; no independent review pass is claimed by the author.
