# V4L2 Camera-Control Provider Foundation Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-review-pass-1.md`
Split provenance: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`, independent review pass `v4l2-control-provider-pass-1`
Canonical status: Split child
Review Score: 24.5
Prerequisites:
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines trusted V4L2 device identity, discovery, read, cache, concurrency, and failure boundaries.
- `project/architecture/current-camera-runtime.md` - proves the deployed Linux runtime exposes a stable C930e V4L2 device and supports control enumeration.

## Source Field Carryover

- Source purpose:
  - Establish the shared V4L2 provider foundation that resolves configured devices, discovers driver-reported controls, and returns live values to provider consumers.
- Source responsibilities by category:
  - Functions/methods: expose full descriptor discovery/read and bounded current-value read operations.
  - Data structures/models: represent resolved device identity, sparse menu items, complete control descriptors, and stable categorized provider failures.
  - Dependencies/services: use trusted `CameraConfig` data and Linux V4L2 extended-control ioctls through an injected adapter.
  - Returns/outputs/signals: return typed descriptor/value read results or a stable categorized failure without an HTTP response contract.
  - UI surfaces/components: not applicable.
  - UI fields/elements: not applicable.
  - Reusable code plan: add the authoritative reusable provider module and add an optional V4L2 device field to the existing camera configuration model.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: isolate blocking open/ioctl transactions from async callers and serialize them per physical device.
  - Destructive/write behavior: not applicable; this child performs no control mutation.
  - Security/privacy-sensitive behavior: resolve devices only from validated camera configuration and keep paths and raw ioctl payloads out of caller-visible failures.
  - Performance-sensitive behavior: bound value reads, cache descriptor metadata by physical identity, and enumerate only on defined refresh events.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - The authoritative shared contract is `frigate/camera/v4l2_controls.py` with `V4L2ControlProvider.get_controls` and `V4L2ControlProvider.get_control_values`; the latter closes the bounded-read contract required by the API consumer.
  - Live driver state is authoritative for current values. Descriptor cache state never substitutes for a driver value read.
- Source split/provenance notes:
  - Independent review split the parent provider at 26.5 points. This child owns device, descriptor, and read foundations. The reviewer-assigned sibling owns validated writes and write read-back. The split plan reports 100% parent coverage.

## Purpose

Provide one deterministic, reusable contract for identifying a configured Linux V4L2 camera, discovering its control metadata, and reading live control values. This foundation supplies the shared module, DTO, adapter, transaction, cache, and failure contracts used by the write-provider child and camera-control API without performing physical control writes.

## Scope

Owns:

- Optional camera-level V4L2 device configuration, stable path and capability identity validation, descriptor discovery, sparse menu expansion, complete descriptor conversion, and current-value reads.
- The authoritative provider module, public discovery/read callables, adapter seam, provider DTO/error contracts, per-device transaction lock, descriptor cache, disconnect invalidation, reconnect enumeration, cancellation recovery, and blocking-call isolation.
- Deterministic mocked-adapter tests for device identity, discovery, full and bounded reads, caching, reconnect behavior, concurrency, cancellation, and caller-safe failures.

Does not own:

- Control-value validation, `VIDIOC_TRY_EXT_CTRLS`, `VIDIOC_S_EXT_CTRLS`, physical mutation, write read-back, or write-specific tests. Those belong to the reviewer-assigned write-provider sibling.
- HTTP routes, authorization, wire schemas, provider-to-HTTP error mapping, OpenAPI generation, descriptor-driven UI, capture restart policy, USB attachment, deployment, or physical-hardware acceptance.

## Split Coverage

- Parent spec: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
- Parent coverage status: 100% covered by the two children defined in `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-review-pass-1.md`.
- Parent responsibilities owned by this child:
  - Shared provider module and callable authority; configured device identity; adapter, DTO, error, lock, and cache contracts; descriptor/menu enumeration; complete descriptor conversion; full and bounded live-value reads; disconnect/reconnect behavior; async isolation; and foundation/read verification.
- Parent responsibilities still missing from children:
  - none; validated write, write read-back, and write verification are assigned to the write-provider sibling in the split plan.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-review-pass-1.md` | 1 | `project/specs/camera-controls/v4l2-camera-control-provider.spec.md` and paired test spec | V4L2 provider foundation child and validated-write child definitions | continue |

## Implementation Routing

- Primary modules/files:
  - `frigate/camera/v4l2_controls.py` - authoritative reusable provider, Linux V4L2 adapter seam, device resolution, descriptor/menu conversion, full and bounded reads, locking, caching, and categorized failures.
  - `frigate/config/camera/camera.py` - optional camera-level `v4l2_device` configuration field.
- Supporting modules/files:
  - `frigate/config/camera/__init__.py` - export the configuration symbol only when required by the established camera-config export pattern.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/camera/v4l2_controls.py` - expose `V4L2ControlProvider`, `V4L2ControlDescriptor`, `V4L2MenuItem`, and `V4L2ControlError` as the shared contract.
- Tests:
  - `frigate/test/test_v4l2_controls.py` - deterministic foundation/read tests with an injected adapter and temporary stable identities.

## Chosen Defaults / Parameters

- `CameraConfig.v4l2_device` defaults to `None`; reads for a camera without the field fail as `not_configured`.
- A configured device must be an absolute stable `/dev/v4l/by-id/` path or another absolute path whose resolved udev and `VIDIOC_QUERYCAP` identity is stable. A bare `/dev/videoN` node fails as `unstable_device_identity`.
- Enumeration starts with `V4L2_CTRL_FLAG_NEXT_CTRL | V4L2_CTRL_FLAG_NEXT_COMPOUND`; terminal `EINVAL` ends iteration normally.
- Menu indexes are queried from the descriptor minimum through maximum. Sparse-index `EINVAL` is skipped; any other menu-query failure is categorized.
- `get_controls(..., refresh=False)` uses valid cached descriptor metadata and reads current values from the driver. `refresh=True` forces identity validation and descriptor re-enumeration before reading values.
- `get_control_values` accepts 1 through 64 unique serialized IDs, preserves requested order, resolves all IDs against cached or freshly enumerated descriptors, and performs one bounded `VIDIOC_G_EXT_CTRLS` transaction. An empty, duplicate, or over-limit collection fails as `invalid_control_ids` without a value ioctl.
- Unknown, payload-bearing, compound, and array controls remain discoverable. Current data is returned when the adapter can represent it losslessly; otherwise the descriptor carries no current value and remains inspectable.

## Data Ownership

- Source of truth: the active V4L2 driver for capabilities, descriptors, flags, menus, and current values; `CameraConfig.v4l2_device` for the permitted stable device reference.
- Read ownership: `V4L2ControlProvider` reads only the configured device through its injected adapter. Consumers call its public async methods and do not issue ioctls directly.
- Write ownership: this child has no physical-value write owner. The write-provider sibling consumes this child's shared transaction and descriptor contracts.
- Derived/cache data: descriptor metadata is reconstructed from `VIDIOC_QUERY_EXT_CTRL` and `VIDIOC_QUERYMENU`; cache keys combine the configured stable reference with capability identity. Current values are never authoritative in cache.
- Privacy/logging constraints: caller-visible errors and normal logs may contain camera name, serialized control ID, operation, and stable category. They must not contain resolved paths, raw ioctl structures, submitted payload contents, or raw errno text.

## Dependencies And Routes

- Domain/service dependencies:
  - `CameraConfig` supplies the trusted optional stable device reference through the existing configuration lifecycle.
  - Linux V4L2 capability, query, menu, and extended-control read operations are accessed through an injected `V4L2Adapter` boundary so automated tests need no camera hardware.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable.
- Background/concurrency route, if applicable:
  - Each public async operation resolves the configured identity, enters the lock keyed by physical identity, and submits the complete blocking open/query/read/close transaction with `asyncio.to_thread`. Cache inspection or mutation occurs under the same lock. The file descriptor closes before lock release. If an awaiting caller is cancelled after submission, no successful result is emitted; the next operation revalidates identity and rereads driver state.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already records the provider, trusted-device, async, cache, and error boundaries.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - validates the deployed stable Linux V4L2 route and successful control enumeration.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - none for this foundation child.
- Progression handling:
  - this candidate remains `awaiting_independent_review` and must not be represented as implementation-ready.

## Application Integration

- App type: library-only.
- User/caller surface: the authenticated camera-control read API and the validated-write provider sibling.
- Invocation route: a consumer passes an existing validated `CameraConfig` to `get_controls` or `get_control_values`; it cannot pass a host path.
- Wiring owner/module: `frigate/camera/v4l2_controls.py` owns provider construction and behavior; consuming modules own their process-level instance and invocation.
- Observable result: complete descriptors with current values, an ordered bounded stable-ID/value mapping, or a stable categorized provider failure.
- Integration validation: `frigate/test/test_v4l2_controls.py` invokes both public async read methods through the injected adapter using real `CameraConfig` fixtures.
- Incomplete status risk: designed; library completion requires public-route tests and does not claim API, write, or UI integration.

App-type-specific proof:

- Library-only: the authenticated read API and write-provider sibling are named consumers; tests invoke the exact public provider boundaries they consume.

## Reuse And Extraction Plan

- Existing code to reuse:
  - `frigate/config/camera/camera.py::CameraConfig` - carry the configured device reference through Frigate's existing validated configuration lifecycle.
- Current reuse readiness:
  - add one optional field to the existing camera model and create one reusable provider module.
- Extraction/wrapping needed:
  - `frigate/camera/v4l2_controls.py` - wrap Linux file descriptor and ioctl operations behind the injected adapter transaction boundary.
- Additions to existing library/modules:
  - `frigate/config/camera/camera.py` - add `v4l2_device: str | None`; runtime stability and capability identity validation remain provider responsibilities.
- New reusable modules to expose:
  - `frigate/camera/v4l2_controls.py` - stable provider, descriptor/menu, device-transaction, cache, adapter, and categorized-error boundary.
- One-off code justification, if any:
  - none.

## Required DTOs / Functions / Components

- DTOs/models:
  - `_ResolvedV4L2Device` - internal immutable configured reference, opened node, and `VIDIOC_QUERYCAP` identity used for lock/cache selection and replacement detection.
  - `V4L2MenuItem` - numeric menu index, optional integer-menu value, and driver label.
  - `V4L2ControlDescriptor` - numeric and stable serialized IDs, display name, class, V4L2 type, minimum, maximum, step, default and current values where representable, menu items, all reported flags, element size/count/dimensions, and derived active/writable/read-support state.
  - `V4L2ControlError` - typed exception with stable category (`not_configured`, `unstable_device_identity`, `device_disconnected`, `invalid_control_ids`, `control_not_found`, `unsupported_control_type`, `control_not_writable`, `invalid_value`, `driver_rejected`, or `device_io`) and caller-safe message; a private cause may be retained for diagnostics.
- Functions/methods:
  - `V4L2ControlProvider.get_controls(camera_config, *, refresh=False) -> tuple[V4L2ControlDescriptor, ...]` - resolve and validate identity, enumerate or reuse descriptor metadata, read live values for applicable controls, and return descriptors in driver enumeration order.
  - `V4L2ControlProvider.get_control_values(camera_config, serialized_ids) -> Mapping[str, bool | int | str | None]` - enforce the 1 through 64 unique-ID bound, preserve request order, resolve descriptors, and read the selected scalar current values in one device transaction.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Enumeration is O(reported controls plus each menu descriptor's declared index span) and runs only on first access, explicit refresh, identity change, or reconnect, never per video frame.
- `get_control_values` accepts at most 64 unique IDs and issues one extended-control value read for the selected descriptors. `get_controls` may read all enumerated controls in driver-compatible class groups rather than issuing one ioctl per caller-selected ID.
- Each operation opens one resolved device, performs a bounded transaction, and closes it outside the async event loop. Locks and descriptor caches are per physical identity, so distinct cameras do not block one another.

## Error And State Behavior

- Missing configuration yields `not_configured`; a volatile path, vanished stable target, or capability mismatch yields `unstable_device_identity` or `device_disconnected` as applicable.
- A disconnect during open, discovery, or read evicts cached descriptors and identity. The next successful call resolves the stable reference, validates capability identity, re-enumerates descriptors, and reads live values.
- Disabled, inactive, read-only, grabbed, unknown, payload-bearing, compound, and array controls remain represented with accurate flags and derived state. A value representation the adapter cannot preserve is omitted rather than guessed.
- Sparse menu holes do not fail discovery. Nonterminal query failures become `device_io`; requested stable IDs absent from the active descriptor set become `control_not_found`.
- Cancellation produces no successful result and no cache-derived value. The next operation rereads the device under the per-identity lock.
- Categorized errors expose no resolved path, raw ioctl payload, or raw errno text.

## Test Strategy

- Unit tests:
  - Mock capability validation, query iteration with both next flags, terminal `EINVAL`, sparse menus, integer-menu values, all descriptor fields/flags, stable serialized IDs, full live reads, bounded ordered reads, invalid ID collections, missing controls, unsupported value representations, and safe error categories.
  - Assert cache reuse, explicit refresh, identity replacement eviction, disconnect eviction, and successful reconnect re-enumeration.
  - Use synchronization gates to prove same-identity transactions never overlap, distinct identities can overlap, file descriptors close before lock release, and all adapter calls execute off the event-loop thread.
  - Simulate cancellation after thread submission and assert no success is emitted and the next operation rereads live state.
- Service/DB tests:
  - not applicable.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Construct real `CameraConfig` fixtures and invoke `get_controls` and `get_control_values` through the injected mocked adapter. Do not use private helpers as route proof.
- Production-data rule:
  - Tests use temporary stable identities and deterministic mocked adapter behavior. They require neither production configuration, camera hardware, nor a database.

## Acceptance Criteria

- A configured stable device returns descriptors containing every ACD-required metadata field, sparse menu data, derived state, stable IDs, and live current values where representable.
- A bounded read of 1 through 64 unique stable IDs returns one ordered live-value mapping from one device transaction; invalid collections and missing IDs fail with the specified safe categories.
- Blocking device work executes outside the async event loop; same-device operations serialize, distinct-device operations can proceed independently, and descriptors are never enumerated per video frame.
- Disconnect or identity replacement evicts cached metadata. The first successful reconnect call validates identity and re-enumerates before returning live values.
- Both public read operations, cache lifecycle, cancellation recovery, failure redaction, and adapter execution are proven deterministically without physical hardware or production data.

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
- Prior recorded score: 26.5 from independent parent review; adversarial input, not trusted for this child.
- Adversarial rescore basis: recounted every category from this foundation/read child. The two public read operations are counted separately, the four explicit models are counted separately, and both driver and configuration dependencies are counted. Configuration addition, reusable module creation, async isolation/serialization, trusted-path/error-redaction behavior, and read/cache bounds are included. Write mutation and write read-back are excluded because the split plan assigns them to the sibling.
- Functions/methods: 2 x 2 = 4
- Data structures/models: 4 x 1 = 4
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
- Total: 24.5
- If total matches prior score, adversarial survival reason: not applicable; the parent independent score was 26.5.
