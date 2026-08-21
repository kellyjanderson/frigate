# V4L2 Descriptor Discovery And Live-Read Provider Candidate Record

Date: 2026-08-19
Status: `awaiting_independent_review`

- Candidate path: `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`
- Lineage/source body: child 2 of `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`, assigned by independent split record `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md` pass `v4l2-provider-foundation-pass-1`.
- Assigned responsibility: V4L2 menu/control descriptor modeling, complete query and sparse-menu discovery, public full and bounded live reads, descriptor metadata cache population/refresh, volatile current-state semantics, provider-level discovery/read failures, blocking-call isolation through the foundation transaction, and deterministic discovery/read tests. Device identity, adapter/error primitives, transaction/lock/lifetime/cancellation/cache substrate/disconnect behavior are reused from the foundation sibling. Validated writes, write read-back, and `V4L2ControlWriteResult` remain excluded.
- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Scoring authority:
  - Template: `../.agents/process/templates/implementation-spec-template.md`
  - Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
  - Policy: `../.agents/process/specification-review-scoring-policy.md`
  - Policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Provisional author Review Score: 21
- Paired test-spec path: `project/specs/camera-controls/tests/v4l2-descriptor-discovery-and-live-read-provider.test-spec.md`
- Dependency: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` must be independently approved and implemented first.
- Downstream contract preservation: `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md` remains the exclusive authority for `V4L2ControlWriteResult`, validation, physical mutation, and mandatory write read-back.
- Files changed:
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`
  - `project/specs/camera-controls/tests/v4l2-descriptor-discovery-and-live-read-provider.test-spec.md`
  - `project/specs/camera-controls/review-ledger/v4l2-descriptor-discovery-and-live-read-provider-candidate.md`
