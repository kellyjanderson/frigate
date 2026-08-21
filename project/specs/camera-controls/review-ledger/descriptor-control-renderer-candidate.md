# Descriptor Control Renderer Candidate Record

Date: 2026-08-19
Status: `awaiting_independent_review`
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-c9714d02-f93b-48da-a148-fa6c2077120f`

- Candidate path: `project/specs/camera-controls/descriptor-control-renderer.spec.md`
- Lineage/source body: `project/specs/camera-controls/descriptor-driven-camera-controls-ui.spec.md`, child of the sizing result from `dispatch-2cff32bb-47e0-40f4-9c9f-53c88ffc4a29`.
- Assigned responsibility: typed frontend descriptor contract and reusable rendering of boolean, integer, menu/integer-menu, button, string, bitmask, and unsupported compound/array controls; exact entry and driver metadata; effective disabled states without layout movement; caller-supplied pending/success/error feedback; fail-closed unknown types; keyboard/touch behavior; and component tests. API orchestration and camera-view composition are excluded.
- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Implementation-spec template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Specification-review scoring policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Provisional author Review Score: `23`
- Paired test-spec path: `project/specs/camera-controls/tests/descriptor-control-renderer.test-spec.md`
- Files changed:
  - `project/specs/camera-controls/descriptor-control-renderer.spec.md`
  - `project/specs/camera-controls/tests/descriptor-control-renderer.test-spec.md`
  - `project/specs/camera-controls/review-ledger/descriptor-control-renderer-candidate.md`
- Review status: `awaiting_independent_review`; no independent review pass is claimed by the author.
