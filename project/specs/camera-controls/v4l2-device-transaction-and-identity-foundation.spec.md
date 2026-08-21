# V4L2 Device Transaction And Identity Foundation Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`
Split provenance: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`, child 1 from independent review pass `v4l2-provider-foundation-pass-1`
Canonical status: Split child
Review Score: 22.5
Prerequisites:
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines trusted configured-device access, stable physical identity, per-device serialization, disconnect invalidation, reconnect validation, async isolation, and safe failure behavior.
- `project/architecture/current-camera-runtime.md` - proves the deployed Linux runtime exposes the configured C930e through a stable V4L2 by-id reference.

## Source Field Carryover

- Source purpose:
  - Establish the authoritative shared module and low-level foundation that resolves a configured camera to the same physical V4L2 device across node changes and runs one safe serialized blocking transaction for downstream descriptor, read, and write providers.
- Source responsibilities by category:
  - Functions/methods: expose one generic async device-transaction executor operation used by downstream provider operations.
  - Data structures/models: define resolved physical identity, the injected adapter seam, categorized caller-safe failures, per-identity transaction/cache state, and the authoritative configured-reference identity registry.
  - Dependencies/services: use validated `CameraConfig` data and Linux udev/V4L2 capability identity through the injected adapter.
  - Returns/outputs/signals: return the downstream operation's typed result only after the blocking transaction and close complete, or raise one stable categorized failure.
  - UI surfaces/components: not applicable.
  - UI fields/elements: not applicable.
  - Reusable code plan: add `CameraConfig.v4l2_device` to the existing camera model and create `frigate/camera/v4l2_controls.py` as the authoritative shared provider module.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: resolve and validate identity off the event loop, select a lock by physical identity, keep the complete open/operation/close sequence serialized per device, and retain the lock until submitted worker work finishes after cancellation.
  - Destructive/write behavior: not applicable; this child issues no control-value read, try, set, or mutation request.
  - Security/privacy-sensitive behavior: accept only the configured device reference and redact resolved paths, raw ioctl structures or payloads, and raw errno text from caller-visible errors and normal logs.
  - Performance-sensitive behavior: maintain one lock/state namespace per physical identity, avoid global device serialization, and perform no polling or per-frame work.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - `V4L2Adapter` is an injected interface/seam and is counted as a data structure/model, as established by independent review pass `v4l2-provider-foundation-pass-1`.
  - The physical-identity key, not a transient `/dev/videoN` node or caller name, is authoritative for lock and cache-state selection.
  - Independent review pass `v4l2-device-transaction-identity-pass-1` required this revision to define the configured-reference-to-prior-identity binding, atomic replacement handling, lock ordering, and stale state retirement. Those contracts are now explicit in `_V4L2IdentityRegistry`; the pass remains historical evidence and this revision does not claim approval.
- Source split/provenance notes:
  - Independent review freshly scored the parent foundation/read candidate at 25.5 and required this split. This child owns only configured-device identity, adapter/error primitives, transaction lifetime, lock/cache substrate, disconnect/reconnect invalidation, cancellation recovery, privacy, and their deterministic fixtures. The reviewer-defined sibling `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` owns descriptors, menus, public provider read methods, enumeration, live reads, and descriptor metadata behavior. The recorded split plan assigns 100% of parent responsibilities with none uncovered. The pass-2 artifact-absence snapshot is retained only as historical provenance: the sibling candidate, paired test, and approving pass-1 review record now exist, so current durable parent coverage is 100% and this candidate's owned responsibility coverage is complete.

## Purpose

Provide a reusable, deterministic Linux V4L2 device boundary that converts one trusted camera configuration into a validated physical-device identity and safely runs downstream provider work under the correct per-device lock. This leaf creates no descriptors, reads no control values, and performs no physical control writes.

## Scope

Owns:

- `CameraConfig.v4l2_device`, stable configured-reference validation, udev and `VIDIOC_QUERYCAP` identity resolution, transient-node rejection, and replacement detection.
- The initial `frigate/camera/v4l2_controls.py` module with `_ResolvedV4L2Device`, `V4L2Adapter`, `V4L2ControlError`, `_V4L2DeviceState`, `_V4L2IdentityRegistry`, and one generic async transaction executor.
- Per-physical-device lock ownership, open/close lifetime, complete blocking worker submission, cancellation recovery, disconnect invalidation, matching reconnect validation, and deterministic foundation tests and fixtures.

Does not own:

- `V4L2MenuItem`, `V4L2ControlDescriptor`, `V4L2ControlProvider`, descriptor or menu enumeration, current-value reads, descriptor metadata caching policy, or the public `get_controls` and `get_control_values` operations assigned to `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md`.
- Value validation, `VIDIOC_TRY_EXT_CTRLS`, `VIDIOC_S_EXT_CTRLS`, physical mutation, mandatory write read-back, or write-result construction assigned to `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`.
- HTTP routes, authorization, wire schemas, OpenAPI generation, generated UI, USB attachment, capture restart policy, deployment, or physical-hardware acceptance.

## Split Coverage

- Parent spec: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
- Parent coverage status: 100% covered. `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md` assigns every parent implementation and paired-test responsibility exactly once. The descriptor-discovery/live-read sibling, its paired test, and approving review record now exist, and this candidate's owned responsibility coverage is complete.
- Parent responsibilities owned by this child:
  - Authoritative shared module location; optional configured-device reference; stable udev/capability identity; adapter and safe-error contracts; physical-device lock, transaction, file-descriptor lifetime, cache-state namespace, invalidation, reconnect, cancellation, privacy, and foundation fixtures/tests.
- Parent responsibilities still missing from children:
  - none. The descriptor/read sibling durably covers descriptor/menu models, enumeration, live reads, public read provider methods, descriptor-cache content, and paired verification; no responsibility is uncovered or duplicated.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/v4l2-device-transaction-and-identity-foundation-review-pass-3.md` | 3 | this candidate, paired test specification, and current sibling coverage evidence | none | continue; bounded stale-truthfulness revision completed for independent rereview |

## Implementation Routing

- Primary modules/files:
  - `frigate/camera/v4l2_controls.py` - authoritative shared module, adapter and error contracts, stable identity resolution, configured-reference and per-device state/lock registries, and generic async transaction executor.
  - `frigate/config/camera/camera.py` - optional camera-level `v4l2_device` configuration field.
- Supporting modules/files:
  - `frigate/config/camera/__init__.py` - rely on the existing wildcard export of `CameraConfig`; no new export module is required.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/camera/v4l2_controls.py` - expose the adapter, categorized error, and transaction executor boundary consumed within this module by descriptor/read and write provider children.
- Tests:
  - `frigate/test/test_v4l2_controls.py` - deterministic identity, lifetime, concurrency, invalidation, cancellation, and redaction tests with real `CameraConfig` fixtures and an injected adapter.

## Chosen Defaults / Parameters

- `CameraConfig.v4l2_device: str | None` defaults to `None`; a transaction for a camera without the field raises category `not_configured` before adapter device access.
- A configured reference must be absolute and stable. `/dev/v4l/by-id/` references are accepted for runtime validation; a different absolute reference is accepted only when the adapter obtains stable udev `ID_SERIAL` and `ID_PATH` identity for it. A bare `/dev/videoN` node always raises `unstable_device_identity`.
- The physical-identity key combines udev serial and physical path with `VIDIOC_QUERYCAP` bus, driver, and card identity. The resolved node is not part of the key, so node-number changes retain the same device namespace; capability or udev identity changes are replacement events.
- The executor retains one process-lifetime binding from the SHA-256 digest of each accepted configured reference to its first validated physical-identity key. The digest is computed from the exact validated configured string, is safe for registry keys and diagnostics, and is never reversible to a host path. A matching reconnect or node renumbering preserves that binding. A different identity never silently replaces it during the executor lifetime.
- Resolution is two-stage: an off-event-loop adapter resolution obtains the candidate stable identity used to select the lock, then the blocking transaction opens the resolved node and repeats udev/capability validation under that lock before invoking downstream work.
- Registry selection uses a short-lived registry mutex only to snapshot or atomically mutate bindings, state leases, and binding versions. It never waits for a device lock while holding the registry mutex. The executor leases the prior-bound and candidate state entries under the mutex, acquires their distinct device locks in ascending physical-identity-digest order, then reacquires the registry mutex to confirm that the binding version is unchanged. A changed snapshot is released and retried before open or downstream work.
- On first validation, the registry atomically binds the configured-reference digest to the candidate identity while that candidate state is locked. On a mismatch, it atomically increments and clears the prior-bound state's generation/cache, records the rejected candidate digest against the unchanged prior binding, and marks any unbound candidate state stale; the transaction then raises `unstable_device_identity` without downstream work. Keeping the prior binding unchanged makes every repeated replacement attempt fail closed until a matching physical identity returns or the executor process is recreated from freshly validated configuration.
- State leases cover lock acquisition, open/revalidation/operation/close, cancellation recovery, and registry cleanup. After device-lock release, lease counts are decremented under the registry mutex. A stale state and its lock are retired only when its lease count is zero, its cache is empty, and no configured-reference binding points to its physical key. A prior-bound invalidated state is retained because it is authoritative for matching reconnect and replacement rejection; an unbound rejected-candidate state is retired after its final concurrent lease. No lock object can be replaced while a waiter or transaction still holds a lease.
- The transaction owns exactly one opened file descriptor. It closes in a worker-side `finally` block before the per-device lock is released.
- Disconnect, replacement, or cancellation after worker submission increments the device-state generation and clears all payload-agnostic cache slots for that physical identity. A matching reconnect reuses the identity namespace only after fresh validation.
- The executor performs no implicit retry. A caller decides whether to start a new operation after a categorized failure.

## Data Ownership

- Source of truth: `CameraConfig.v4l2_device` owns the permitted configured reference; current udev metadata and `VIDIOC_QUERYCAP` own the physical identity and capability truth for each transaction.
- Read ownership: the transaction executor may inspect only the configured reference through the injected adapter. Downstream operations receive the validated open-device transaction context and do not resolve or open paths themselves.
- Write ownership: this child writes no camera control. Its only state changes are in-memory lock/cache generation and invalidation metadata.
- Derived/cache data: `_V4L2IdentityRegistry` owns configured-reference-digest bindings and one leased `_V4L2DeviceState` per observed physical-identity key. Each state contains its lock, generation, payload-agnostic cache slots, and retirement metadata. Bindings and states can be reconstructed from configuration and fresh device validation after process restart; current control values are never stored by this leaf.
- Privacy/logging constraints: caller-visible errors and normal logs may contain camera name, operation name, stable category, and non-sensitive physical identity digest. They must not contain configured or resolved paths, udev record dumps, raw capability/ioctl structures, payload contents, raw errno text, or submitted control values.

## Dependencies And Routes

- Domain/service dependencies:
  - `frigate/config/camera/camera.py::CameraConfig` supplies the trusted optional configured reference through Frigate's existing validated configuration lifecycle.
  - Linux udev identity, file-descriptor open/close, and `VIDIOC_QUERYCAP` behavior are accessed only through injected `V4L2Adapter`; its contract also provides the open-descriptor ioctl extension seam used by the downstream provider children.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable.
- Background/concurrency route, if applicable:
  - `V4L2DeviceTransactionExecutor.run` validates configuration, resolves the candidate identity with worker-thread adapter work, leases the prior-bound and candidate states through `_V4L2IdentityRegistry`, acquires their distinct `asyncio.Lock` instances in ascending identity-digest order, verifies the binding snapshot, and submits one complete blocking open/revalidate/operation/close callable with `asyncio.to_thread`. The registry mutex is never held while awaiting a device lock, so unrelated identities can progress independently. Same-identity transactions and replacement decisions cannot overlap. If the awaiting task is cancelled after submission, the executor shields and awaits worker completion while retaining the device lock and state lease, invalidates that identity's cache state, then re-raises cancellation without a success result.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already records trusted configuration, stable identity, serialized access, disconnect/reconnect, async isolation, cache invalidation, and safe-error boundaries.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - validates the deployed stable Linux V4L2 route and current by-id identity.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - none for this foundation leaf.
- Progression handling:
  - this candidate remains `awaiting_independent_review` and must not be represented as implementation-ready.

## Application Integration

- App type: library-only.
- User/caller surface: `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` and the existing validated-write/read-back provider candidate inside `frigate/camera/v4l2_controls.py`.
- Invocation route: a downstream provider operation passes an existing validated `CameraConfig` and a synchronous device callback to `V4L2DeviceTransactionExecutor.run`; it cannot pass or replace a host path.
- Wiring owner/module: `frigate/camera/v4l2_controls.py` owns adapter injection, transaction-executor construction, per-device state, and the open-device callback boundary.
- Observable result: the callback's typed result after validated device work and close, or a stable categorized `V4L2ControlError`; adapter traces prove correct identity, lifetime, serialization, and worker-thread execution.
- Integration validation: `frigate/test/test_v4l2_controls.py` invokes the public transaction executor with real `CameraConfig` fixtures and a deterministic injected adapter, not private identity helpers alone.
- Incomplete status risk: designed; this library leaf requires its public-route tests and does not claim descriptor/read, write, API, or UI integration.

App-type-specific proof:

- Library-only: the named descriptor/read and write provider consumers use the exact executor, adapter, resolved-identity, state, and error boundary; tests call `V4L2DeviceTransactionExecutor.run` through those same injected contracts.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `frigate/config/camera/camera.py::CameraConfig` - carry the configured reference through the established camera configuration lifecycle.
- Current reuse readiness:
  - add one optional field to the existing camera model and create one reusable provider module.
- Extraction/wrapping needed:
  - `frigate/camera/v4l2_controls.py` - wrap udev lookup, Linux file-descriptor lifetime, `VIDIOC_QUERYCAP`, and downstream ioctl access behind an injected adapter and transaction executor.
- Additions to existing library/modules:
  - `frigate/config/camera/camera.py` - add `v4l2_device: str | None`; runtime stability and capability validation remain transaction-foundation responsibilities.
- New reusable modules to expose:
  - `frigate/camera/v4l2_controls.py` - stable device identity, adapter, categorized error, transaction, lock, invalidation, and cancellation foundation for all V4L2 control operations.
- One-off code justification, if any:
  - none.

## Required DTOs / Functions / Components

- DTOs/models:
  - `_ResolvedV4L2Device` - immutable configured-reference digest, current opened node, udev serial/path identity, `VIDIOC_QUERYCAP` bus/driver/card/capability identity, and derived physical-identity key used for replacement checks and state selection. Raw paths remain internal.
  - `V4L2Adapter` - injected interface/seam for stable-reference resolution, udev identity, open, capability query, generic open-descriptor ioctl extension, and close behavior; production code supplies Linux behavior and tests supply a deterministic traceable fake.
  - `V4L2ControlError` - typed exception with stable category (`not_configured`, `unstable_device_identity`, `device_disconnected`, or `device_io`) and caller-safe message; private diagnostic cause/context may be retained without crossing the public or normal-log boundary.
  - `_V4L2DeviceState` - internal per-physical-identity `asyncio.Lock`, monotonically increasing generation, cancellation/revalidation marker, and payload-agnostic cache slots that downstream module code may populate and that foundation failures invalidate atomically under the lock.
  - `_V4L2IdentityRegistry` - executor-owned registry mutex, configured-reference-digest to accepted physical-key bindings with binding versions and rejected-candidate diagnostics, and physical-key to leased `_V4L2DeviceState` entries. It implements snapshot/recheck, sorted multi-lock ordering, atomic replacement invalidation without rebinding, and retirement only after the final lease and binding are absent.
- Functions/methods:
  - `V4L2DeviceTransactionExecutor.run(camera_config, operation) -> T` - resolve candidate identity off-loop, serialize by physical identity, open and revalidate the device, invoke one synchronous downstream operation against the adapter and validated open device in the same worker submission, close before lock release, and return only after completion; categorized failure and cancellation rules apply to the whole transaction.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Identity resolution and capability validation occur once per requested provider transaction, never per video frame and never in a polling loop owned by this leaf.
- State and locks are keyed by physical identity, so unrelated cameras do not share a global lock. A disconnected or replaced identity cannot leave valid cache payloads behind.
- Registry critical sections perform bounded in-memory map and lease updates only. The registry mutex is released before any device-lock wait or adapter I/O. Retained bindings/states are bounded by distinct configured references accepted during the executor process lifetime; rejected unbound candidate states are retired after their final lease.
- Each accepted operation performs one open, one under-lock identity/capability validation, the downstream bounded operation, and one close. The foundation adds no enumeration loop, control-value loop, retry, or database access.

## Error And State Behavior

- Missing configuration raises `not_configured`; a relative reference, bare volatile node, or reference without stable udev identity raises `unstable_device_identity` before downstream ioctl work.
- A missing target or removal during open, capability validation, operation, or close raises `device_disconnected`, invalidates state, and emits no successful result. Other adapter failures map to `device_io` with redacted caller text.
- A stable reference that resolves to different udev or capability identity is a replacement. Under the sorted prior/candidate locks and registry mutex, it raises `unstable_device_identity`, invalidates the previous identity state, records but does not accept the candidate, and leaves the prior binding authoritative. No downstream operation runs against it, and repeated attempts with that replacement continue to fail closed.
- A matching reconnect passes fresh udev and capability validation, uses a fresh generation, and allows the next downstream operation to reconstruct its own cache content from live driver state.
- Cancellation before worker submission performs no device work. Cancellation after submission retains the per-device lock until the worker closes the device, invalidates cache state, re-raises cancellation, and cannot return the worker's result.
- Normal completion closes the descriptor before lock release. Close failure maps to `device_io` unless removal makes `device_disconnected` more specific; no success is emitted when close/lifetime integrity is uncertain.

## Test Strategy

- Unit tests:
  - Build real minimal `CameraConfig` instances for absent, stable by-id, stable alternate absolute, relative, bare volatile, disconnected, matching reconnect, and identity-replacement references.
  - Use a deterministic `V4L2Adapter` fake to assert udev/capability identity composition, candidate and under-lock revalidation, one open/close lifetime, categorized failures, and redaction of paths, udev dumps, raw ioctl structures/payloads, errno text, and submitted values.
  - Use synchronization gates to prove same-identity operations cannot overlap, aliases resolving to the same physical identity share a lock, distinct identities can overlap, adapter work executes off the event-loop thread, and close occurs before lock reuse.
  - Race matching reconnect and replacement candidates for one configured-reference digest; assert binding-version recheck and ascending multi-lock order prevent deadlock, the prior binding changes neither partially nor silently, and no replacement callback executes.
  - Prove registry lifetime rules: a prior-bound invalidated state/lock remains stable for matching reconnect, a rejected unbound candidate state remains present while any concurrent lease or waiter exists, and it is retired only after the final lease with empty cache and no binding.
  - Cancel after worker submission and prove the executor waits for in-flight completion under the lock, emits no result, invalidates state, performs no duplicate operation, and requires fresh identity validation on the next call.
  - Simulate removal at resolution, open, capability query, callback, and close; then restore a matching identity and prove fresh validation. Restore a mismatched identity and prove rejection without callback execution.
- Service/DB tests:
  - not applicable.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Call `V4L2DeviceTransactionExecutor.run` with a real `CameraConfig`, injected adapter, and deterministic synchronous operation; assert the returned typed sentinel and full adapter trace. Private resolver or lock tests alone cannot satisfy route proof.
- Production-data rule:
  - Tests use temporary identity fixtures and a mocked adapter. They require neither production configuration, camera hardware, `/dev` mutation, nor a database.

## Acceptance Criteria

- An accepted configured reference establishes one digest-to-physical-identity binding, selects the same lock/state namespace across transient node changes, opens and revalidates under that lock, returns the downstream typed result only after close, and never exposes a host path to the caller.
- Missing, volatile, disconnected, and replaced devices fail in the specified stable categories; each disconnect, replacement, or post-submission cancellation invalidates that identity's cache state before another transaction can use it.
- Replacement handling leases and acquires prior/candidate states in deterministic order, atomically invalidates the prior state without rebinding the configured reference, repeatedly rejects the replacement, and retires only unbound stale state after all leases and waiters finish.
- Same-device and same-physical-device-alias transactions never overlap, distinct-device transactions can overlap, and all adapter/open-device work runs outside the async event loop.
- Post-submission cancellation retains the device lock until the in-flight worker has completed and closed, reports no success, performs no retry, and forces fresh validation for the next operation.
- Deterministic tests prove the real `CameraConfig` to public executor route, adapter injection, identity behavior, open/close lifetime, concurrency, reconnect, cancellation, cache invalidation, and failure redaction without hardware or production data.

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
- [x] Split coverage is complete, or marked not applicable. Current durable parent coverage is 100%, this candidate's ownership is complete, and no responsibility is uncovered or duplicated.
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
- Prior recorded score: 24.5 from independent pass `v4l2-device-transaction-identity-pass-3`; adversarial input, not trusted after revision.
- Adversarial rescore basis: recounted every category from this identity/transaction-only child after the bounded pass-3 stale-truthfulness revision. One generic executor operation, five explicit foundation models/seams including the identity registry, configuration and Linux device dependencies, one typed result/error boundary, reuse plus one field addition to `CameraConfig`, one new reusable module, one cohesive async/concurrency boundary, one trusted-path/redaction concern, and one transaction-bound performance concern are counted. The configured-reference binding, binding-version recheck, ascending lock acquisition, fail-closed invalidation, state leasing, and retirement contract remain unchanged and introduce no new responsibility. Current durable parent coverage is 100% because the descriptor/read sibling, paired test, and approving review record now exist, so the historical pass-2 artifact-absence readiness blocker is resolved and no readiness blocker is counted. Descriptor/menu models, provider read operations, enumeration, value reads, physical writes, HTTP/API, and UI responsibilities remain excluded by the exact split plan. Adapter-required operations are the single injected interface/seam model established by the independent split finding, not separately exposed provider methods.
- Functions/methods: 1 x 2 = 2
- Data structures/models: 5 x 1 = 5
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 1 x 1 = 1
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
- Total: 22.5
- If total matches prior score, adversarial survival reason: not applicable; the score decreases by 2 because current durable sibling evidence resolves the sole stale readiness blocker while all implementation-responsibility counts remain unchanged.
