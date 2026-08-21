# V4L2 Camera-Control Provider Foundation Independent Review Pass 1

Date: 2026-08-19
Pass identifier: `v4l2-provider-foundation-pass-1`
Result: `split_required`

## Candidate And Artifacts Reread

- Candidate: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/v4l2-camera-control-provider-foundation.test-spec.md`
- Candidate provenance record: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-candidate.md`
- Direct parent, read only for inherited responsibility and coverage: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
- Parent split record, read only for lineage and coverage: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-review-pass-1.md`
- Direct sibling, read only for ownership and coverage: `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`
- Architecture anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`

## Pinned Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b` (verified)
- Scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a` (verified)

## Independent Review Score

The author's 24.5 score was treated as untrusted. The fresh recount found five explicit data structures or models, not four: `_ResolvedV4L2Device`, `V4L2MenuItem`, `V4L2ControlDescriptor`, `V4L2ControlError`, and the injected `V4L2Adapter` interface/seam that the scope, dependency route, tests, and candidate provenance all require. The remaining category counts survive adversarial checks. In particular, the provider class is represented by its two public methods rather than counted again as a model, and the transaction lock, thread isolation, and cancellation behavior are one cohesive async/concurrency boundary.

- Functions/methods: 2 x 2 = 4
- Data structures/models: 5 x 1 = 5
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 2 x 1 = 2
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 1 x 0.5 = 0.5
- Adding code to an existing library/module: 1 x 1 = 1
- Creating a new reusable library/module: 1 x 3 = 3
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **25.5**

The score is at or above the pinned policy's forced-split threshold of 25.

## Exact Split Plan

### Proposed child 1: V4L2 device transaction and identity foundation

Proposed specification path: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`

Owns exactly:

- `CameraConfig.v4l2_device`, its `None` default, stable configured-reference validation, udev and `VIDIOC_QUERYCAP` identity resolution, rejection of bare volatile nodes, and replacement detection.
- `_ResolvedV4L2Device`, the injected `V4L2Adapter` contract, and `V4L2ControlError` with the shared categorized, caller-safe failure boundary.
- The reusable module's physical-device transaction substrate: open and close lifetime, per-identity lock selection, complete blocking transaction submission outside the event loop, cache identity namespace, disconnect invalidation, reconnect identity validation, and cancellation recovery.
- Privacy behavior for resolved paths, raw ioctl structures, payloads, errno text, and permitted diagnostic fields.

Paired verification ownership:

- Proposed test-spec path: `project/specs/camera-controls/tests/v4l2-device-transaction-and-identity-foundation.test-spec.md`.
- Real `CameraConfig` fixture coverage for absent, stable, volatile, disconnected, and mismatched identities.
- Deterministic adapter tests for open and close lifetime, categorized safe failures, same-device serialization, distinct-device concurrency, off-event-loop execution, disconnect invalidation, matching reconnect, replacement rejection, cancellation after submission, and completion of the in-flight transaction before the device lock can be reused.
- Ownership of the reusable mocked adapter's identity, file-descriptor, thread, overlap, and injected-failure facilities.

### Proposed child 2: V4L2 descriptor discovery and live-read provider

Proposed specification path: `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`

Owns exactly:

- `V4L2MenuItem` and `V4L2ControlDescriptor`, including stable serialized IDs, complete metadata and flags, sparse ordinary and integer menus, dimensions, and derived active, writable, and read-support state.
- `V4L2ControlProvider.get_controls`, descriptor enumeration with both next flags, terminal and sparse `EINVAL` handling, descriptor conversion, grouped full live-value reads, explicit refresh, and descriptor metadata caching keyed by child 1's validated physical identity.
- `V4L2ControlProvider.get_control_values`, the 1 through 64 unique-ID contract, order preservation, descriptor resolution, one bounded extended-control read, and read-specific error use.
- Unknown, payload-bearing, compound, and array descriptor inspection; lossless current-value representation; cache reuse; reconnect re-enumeration; and the stated read and enumeration performance bounds.

Paired verification ownership:

- Proposed test-spec path: `project/specs/camera-controls/tests/v4l2-descriptor-discovery-and-live-read-provider.test-spec.md`.
- Public-route tests through `get_controls` and `get_control_values` using child 1's real validated configuration and injected adapter boundary.
- Enumeration, terminal and sparse `EINVAL`, all descriptor fields and flags, ordinary and integer menus, stable IDs, full and bounded ordered reads, invalid collections, missing controls, unsupported value representations, cache reuse, refresh, reconnect re-enumeration, read failure redaction, and bounded-call assertions.
- Ownership of the mocked adapter's query, menu, descriptor, value-read, and call-recording facilities, extending rather than duplicating child 1's shared fixture.

### Parent Coverage And Dependencies

- Planned coverage of this candidate: **100%**. Every implementation and paired-verification responsibility is assigned to exactly one proposed child.
- Uncovered candidate responsibilities: `none`.
- Inter-child dependency: child 2 depends on child 1's implemented configuration field, resolved identity, adapter, error, physical-device transaction and lock, invalidation, reconnect, cancellation, and fixture contracts.
- Shared authoritative contracts: child 1 owns `frigate/camera/v4l2_controls.py` as the initial reusable module boundary, `V4L2Adapter`, `_ResolvedV4L2Device`, `V4L2ControlError`, stable failure categories, and transaction and identity behavior. Child 2 extends that module with `V4L2ControlProvider`, `V4L2MenuItem`, `V4L2ControlDescriptor`, descriptor cache behavior, and the two public read methods.
- Existing validated-write sibling dependency: `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md` depends on both proposed children and retains exclusive ownership of validation, try/set ioctls, physical mutation, and write read-back.
- Existing API dependency: the camera-control API depends on child 2's finalized public descriptor and bounded-value read contract.
- Grandparent coverage: the two proposed children preserve all foundation/read ownership, while the existing validated-write sibling preserves write ownership. Coverage of `project/specs/camera-controls/v4l2-camera-control-provider.spec.md` remains 100% with no overlap in physical-write responsibility.

## Findings And Gates

- Finding: the author score omitted the explicitly required injected `V4L2Adapter` interface/seam from data structures/models.
- Split fact: the independently recalculated score is 25.5, so the pinned policy requires a split.
- New-leaf definitions: the two proposed children above; no child artifacts were created in this pass.
- Parent coverage: 100% planned coverage, with no uncovered implementation or paired-test responsibility.
- Revision facts: the two new child specifications and corresponding paired test specifications do not yet exist; the current candidate remains a split parent definition rather than a final leaf.
- Architecture gap: `none`; the ACD defines trusted device access, V4L2 discovery and reads, concurrency, cache invalidation, failure privacy, and performance boundaries sufficiently for this split.
- Evidence gap: `none`; deterministic implementation verification does not require physical hardware, and the runtime anchor supplies the bounded current-device evidence claimed by the candidate.
- Readiness gate: forced split unresolved; no separate readiness blocker was counted.
- Dependency gate: descriptor/read work depends on the device transaction and identity contract; the existing write sibling and API depend on the finalized shared provider contracts.
