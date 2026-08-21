# V4L2 Device Transaction And Identity Foundation Candidate Record

Date: 2026-08-19
Status: awaiting_independent_review
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-7daf1a41-4915-4e4d-8a45-e3be7bde25f8`

- Candidate path: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
- Lineage/source body: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`, split by `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md` pass `v4l2-provider-foundation-pass-1`.
- Assigned responsibility: authoritative `frigate/camera/v4l2_controls.py` module location; optional configured-device reference; stable udev and capability identity; injected `V4L2Adapter`; `_ResolvedV4L2Device`, `_V4L2DeviceState`, `_V4L2IdentityRegistry`, and `V4L2ControlError`; configured-reference binding, per-device transaction/lock and open/close lifetime; atomic replacement invalidation, state leasing/retirement, payload-agnostic cache primitives; disconnect/reconnect and cancellation recovery; privacy/redaction; and deterministic foundation fixtures/tests. Descriptor/menu enumeration, current-value reads, and validated writes are excluded.
- Architecture/ACD anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Implementation-spec template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Specification-review scoring policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Provisional author Review Score: 22.5
- Paired test-spec path: `project/specs/camera-controls/tests/v4l2-device-transaction-and-identity-foundation.test-spec.md`
- Parent split facts: independent review result `split_required`, fresh score 25.5, `V4L2Adapter` counted as an explicit interface/seam model, current durable parent coverage 100%, no uncovered or duplicated responsibility, and complete coverage of this candidate's owned responsibilities. The descriptor-discovery/live-read sibling, paired test, and approving pass-1 review record now exist.
- Revision provenance: independent pass `v4l2-device-transaction-identity-pass-1` returned `revision_required` at score 23.5 with one implementation-contract readiness blocker. Revision 1 resolved that blocker by defining the configured-reference-to-prior-identity binding, atomic fail-closed replacement update, binding-version recheck, deterministic multi-lock ordering, state leases, and stale state/lock retirement. Independent pass `v4l2-device-transaction-identity-pass-2` preserved those contracts, returned `revision_required` at score 24.5, required the bounded parent-coverage truthfulness correction, required no split, and created no new leaf. Revision 2 truthfully recorded the incomplete durable sibling evidence at that snapshot. Independent pass `v4l2-device-transaction-identity-pass-3` confirmed the sibling, paired test, and approving review record now exist; required only removal of the stale coverage/readiness blocker; preserved all accepted contracts; required no split; and created no new leaf. Revision 3 records current 100% durable coverage and an author rescore of 22.5 with zero readiness blockers. No architecture or evidence gap is reported. Independent approval is not claimed.
- Downstream dependency facts: `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` depends on this identity, adapter, error, transaction, lock, invalidation, reconnect, cancellation, and shared-fixture foundation. `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md` and the existing camera-control API candidates depend on the finalized shared provider contracts.
- Files changed:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
  - `project/specs/camera-controls/review-ledger/v4l2-device-transaction-and-identity-foundation-candidate.md`
  - `project/specs/camera-controls/review-ledger/v4l2-device-transaction-and-identity-foundation-revision-3.md`
- Review status: `awaiting_independent_review`; no independent review pass or approval is claimed by the author.
