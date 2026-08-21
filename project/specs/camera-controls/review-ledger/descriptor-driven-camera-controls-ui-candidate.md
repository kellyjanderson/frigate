# Descriptor-Driven Camera Controls UI Candidate Record

Date: 2026-08-19
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-2cff32bb-47e0-40f4-9c9f-53c88ffc4a29`
Status: `awaiting_independent_review`

- Candidate path: `project/specs/camera-controls/descriptor-driven-camera-controls-ui.spec.md`
- Lineage/source body: user-requested descriptor-driven builder and two camera-view control surfaces under `project/architecture/acd/usb-v4l2-camera-controls.md`
- Assigned responsibility: reusable settings-descriptor interface builder; Light popover with display-only Levels and physical light controls; Lens/Geometry popover with sharpness, focus, zoom, pan, tilt, and similar controls; camera-view entry buttons; categorization; dependent, inactive, read-only, loading, error, and disconnected states; bounded volatile refresh; accessibility; mobile overflow; and route-level UI tests.
- Architecture anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Implementation-spec template fingerprint: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Specification-review scoring-policy fingerprint: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Test-specification template: `../.agents/process/templates/test-specification-template.md`
- Test-specification template fingerprint: `551d18532c5c6bea8d1a503fe37cc46bf039e535ac2e118584bf1d9b3d028bef`
- Provisional author Review Score: `47`
- Author sizing note: the provisional score is above the forced-split threshold and is not independent approval; child boundaries and paths remain review authority.
- Paired test-spec path: `project/specs/camera-controls/tests/descriptor-driven-camera-controls-ui.test-spec.md`
- Dependency/gate: `project/specs/camera-controls/v4l2-camera-control-provider-api.spec.md` must supply the approved authenticated API contract before physical editors are enabled.
- Files changed:
  - `project/specs/camera-controls/descriptor-driven-camera-controls-ui.spec.md`
  - `project/specs/camera-controls/tests/descriptor-driven-camera-controls-ui.test-spec.md`
  - `project/specs/camera-controls/review-ledger/descriptor-driven-camera-controls-ui-candidate.md`

No independent review pass is claimed by this author record.
