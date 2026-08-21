# V4L2 Descriptor Discovery And Live-Read Provider Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`
Split provenance: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`, child 2 from independent review pass `v4l2-provider-foundation-pass-1`
Canonical status: Split child
Review Score: 21
Prerequisites:
- `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - must be independently approved and implemented first because it owns configured-device identity, the adapter and safe-error contracts, the per-device transaction and lock, cache slots, invalidation, reconnect, cancellation, and shared fixtures.
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines the descriptor, menu, live-read, cache-refresh, volatile-state, failure, and performance contracts.
- `project/architecture/current-camera-runtime.md` - proves the deployed Linux runtime exposes the configured C930e and can enumerate its V4L2 controls.

## Source Field Carryover

- Source purpose:
  - Extend the shared device foundation with complete descriptor and menu discovery plus authoritative live-value reads for downstream camera-control API, write, and UI consumers.
- Source responsibilities by category:
  - Functions/methods: expose `V4L2ControlProvider.get_controls` for complete descriptors with live values and `V4L2ControlProvider.get_control_values` for one ordered, bounded selection read.
  - Data structures/models: define `V4L2MenuItem` and `V4L2ControlDescriptor`, including complete driver metadata, stable IDs, flags, dimensions, current values, and derived active, writable, and read-support state.
  - Dependencies/services: reuse the transaction/identity sibling's `CameraConfig` route, `V4L2Adapter`, `V4L2ControlError`, transaction executor, per-identity state, invalidation, cancellation, and fixtures; invoke Linux query, menu, and get-extended-control operations only through that adapter.
  - Returns/outputs/signals: return descriptors in driver enumeration order, an ordered stable-ID/value mapping, or a foundation-compatible categorized error.
  - UI surfaces/components: not applicable.
  - UI fields/elements: not applicable.
  - Reusable code plan: extend `frigate/camera/v4l2_controls.py` and its shared deterministic test fixture rather than creating another provider module or device-access route.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: run all blocking discovery and read work through the sibling transaction executor under its per-physical-device lock, with cache inspection and population inside that transaction boundary.
  - Destructive/write behavior: not applicable; this child issues no try or set request and never changes a physical control.
  - Security/privacy-sensitive behavior: accept only the sibling's configured-device transaction and preserve its redaction rules for paths, raw ioctl data, payloads, and errno text.
  - Performance-sensitive behavior: cache descriptor metadata by validated physical identity, enumerate only on defined refresh events, cap selected reads at 64 unique IDs, and group full reads by driver-compatible control class.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - Unknown, payload-bearing, compound, and array controls remain inspectable, but their current values are present only when the adapter can represent them losslessly.
  - `V4L2ControlWriteResult` remains exclusively defined by `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`; this child does not define or return a write result.
- Source split/provenance notes:
  - Independent review scored the parent foundation/read candidate at 25.5 and required two children. This child owns descriptor/menu models, discovery, live reads, descriptor-cache content and refresh, and their tests. The transaction/identity sibling owns every device identity, adapter, error, transaction, lock, invalidation, cancellation, and base-fixture primitive. Together they provide 100% parent coverage with no uncovered responsibility.

## Purpose

Provide one reusable, deterministic V4L2 provider boundary that reports every discoverable control and reads current driver state without blocking the event loop. This leaf extends the device foundation but does not resolve devices independently, mutate controls, define HTTP behavior, or define `V4L2ControlWriteResult`.

## Scope

Owns:

- `V4L2MenuItem`, `V4L2ControlDescriptor`, stable serialized control IDs, complete metadata and flags, sparse ordinary and integer menus, dimensions, and derived active, writable, and read-support state.
- `V4L2ControlProvider.get_controls`, complete query iteration, descriptor conversion, grouped full live reads, explicit refresh, metadata-cache population and reuse, and lossless current-value representation.
- `V4L2ControlProvider.get_control_values`, the 1 through 64 unique-ID contract, order preservation, active-descriptor resolution, one bounded extended-control read, and read-specific categorized failures.
- Deterministic public-route tests for enumeration, reads, cache lifecycle, reconnect refresh, cancellation recovery, safe failures, and call bounds.

Does not own:

- Configured-device validation, physical identity, `_ResolvedV4L2Device`, `V4L2Adapter`, `V4L2ControlError`, stable error categories, per-device transaction/lock behavior, file-descriptor lifetime, cache-slot substrate, disconnect/reconnect identity handling, cancellation mechanics, or the base deterministic fixture owned by `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`.
- Value validation, `VIDIOC_TRY_EXT_CTRLS`, `VIDIOC_S_EXT_CTRLS`, physical mutation, mandatory post-write read-back, conditional post-write layout refresh, or `V4L2ControlWriteResult`, all owned by `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`.
- HTTP routes, authorization, wire schemas, OpenAPI generation, generated UI, volatile polling cadence, USB attachment, capture restart policy, deployment, or physical-hardware acceptance.

## Split Coverage

- Parent spec: `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md`
- Parent coverage status: 100% assigned by `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`; this child and `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` partition every parent implementation and paired-test responsibility.
- Parent responsibilities owned by this child:
  - Descriptor and menu models; query/menu enumeration; complete conversion; full and bounded live reads; public read methods; descriptor-cache content and refresh policy; unknown/payload/compound/array inspection; lossless values; and read-specific deterministic tests.
- Parent responsibilities still missing from children:
  - none; configured-device identity, shared primitives, transaction lifetime, invalidation, cancellation, privacy foundation, and base fixtures belong exclusively to the transaction/identity sibling.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md` | 1 | `project/specs/camera-controls/v4l2-camera-control-provider-foundation.spec.md` and paired test spec | this descriptor-discovery/live-read definition and the device-transaction/identity definition | continue |

## Implementation Routing

- Primary modules/files:
  - `frigate/camera/v4l2_controls.py` - extend the sibling-owned module with descriptor/menu models, the provider class, query/menu conversion, cache population, grouped full reads, and bounded selected reads.
- Supporting modules/files:
  - none; use the sibling's configuration, adapter, transaction, state, and error contracts without another export or device-access layer.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/camera/v4l2_controls.py` - expose `V4L2ControlProvider`, `V4L2MenuItem`, and `V4L2ControlDescriptor` beside the sibling-owned shared contracts.
- Tests:
  - `frigate/test/test_v4l2_controls.py` - extend the shared foundation fixture with deterministic query, menu, value-read, and call-recording behavior and test both public read operations.

## Chosen Defaults / Parameters

- Enumeration starts with `V4L2_CTRL_FLAG_NEXT_CTRL | V4L2_CTRL_FLAG_NEXT_COMPOUND`; terminal query `EINVAL` is normal completion.
- Menu indexes are queried inclusively from descriptor minimum through maximum. Sparse-index `EINVAL` is skipped; any other menu-query failure becomes `device_io` through the shared safe-error boundary.
- A stable serialized ID is the lower-case eight-digit hexadecimal numeric V4L2 control ID prefixed with `0x`, for example `0x00980900`; deserialization accepts only that exact canonical form. Numeric ID remains separately available on the descriptor.
- `get_controls(..., refresh=False)` reuses valid cached descriptor metadata and always reads current values from the live driver. `refresh=True` revalidates through the sibling transaction and forces descriptor and menu re-enumeration before the live read.
- Descriptor cache content is an immutable tuple in driver enumeration order, stored in the sibling's per-physical-identity state at the current generation. It never treats current values as cached truth.
- `get_control_values` accepts 1 through 64 unique canonical serialized IDs, preserves caller order, resolves all IDs against cached or freshly enumerated descriptors, and performs one `VIDIOC_G_EXT_CTRLS` request for those IDs. Empty, duplicate, malformed, or over-limit input raises `invalid_control_ids` before a value ioctl.
- `get_controls` reads every readable control in the minimum number of driver-compatible control-class groups. One grouped request is issued per represented class; a class-group failure fails the operation rather than returning a partially live descriptor tuple.
- Unknown, payload-bearing, compound, and array controls remain in discovery results. `current_value` is `None` and `read_supported` is false when the adapter cannot represent the value losslessly.
- A descriptor is effectively active only when it lacks `disabled` and `inactive`; it is effectively writable only when active and it lacks `read-only` and `grabbed`; `read_supported` requires a losslessly representable get format and is independent of effective writability.

## Data Ownership

- Source of truth: the active V4L2 driver owns descriptors, flags, menu entries, dimensions, and current values; the transaction/identity sibling owns trusted device identity and the current per-device state generation.
- Read ownership: `V4L2ControlProvider` obtains driver data only inside `V4L2DeviceTransactionExecutor.run` through the injected `V4L2Adapter`. API, write, and UI consumers use the public provider methods rather than issuing read ioctls.
- Write ownership: this child performs no physical write. It may populate, reuse, refresh, or evict only derived descriptor metadata in the sibling-owned cache slots.
- Derived/cache data: cached descriptor metadata is reconstructed from `VIDIOC_QUERY_EXT_CTRL` and `VIDIOC_QUERYMENU`; it is keyed by validated physical identity and generation and is evicted by explicit refresh, sibling invalidation, identity replacement, or disconnect. Current values are attached to returned descriptor copies and never retained as authoritative cache state.
- Privacy/logging constraints: caller-visible errors and normal logs may contain camera name, canonical serialized control ID, operation, and stable category. They must not contain configured or resolved device paths, raw query/menu/value ioctl structures, raw payload content, raw errno text, or lossless values from string or payload controls.

## Dependencies And Routes

- Domain/service dependencies:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` supplies `CameraConfig.v4l2_device`, `_ResolvedV4L2Device`, `V4L2Adapter`, `V4L2ControlError`, stable categories, transaction execution, per-device locking/state, invalidation, reconnect, cancellation recovery, and the shared fixture.
  - Linux `VIDIOC_QUERY_EXT_CTRL`, `VIDIOC_QUERYMENU`, and `VIDIOC_G_EXT_CTRLS` behavior is accessed only by extending the sibling's injected adapter operations, never by opening or resolving a device in this child.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable.
- Background/concurrency route, if applicable:
  - Each public async method delegates one complete synchronous discovery/read callback to `V4L2DeviceTransactionExecutor.run`. The sibling selects the physical-identity lock, opens and revalidates the device, runs the callback outside the event loop, closes it, and retains the lock through submitted-work completion after cancellation. Descriptor-cache inspection and mutation happen only within that callback and current generation. The sibling invalidates the cache on disconnect, replacement, or submitted-work cancellation, so the next successful call re-enumerates and rereads live state.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already defines V4L2 discovery, live reads, descriptor fields, refresh, disconnect behavior, blocking-call isolation, safe errors, and performance bounds.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - validates the deployed Linux V4L2 route and successful hardware control enumeration.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - none.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - must be independently approved and implemented before this child.
- Progression handling:
  - sequence the transaction/identity leaf first. This candidate remains `awaiting_independent_review` and must not be represented as implementation-ready.

## Application Integration

- App type: library-only.
- User/caller surface: the authenticated camera-control read API and `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md` consume this provider's descriptors, cache refresh, and grouped live-read behavior.
- Invocation route: a consumer passes an existing validated `CameraConfig` to `get_controls` or passes that configuration plus canonical serialized IDs to `get_control_values`; it cannot pass a host path, file descriptor, or raw adapter request.
- Wiring owner/module: `frigate/camera/v4l2_controls.py` owns provider construction and behavior; consuming modules own their process-level provider instance and invocation.
- Observable result: a complete ordered descriptor tuple with live values, an ordered bounded canonical-ID/value mapping, or one foundation-compatible categorized error.
- Integration validation: `frigate/test/test_v4l2_controls.py` invokes both public async methods with real `CameraConfig` fixtures through the sibling's transaction executor and injected adapter, not private conversion or cache helpers alone.
- Incomplete status risk: designed; this candidate requires independent review, prerequisite implementation, and public-route tests before its library route can be treated as complete. It claims no HTTP, write, or UI integration.

App-type-specific proof:

- Library-only: the authenticated read API and validated-write provider are named consumers, and deterministic tests invoke the exact public provider methods and shared foundation contracts those consumers use.

## Reuse And Extraction Plan

- Existing code to reuse:
  - Transaction/identity `CameraConfig.v4l2_device` and validated physical identity - preserve the single trusted camera-to-device route.
  - Transaction/identity `V4L2Adapter` and `V4L2ControlError` - add query/menu/read operations to the single injected seam and preserve stable safe failures.
  - Transaction/identity `V4L2DeviceTransactionExecutor` and per-device lock - run discovery and reads within the single serialized open/validate/operation/close boundary.
  - Transaction/identity per-device cache slots, generation, invalidation, reconnect, and cancellation behavior - store only derived descriptor metadata and inherit recovery semantics.
- Current reuse readiness:
  - add the descriptor/read provider to the shared module after the transaction/identity prerequisite is independently approved and implemented.
- Extraction/wrapping needed:
  - none; this child extends the shared provider module and injected adapter in place.
- Additions to existing library/modules:
  - `frigate/camera/v4l2_controls.py` - add the two descriptor/menu models, provider class, public read methods, adapter query/menu/read support, and descriptor-cache content.
- New reusable modules to expose:
  - none.
- One-off code justification, if any:
  - none.

## Required DTOs / Functions / Components

- DTOs/models:
  - `V4L2MenuItem` - immutable `index: int`, `value: int | None` for integer-menu entries, and driver `label: str`.
  - `V4L2ControlDescriptor` - immutable `id: int`, canonical `serialized_id: str`, `name: str`, `control_class: int`, `control_type: int`, numeric `minimum`, `maximum`, `step`, and `default_value` where applicable, `current_value: bool | int | str | bytes | tuple[bool | int | str, ...] | None` when losslessly representable, `menu_items: tuple[V4L2MenuItem, ...]`, the full driver flag set, `element_size: int`, `element_count: int`, `dimensions: tuple[int, ...]`, and derived `active: bool`, `writable: bool`, and `read_supported: bool`.
- Functions/methods:
  - `V4L2ControlProvider.get_controls(camera_config, *, refresh=False) -> tuple[V4L2ControlDescriptor, ...]` - enumerate or reuse metadata under the validated device transaction, read all supported current values in control-class groups, and return fresh descriptor copies in driver enumeration order.
  - `V4L2ControlProvider.get_control_values(camera_config, serialized_ids) -> Mapping[str, bool | int | str | None]` - validate 1 through 64 canonical unique IDs, preserve order, resolve against active metadata, perform one bounded selected read, and return scalar live values or `None` where the descriptor is inspectable but has no supported scalar read representation.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- Enumeration is O(reported controls plus each menu descriptor's declared inclusive index span) and occurs only on first access for an identity generation, `refresh=True`, or sibling-directed invalidation. It never runs per video frame.
- `get_control_values` accepts at most 64 unique IDs and issues exactly one selected `VIDIOC_G_EXT_CTRLS` request after any required enumeration. `get_controls` issues at most one value-read request per represented control class, not one request per control.
- One provider call uses one sibling transaction, one open device, and one close. Cache state and locks remain per physical identity, so calls for distinct devices can progress independently.

## Error And State Behavior

- Empty, duplicate, malformed, or over-limit selected-ID input raises `invalid_control_ids` before opening the device or issuing a value ioctl. A canonical ID absent from the active descriptor set raises `control_not_found` before a value ioctl.
- Terminal enumeration `EINVAL` ends discovery normally. Sparse menu `EINVAL` skips only that index. Any other query, menu, conversion, or read failure maps to the sibling's `device_io`, except removal, which remains `device_disconnected` and triggers sibling cache invalidation.
- Disabled, inactive, read-only, grabbed, unknown, payload-bearing, compound, and array controls remain represented with exact flags and derived state. A current value the adapter cannot preserve losslessly is `None` with `read_supported=false`; the provider never invents or truncates a value.
- A discovery or read failure returns no partial descriptor tuple or value mapping. Current values are read for every call and are never served from descriptor metadata cache.
- Explicit refresh discards descriptor metadata before enumeration within the same transaction. Disconnect, identity replacement, or cancellation after worker submission relies on sibling invalidation; the next successful call revalidates identity, re-enumerates, and rereads live values.
- Categorized errors preserve the sibling's caller-safe redaction and never expose paths, raw ioctl data, raw payloads, or raw errno text.

## Test Strategy

- Unit tests:
  - Iterate query responses with both next flags, accept terminal `EINVAL`, expand ordinary and integer menus across inclusive bounds, skip sparse-menu `EINVAL`, and assert all descriptor metadata, flags, dimensions, derived states, and canonical stable IDs.
  - Exercise grouped full reads for boolean, integer, integer64, menu, integer-menu, string, bitmask, and losslessly representable payload/array values. Exercise selected reads for the supported scalar forms and assert unknown or unrepresentable values remain inspectable with `None` and `read_supported=false`.
  - Assert 1 and 64 selected IDs succeed in one read, order is preserved, and empty, duplicate, malformed, 65-ID, and absent-ID inputs fail before a value ioctl.
  - Assert first-access cache population, normal metadata reuse with fresh values, explicit refresh, sibling disconnect/replacement eviction, matching reconnect re-enumeration, no partial result, stable categories, and error redaction.
  - Extend the sibling fixture's call recorder to prove exact query/menu/read counts, class grouping, one selected read, off-event-loop execution, same-device serialization, distinct-device independence, close-before-lock-release, and cancellation recovery without duplicating the sibling's identity mechanics.
- Service/DB tests:
  - not applicable.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Construct real `CameraConfig` fixtures and call both public methods through the actual provider, transaction executor, and injected adapter. Assert public results and adapter traces; private helper tests cannot satisfy route proof.
- Production-data rule:
  - Tests use temporary identities and deterministic adapter responses. They require no production configuration, physical camera, or database.

## Acceptance Criteria

- A configured stable device returns every discovered control in driver order with all ACD-required metadata, sparse menu content, canonical stable IDs, flags, dimensions, derived state, and a live current value wherever representation is lossless.
- `get_control_values` accepts exactly 1 through 64 unique canonical IDs, preserves request order, issues one selected extended-control read, and rejects invalid collections or absent IDs before value I/O.
- Descriptor metadata is reused only within the same valid physical-identity generation; first access, explicit refresh, disconnect, replacement, reconnect, and submitted-work cancellation follow the specified enumeration and reread rules.
- Blocking adapter work executes outside the event loop through the sibling transaction. Same-device calls serialize, distinct-device calls remain independent, and no discovery or read path performs per-frame work.
- Query, menu, conversion, and read errors are stable and caller-safe, and no failed operation returns partial descriptors or values.
- Deterministic tests prove both public read routes and extend the sibling fixture without physical hardware or production data.
- The provider exposes descriptor and grouped read contracts for the write leaf while leaving `V4L2ControlWriteResult`, validation, physical mutation, and mandatory write read-back exclusively authoritative in `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md`.

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
- Prior recorded score: 25.5 from independent parent-foundation review; adversarial input, not trusted for this child.
- Adversarial rescore basis: recounted every category from this descriptor/read-only child. The two public read methods, two descriptor/menu models, transaction-foundation and Linux query/read dependencies, two result shapes, four reused foundation contract groups, one addition to the shared provider module, one cohesive transaction/cancellation concurrency boundary, one inherited trusted-device/redaction concern, and one enumeration/read-bound concern are counted. Device identity models, adapter/error/state models, transaction executor method, module creation, physical writes, write result, HTTP/API, and UI work are excluded by the exact split plan.
- Functions/methods: 2 x 2 = 4
- Data structures/models: 2 x 1 = 2
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 2 x 1 = 2
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 4 x 0.5 = 2
- Adding code to an existing library/module: 1 x 1 = 1
- Creating a new reusable library/module: 0 x 3 = 0
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 21
- If total matches prior score, adversarial survival reason: not applicable; the parent score includes the transaction/identity responsibilities excluded from this child.
