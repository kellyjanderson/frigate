# V4L2 Camera-Control Provider Independent Review Pass 1

Date: 2026-08-19
Pass identifier: `v4l2-control-provider-pass-1`
Result: `split_required`

## Candidate And Artifacts Reread

- Candidate: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/v4l2-camera-control-provider.test-spec.md`
- Candidate provenance record: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-candidate.md`
- Architecture anchors:
  - `project/architecture/acd/usb-v4l2-camera-controls.md`
  - `project/architecture/current-camera-runtime.md`
- Direct sibling read for shared-contract and ownership coverage only:
  - `project/specs/camera-controls/authenticated-camera-control-api.spec.md`

## Pinned Authorities

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b` (verified)
- Scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a` (verified)

## Independent Review Score

The author's 24.5 score was treated as untrusted. Its category recount survives for the responsibilities actually stated in this candidate, but the recount omitted one readiness blocker: the named library consumer and provider candidate do not define the same shared module or callable contract. The provider names `frigate/camera/v4l2_controls.py` with `get_controls` and `set_control`; the API sibling requires `frigate/camera_control/provider.py` with `describe`, bounded `read_values`, and `write`. The paired provider test specification repeats the two-method contract and therefore does not close this route mismatch.

- Functions/methods: 2 x 2 = 4
- Data structures/models: 2 x 1 = 2
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 1 x 1 = 1
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 1 x 0.5 = 0.5
- Adding code to an existing library/module: 1 x 1 = 1
- Creating a new reusable library/module: 1 x 3 = 3
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 1 x 3 = 3
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 1 x 2 = 2
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **26.5**

The score is at or above the policy's forced-split threshold of 25.

## Exact Split Plan

### Proposed child 1: V4L2 device, descriptor, and read provider foundation

Owns exactly:

- The optional `CameraConfig.v4l2_device` field, stable-path and `VIDIOC_QUERYCAP` identity resolution, and rejection of volatile or mismatched identities.
- The injected Linux V4L2 adapter seam, `V4L2ControlDescriptor`, `V4L2ControlError`, stable failure categories, and caller-safe path/payload redaction.
- Provider construction and the authoritative shared module and callable naming contract consumed by other children and the API sibling.
- Descriptor enumeration with `VIDIOC_QUERY_EXT_CTRL`, sparse `VIDIOC_QUERYMENU` expansion, complete descriptor conversion, and live current-value reads.
- Descriptor caching, explicit refresh, identity-change and disconnect eviction, reconnect re-enumeration, per-device transaction locking, worker-thread offload, file-descriptor lifetime, and next-call reread after cancellation.
- The public discovery/read operations, including any bounded current-value read operation required by the API sibling.

Paired verification ownership:

- Real `CameraConfig` route proof for all public discovery/read operations.
- Enumeration, sparse menus, descriptor fields, current values, stable IDs, device identity, cache/refresh/reconnect, safe failures, same-device serialization, cross-device independence, cancellation recovery, and off-event-loop adapter execution.
- The reusable mocked adapter, temporary identity fixtures, and synchronization gates shared with child 2.

### Proposed child 2: V4L2 validated write and read-back provider

Owns exactly:

- The public individual-write operation added to the shared provider contract from child 1.
- Effective-writability, type, range, step, menu-membership, button, string, bitmask, payload, compound, and array validation.
- `VIDIOC_TRY_EXT_CTRLS` support detection and use, `VIDIOC_S_EXT_CTRLS`, authoritative `VIDIOC_G_EXT_CTRLS` read-back, driver clamping/coupled-value behavior, and write-specific categorized failures.
- Write transaction use of child 1's per-device lock, device resolution, adapter, descriptor/cache contracts, error redaction, disconnect eviction, and cancellation recovery.

Paired verification ownership:

- Real `CameraConfig` route proof for the public write operation.
- Validation rejection without a set call; try/set/get ordering; read-back, clamping, and coupled changes; unsupported writes; write-time disconnect and cache eviction; cancellation without partial-success reporting; and capture-safe optional manual smoke with original-value restoration.

### Parent coverage and dependencies

- Planned coverage of the current candidate: **100%**. Every provider responsibility and paired-test responsibility is assigned to exactly one proposed child above.
- Uncovered parent responsibilities: `none`.
- Inter-child dependency: child 2 depends on child 1's implemented shared module, DTO/error types, adapter, device transaction/lock boundary, cache lifecycle, and public naming contract.
- Shared authoritative contracts: child 1 owns the module path, provider class/protocol, descriptor/error types, stable failure categories, camera-config device identity, adapter protocol, and transaction/lock boundary. Child 2 extends only the write method and its write-specific behavior.
- External ownership remains excluded: HTTP routing, authorization, endpoint schemas/error mapping, and OpenAPI generation remain with the API sibling.

## Findings And Gates

- Revision fact: the provider candidate, provider test specification, and direct API sibling must use one exact module path and callable contract. The current API sibling additionally requires a bounded current-value read operation absent from the provider candidate's required functions.
- Split fact: the independent score is 26.5, so the pinned scoring policy requires a split.
- Parent coverage: the proposed two-child allocation is 100% complete with no uncovered candidate responsibility.
- Architecture gap: `none`; the ACD defines the provider boundary, device trust, ioctl family, concurrency, cache, failure, and read-back rules sufficiently.
- Evidence gap: `none`; hardware evidence is not required for the deterministic provider implementation contract, and the current runtime anchor proves the configured Linux V4L2 route.
- Readiness gate: blocked by the forced split and shared provider/API contract mismatch.
- Dependency gate: the write child depends on the read/foundation child's shared contracts; the API sibling depends on the finalized provider contract.
- New leaves: the two proposed children above; no child artifacts were created in this pass.
