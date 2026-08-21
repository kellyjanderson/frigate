# V4L2 Camera-Control Provider Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/architecture/acd/usb-v4l2-camera-controls.md`
Split provenance: `dispatch-280945bb-a158-48c8-94a3-a21695661b86` sizing result, V4L2 provider responsibility separated from ACD leaf 3
Canonical status: Split child
Review Score: 24.5
Prerequisites:
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines the V4L2 discovery, write, device-identity, concurrency, cache, and failure boundaries.
- `project/architecture/current-camera-runtime.md` - proves the configured Linux runtime has a stable C930e V4L2 device and successful control enumeration.

## Source Field Carryover

- Source purpose:
  - Implement ACD required specification leaf 2 as a reusable provider that discovers and changes controls reported by a configured Linux V4L2 camera.
- Source responsibilities by category:
  - Functions/methods: expose one descriptor/current-value read operation and one validated write/read-back operation.
  - Data structures/models: represent complete V4L2 control descriptors and provider failures with stable categories.
  - Dependencies/services: use trusted Frigate camera configuration and Linux V4L2 extended-control ioctls.
  - Returns/outputs/signals: return provider results containing descriptors or a categorized failure, without an HTTP response contract.
  - UI surfaces/components: not applicable.
  - UI fields/elements: not applicable.
  - Reusable code plan: add a reusable provider module and reuse `CameraConfig` plus its existing configuration-loading route.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: isolate blocking open/ioctl work from async callers and serialize operations per configured physical device.
  - Destructive/write behavior: validate an individual control write, apply it through the driver, and read it back.
  - Security/privacy-sensitive behavior: accept a device only from validated camera configuration and keep filesystem details out of caller-visible failure data.
  - Performance-sensitive behavior: cache descriptors by physical-device identity, refresh only on defined events, and bound each operation to one device.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - The chosen configuration default is an optional camera-level `v4l2_device` stable path. A camera without that field has no provider route.
  - Live driver state, not configuration or cache state, is authoritative for current values.
- Source split/provenance notes:
  - This candidate owns only ACD leaf 2. The authenticated camera-scoped HTTP API, its authorization, endpoint schemas, and OpenAPI artifact are owned by the sibling ACD leaf 3.

## Purpose

Provide a deterministic, reusable boundary for discovering, reading, validating, and writing the controls exposed by a configured Linux V4L2 camera. The provider supplies hardware-truth descriptors and read-back values to a downstream consumer without owning HTTP or UI behavior.

## Scope

Owns:

- Stable configured-device resolution, V4L2 descriptor discovery, sparse menu expansion, and current-value reads.
- Validated individual writes through the V4L2 extended-control API followed by authoritative read-back.
- Per-device serialization, async isolation, descriptor caching, disconnect invalidation, reconnect re-enumeration, and provider-level failure categories.
- Deterministic mocked-driver tests for discovery, reads, writes, caching, concurrency, and failures.

Does not own:

- HTTP endpoints, request or response DTOs, administrator or camera authorization, endpoint error mapping, or OpenAPI generation.
- Descriptor-driven UI, volatile polling cadence in the browser, capture restart orchestration, USB attachment, deployment, or physical-hardware acceptance.

## Split Coverage

- Parent spec: `none`; the source sizing result rejected the combined provider/API candidate before a parent candidate was written.
- Parent coverage status: not applicable.
- Parent responsibilities owned by this child:
  - ACD leaf 2: V4L2 discovery and write provider with mocked ioctl tests.
- Parent responsibilities still missing from children:
  - none within this assigned child responsibility; ACD leaf 3 is assigned to a sibling candidate.

## Refinement History

Not applicable before independent review. The assigned candidate record is `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-candidate.md`.

## Implementation Routing

- Primary modules/files:
  - `frigate/camera/v4l2_controls.py` - reusable async provider, V4L2 adapter seam, descriptor conversion, validation, locking, caching, and categorized failures.
  - `frigate/config/camera/camera.py` - optional camera-level `v4l2_device` configuration field.
- Supporting modules/files:
  - `frigate/config/camera/__init__.py` - export configuration symbols only if required by the established camera-config export pattern.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/camera/v4l2_controls.py` - expose `V4L2ControlProvider`, `V4L2ControlDescriptor`, and `V4L2ControlError` to the sibling API consumer.
- Tests:
  - `frigate/test/test_v4l2_controls.py` - deterministic unit and library-route tests using a mocked V4L2 adapter and temporary device identities.

## Chosen Defaults / Parameters

- `CameraConfig.v4l2_device` defaults to `None`; provider operations for that camera fail as `not_configured`.
- A configured device must be an absolute stable `/dev/v4l/by-id/` path or another absolute path whose resolved udev identity is stable. A bare `/dev/videoN` node is rejected as `unstable_device_identity`.
- Enumeration starts with `V4L2_CTRL_FLAG_NEXT_CTRL | V4L2_CTRL_FLAG_NEXT_COMPOUND`; `EINVAL` at the end of iteration is normal completion.
- Sparse menu indexes are queried across the descriptor's minimum-to-maximum range; unsupported indexes are skipped, while other query failures are categorized.
- Discovery and explicit refresh enumerate descriptors once and read current values with `VIDIOC_G_EXT_CTRLS`. Cache entries contain descriptor metadata only; current values are read from the driver for each caller operation.
- Supported writes are range, step, menu-membership, type, and effective-writability checked, passed through `VIDIOC_TRY_EXT_CTRLS` when the driver supports it, applied with `VIDIOC_S_EXT_CTRLS`, and reread with `VIDIOC_G_EXT_CTRLS`.
- Unknown, payload-bearing, compound, or array control writes fail as `unsupported_control_type` unless the provider explicitly implements the driver's complete value encoding. Their descriptors remain discoverable.

## Data Ownership

- Source of truth: the active V4L2 driver for descriptors, flags, and values; `CameraConfig.v4l2_device` for the permitted stable device identity.
- Read ownership: `V4L2ControlProvider` reads only the configured device through its injected V4L2 adapter.
- Write ownership: `V4L2ControlProvider` is the sole reusable write boundary; downstream consumers do not issue ioctls directly.
- Derived/cache data: descriptor metadata is recomputable from `VIDIOC_QUERY_EXT_CTRL` and `VIDIOC_QUERYMENU`; cache keys use configured stable identity plus the identity returned by `VIDIOC_QUERYCAP`.
- Privacy/logging constraints: caller-visible failures and normal logs include camera name, control serialized ID, and stable category only. Resolved filesystem paths and raw ioctl payload contents are restricted to debug diagnostics and are not returned to consumers.

## Dependencies And Routes

- Domain/service dependencies:
  - `CameraConfig` supplies the trusted optional stable device identity.
  - Linux V4L2 extended-control ioctls are accessed through an injectable adapter seam so tests never require camera hardware.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable.
- Background/concurrency route, if applicable:
  - Each public async operation resolves its configured identity, enters the lock keyed by that identity, and runs the complete blocking open/query/read or open/validate/write/read-back transaction with `asyncio.to_thread`. The lock covers cache mutation and closes the file descriptor before release. Cancellation does not expose a partial success; after a submitted thread completes, the next operation rereads driver state.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already defines the proposed provider boundary after architecture.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - validates stable Linux V4L2 identity and successful hardware control enumeration in the deployed runtime.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none for the provider library.
- Unimplemented prerequisite specifications:
  - none.
- Progression handling:
  - current item may proceed only after independent review accepts this candidate and its paired test specification.

## Application Integration

- App type: library-only.
- User/caller surface: authenticated camera-control API sibling described by ACD leaf 3.
- Invocation route: the consumer passes an existing validated `CameraConfig` to the provider read or write operation; it cannot pass a host path.
- Wiring owner/module: `frigate/camera/v4l2_controls.py` owns provider construction and behavior; the sibling API composition point owns lifecycle wiring.
- Observable result: a descriptor collection with live current values, a reread descriptor after a write, or a stable categorized provider failure.
- Integration validation: `frigate/test/test_v4l2_controls.py` invokes the public async provider methods through a mocked adapter while using a real `CameraConfig` fixture.
- Incomplete status risk: the provider is not user-accessible without its separately owned consumer, so provider completion requires the library-route proof and does not claim endpoint or UI completion.

App-type-specific proof:

- Library-only: the sibling camera-control API is the named downstream consumer; the paired test invokes the same public provider boundary that consumer must call.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `frigate/config/camera/camera.py::CameraConfig` - carry the configured device identity through the existing validated camera configuration lifecycle.
- Current reuse readiness:
  - add one optional field to the existing camera model and create one reusable provider module.
- Extraction/wrapping needed:
  - `frigate/camera/v4l2_controls.py` - wrap Linux file-descriptor and ioctl calls behind an injected adapter protocol for deterministic tests.
- Additions to existing library/modules:
  - `frigate/config/camera/camera.py` - add `v4l2_device: str | None` with validation delegated to provider resolution because udev state is runtime state.
- New reusable modules to expose:
  - `frigate/camera/v4l2_controls.py` - stable provider, descriptor, and categorized-error contract.
- One-off code justification, if any:
  - none.

## Required DTOs / Functions / Components

- DTOs/models:
  - `V4L2ControlDescriptor` - serialized and numeric IDs, display name, control class, V4L2 type, minimum, maximum, step, default, current value, sparse menu mapping, all reported flags, element size/count/dimensions, effective writable/active state, and supported-write state.
  - `V4L2ControlError` - typed exception containing one stable category (`not_configured`, `unstable_device_identity`, `device_disconnected`, `control_not_found`, `control_not_writable`, `invalid_value`, `unsupported_control_type`, `driver_rejected`, or `device_io`) plus a caller-safe message; the private cause is retained only for diagnostics.
- Functions/methods:
  - `V4L2ControlProvider.get_controls(camera_config, *, refresh=False) -> tuple[V4L2ControlDescriptor, ...]` - resolve and validate the configured stable identity, enumerate or reuse descriptor metadata, and read live current values.
  - `V4L2ControlProvider.set_control(camera_config, serialized_id, value) -> V4L2ControlDescriptor` - resolve the same device, validate one writable control, apply it, reread it, and return the resulting descriptor.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Enumeration is O(reported controls plus each menu descriptor's declared index span) and occurs on the first access, explicit refresh, identity change, or reconnect, never per video frame.
- Each operation opens only the resolved device, performs a bounded sequence of ioctls, and closes it. Provider work does not run in capture workers or on the async event loop.
- Locks and descriptor caches are per configured physical-device identity, so separate cameras do not block one another. A disconnect or identity mismatch evicts that device's cache immediately.

## Error And State Behavior

- No configured device produces `not_configured`; a volatile node or identity mismatch produces `unstable_device_identity`.
- Open failures indicating removal and ioctl disconnect failures produce `device_disconnected` and evict cached descriptors and identity. The next call resolves the stable path, validates `VIDIOC_QUERYCAP` identity, and performs fresh enumeration before returning values.
- Disabled, inactive, read-only, or grabbed controls remain in discovery results with derived writable/active state and reject writes as `control_not_writable`.
- Sparse menu holes do not fail discovery. Unknown types remain inspectable but reject writes as `unsupported_control_type`.
- Validation failures do not call `VIDIOC_S_EXT_CTRLS`. Driver validation/application failures are `driver_rejected`; other ioctl failures are `device_io`.
- A successful set always returns the post-write driver value. Cache state is never used as proof that a write succeeded or persisted.

## Test Strategy

- Unit tests:
  - Mock query iteration, sparse menus, every carried descriptor field and flag, live current-value reads, serialized ID stability, validation, try/set/get ordering, driver clamping, coupled-value read-back, unsupported types, failure categories, and path redaction.
  - Drive concurrent async calls against one identity and two identities to prove same-device serialization and cross-device independence. Assert ioctl bodies run on a worker thread.
  - Simulate disconnect after cached discovery, identity replacement, and reconnect to prove eviction and fresh enumeration.
- Service/DB tests:
  - not applicable.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Construct a real `CameraConfig` fixture and invoke both public async provider methods through the injected mocked adapter. Do not invoke private helpers as the route proof.
- Production-data rule:
  - Tests use mocked driver behavior and temporary identities and do not require the user's production configuration, devices, or database.

## Acceptance Criteria

- A configured stable device returns descriptors containing every ACD-required metadata field, sparse menu labels, derived active/writable state, and current values read from the driver.
- A valid write executes validation, set, and read-back under one per-device lock and returns the driver's resulting value; invalid or non-writable input never reaches the set ioctl.
- Blocking open/ioctl work executes outside the async event loop; operations for one device serialize while operations for distinct devices can proceed independently.
- Disconnect or identity mismatch evicts cached metadata, and the first successful reconnect access validates identity and re-enumerates before returning results.
- All provider failures use the specified stable categories, and caller-visible error content does not expose resolved filesystem paths or raw ioctl payloads.
- Deterministic tests prove the public library route without physical hardware or production data.

## Readiness Checklist

- [x] Primary ancestor and architecture ancestor are explicit.
- [x] Review Score appears in the front matter and exactly matches the total in the final Review Score Calculation section.
- [x] The current implementation-spec template was loaded and its source path is recorded in the final Review Score Calculation section.
- [x] Review Score is adversarially recounted from the current spec text; prior scores are challenged instead of trusted.
- [x] Unresolved deferral/gap markers such as future spec, blocker, to be defined/TBD, not done, incomplete, unfinished, deferred, or later are either absent/resolved or counted as 100-point scoring events.
- [x] Source fields are carried into spec sections or preserved as explicit provenance/history.
- [x] Canonical status is explicit.
- [x] Prerequisites are linked, implemented, or marked not applicable.
- [x] Missing or stale prerequisite architecture discovered after the architecting phase has an ACD link, or is marked not applicable.
- [x] Missing prerequisite behavior has a final spec link, or is marked not applicable.
- [x] Split coverage is complete, or marked not applicable.
- [x] Per-request review ledger records the latest new-leaf list for the review round, or is marked not applicable before review.
- [x] Implementation owner/module is named.
- [x] Existing code reuse/extraction decision is explicit.
- [x] Existing library/module additions or new reusable module boundaries are named, or marked not applicable.
- [x] UI fields/elements are listed, or marked not applicable.
- [x] Chosen defaults are explicit.
- [x] Data source of truth and write owner are explicit.
- [x] GUI/concurrency route is explicit, or marked not applicable.
- [x] App type and application integration route are explicit.
- [x] Integrated route validation is named.
- [x] GUI/console/API-service/mixed/library-only proof matches the app type.
- [x] Performance bounds are explicit, or marked not applicable.
- [x] Privacy/logging constraints are explicit, or marked not applicable.
- [x] Test strategy does not depend on production data.
- [x] Acceptance criteria are testable.

## Review Score Calculation

- Template source: `../.agents/process/templates/implementation-spec-template.md` (SHA-256 `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`)
- Prior recorded score: 27 for the rejected combined provider/API body; adversarial input, not trusted.
- Adversarial rescore basis: recounted every category from this provider-only text. Device resolution is part of both public provider operations rather than a third public API, the single provider result contract covers successful descriptors and categorized failures, and HTTP/auth/OpenAPI/UI responsibilities are excluded. Configuration addition, driver dependency, write effects, path safety, async isolation, cache bounds, and the reusable module remain counted.
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
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 24.5
- If total matches prior score, adversarial survival reason: not applicable; this provider-only recount is lower than the rejected combined-body score.
