# V4L2 Camera-Control Validated Write And Read-Back Specification

Date: 2026-08-19
Status: Proposed
Primary ancestor: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
Architecture ancestor: `project/architecture/acd/usb-v4l2-camera-controls.md`
Source artifact: `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-review-pass-1.md`
Split provenance: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`, child 2 from `v4l2-control-provider-pass-1`
Canonical status: Split child
Review Score: 23
Prerequisites:
- `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - existing candidate assigned configuration routing, validated physical identity, the adapter and safe-error boundary, per-device transaction serialization, disconnect/reconnect invalidation, cancellation recovery, and shared mocked-adapter facilities; it remains `awaiting_independent_review` and must be independently approved and implemented first.
- `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - final prerequisite contract assigned descriptor/value models, descriptor enumeration and caching, full and bounded live reads, and read-specific mocked-adapter facilities; this specification must be written, independently approved, and implemented after the transaction/identity prerequisite and before this write child.
- `project/architecture/acd/usb-v4l2-camera-controls.md` - defines validated V4L2 extended-control writes, serialized device access, mandatory driver read-back, modify-layout refresh, and safe failure behavior.

## Source Field Carryover

- Source purpose:
  - Complete the write half of the split V4L2 provider by validating and applying one control change, then returning authoritative post-write hardware state.
- Source responsibilities by category:
  - Functions/methods: add one public individual-control write operation to the final descriptor/live-read provider contract.
  - Data structures/models: add one write-result model composed from the final descriptor model so coupled values and layout refresh effects are explicit.
  - Dependencies/services: reuse the final transaction/identity and descriptor/live-read provider contracts plus Linux V4L2 `TRY_EXT_CTRLS`, `S_EXT_CTRLS`, and `G_EXT_CTRLS` adapter operations.
  - Returns/outputs/signals: return the target control, the authoritative post-write control snapshot, and whether descriptors were re-enumerated.
  - UI surfaces/components: not applicable.
  - UI fields/elements: not applicable.
  - Reusable code plan: add write behavior to the shared provider module after the final transaction/identity and descriptor/live-read prerequisites establish its models, adapter, device transaction, lock, cache, and read contracts.
  - Database queries/tables/migrations: not applicable.
  - Async/concurrency behavior: execute validation, try, set, read-back, and any descriptor refresh inside one serialized per-device transaction outside the event loop.
  - Destructive/write behavior: apply exactly one physical-device control write only after provider and driver validation.
  - Security/privacy-sensitive behavior: use only the foundation-resolved configured device and preserve its safe error and logging redaction contract, including submitted string values.
  - Performance-sensitive behavior: perform one bounded transaction and group post-write reads by control class; re-enumerate descriptors only when the written descriptor reports `modify-layout`.
  - Cross-screen reusable behavior: not applicable.
- Source open questions / nuance discovered:
  - A single returned target descriptor cannot represent automatic-mode changes to coupled controls or a layout-changing result. The write result therefore includes the complete authoritative post-write control snapshot and an explicit descriptor-refresh signal.
- Source split/provenance notes:
  - The original provider split assigned device, descriptor, read, adapter, lock, and cache ownership to a foundation child and assigned only validation, write, read-back, and write-specific verification to this child. Independent foundation review then split that prerequisite into the final transaction/identity and descriptor/live-read contracts named above. Those final prerequisites plus this write child preserve 100% coverage of the parent provider candidate.

## Purpose

Add one safe, deterministic individual-control mutation to the shared V4L2 provider. The operation validates caller input, lets the driver validate when supported, applies the write once, and reports the driver's resulting target and coupled control state without owning device discovery, HTTP, or UI behavior.

## Scope

Owns:

- Effective-writability and type-specific validation for one discovered control.
- Optional driver validation with `VIDIOC_TRY_EXT_CTRLS`, application with `VIDIOC_S_EXT_CTRLS`, and mandatory authoritative read-back with `VIDIOC_G_EXT_CTRLS`.
- Propagation of driver clamping, automatic-mode coupled-value changes, and `modify-layout` descriptor refresh through one provider write result.
- Write-specific categorized failure behavior and deterministic mocked-adapter tests.

Does not own:

- Configured-device resolution, identity validation, adapter construction, the shared safe-error boundary, cache and lock construction, disconnect/reconnect policy, or cancellation recovery. Those contracts belong to the transaction/identity prerequisite. Descriptor models, descriptor caching, discovery/read APIs, and read-specific failures belong to the descriptor/live-read prerequisite.
- HTTP routing, authorization, request or wire-response models, provider-to-HTTP error mapping, OpenAPI generation, UI mutation state, or physical-hardware acceptance.
- Batch or atomic multi-control writes, payload-bearing controls, compound values, or array writes.

## Split Coverage

- Parent spec: `project/specs/camera-controls/v4l2-camera-control-provider.spec.md`
- Parent coverage status: 100% planned coverage across this child plus the final transaction/identity and descriptor/live-read prerequisite children defined by `project/specs/camera-controls/review-ledger/v4l2-camera-control-provider-foundation-review-pass-1.md`.
- Parent responsibilities owned by this child:
  - Individual-control validation, try/set application, serialized write/read-back transaction, authoritative coupled-state propagation, modify-layout refresh, and write-specific failures and tests.
- Parent responsibilities still missing from children:
  - none.

## Refinement History

| Request ledger | Latest pass | Active specs reviewed | New leaves created this round | Fixed-point status |
|---|---:|---|---|---|
| `project/specs/camera-controls/review-ledger/v4l2-camera-control-validated-write-readback-review-pass-1.md` | 1 | `project/specs/camera-controls/v4l2-camera-control-validated-write-readback.spec.md` | none | reached for splitting; bounded prerequisite revision required |

## Implementation Routing

- Primary modules/files:
  - `frigate/camera/v4l2_controls.py` - extend the prerequisite descriptor/live-read provider with the public write method, validation, extended-control write/read-back transaction, and write result.
- Supporting modules/files:
  - none; the transaction/identity prerequisite owns adapter, configuration, identity, lock, and transaction support, while the descriptor/live-read prerequisite owns descriptor, cache, and read support.
- GUI/QML files, if applicable:
  - not applicable.
- Reusable library/module files:
  - `frigate/camera/v4l2_controls.py` - expose the write method and `V4L2ControlWriteResult` beside the foundation's provider, descriptor, and error contracts.
- Tests:
  - `frigate/test/test_v4l2_controls.py` - add deterministic public write-route, validation, call-order, read-back, refresh, failure, serialization, and cancellation tests using the final prerequisites' shared fixtures.

## Chosen Defaults / Parameters

- The public contract remains an individual write: `set_control(camera_config, serialized_id, value)` applies at most one `VIDIOC_S_EXT_CTRLS` request.
- A boolean accepts only `bool`; integer and integer64 values must be integers other than booleans, within inclusive bounds, and aligned to `minimum + n * step` when step is positive.
- Menu and integer-menu values must exactly match a discovered menu index. A button accepts only `None`. A string must be a string, contain no NUL, and fit the descriptor's driver-reported encoded-byte limit. A bitmask must be a nonnegative integer with no bits outside the reported mask.
- Disabled, inactive, read-only, or grabbed controls fail as `control_not_writable`. Unknown, payload-bearing, compound, and array types fail as `unsupported_control_type`. Validation failures do not call either try or set.
- The provider calls `VIDIOC_TRY_EXT_CTRLS` for supported scalar writes. An adapter-confirmed `ENOTTY` means try is unavailable and permits the set attempt; validation errors and all other driver rejections fail as `driver_rejected` without a set.
- After a successful set, the provider reads every readable discovered control in control-class groups under the same transaction and returns those live values. The target control in the result is selected from that snapshot.
- If the written descriptor has `modify-layout`, the provider evicts that device's descriptor metadata, re-enumerates under the same transaction, reads the refreshed controls, and sets `descriptors_refreshed=true`; otherwise it preserves descriptor metadata and sets the flag false.
- The provider performs no automatic retry. A failed set or failed mandatory read-back never returns a success result.

## Data Ownership

- Source of truth: the active V4L2 driver is authoritative for accepted values, post-write values, flags, and any post-write layout.
- Read ownership: the descriptor/live-read prerequisite's grouped read and descriptor-refresh contracts supply the authoritative snapshot used by the result.
- Write ownership: `V4L2ControlProvider.set_control` is the sole reusable individual-write boundary; callers do not invoke adapter ioctls.
- Derived/cache data: the descriptor/live-read prerequisite's cache remains derived driver metadata. This child invalidates it only for a `modify-layout` result; transaction/identity disconnect handling invalidates the shared device namespace.
- Privacy/logging constraints: caller-visible errors and normal logs contain the camera name, stable serialized control ID, operation stage, and stable category only. They do not expose resolved paths, raw ioctl structures, raw errno text, or submitted string values.

## Dependencies And Routes

- Domain/service dependencies:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` is the final authority for `CameraConfig` routing, validated physical identity, `V4L2ControlError`, the adapter protocol, transaction executor, per-device lock, invalidation, reconnect, cancellation recovery, and shared identity/transaction fixtures.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` is the final authority for `V4L2ControlProvider`, `V4L2ControlDescriptor`, descriptor caching and refresh, full/grouped live reads, and descriptor/read fixtures.
  - Linux V4L2 extended-control try, set, and get operations are invoked only through that injected adapter.
- Database dependencies:
  - not applicable.
- GUI route, if applicable:
  - not applicable.
- Background/concurrency route, if applicable:
  - The public async write resolves through the final prerequisite contracts, enters the transaction/identity prerequisite's per-physical-device lock, and submits one blocking transaction outside the event loop. Validation, try, set, mandatory grouped read-back, result construction, and conditional descriptor refresh complete before lock release and file-descriptor close. Operations for the same device cannot overlap; different device locks remain independent. The transaction/identity cancellation contract prevents partial success reporting and forces the next operation to reread driver state.

## Prerequisite Handling

- Architecture feedback artifacts:
  - `project/architecture/acd/usb-v4l2-camera-controls.md` - already defines the write/read-back, serialization, refresh, and failure boundaries.
- Architecture feedback status:
  - tracked in ACD.
- Already implemented prerequisites:
  - `project/architecture/current-camera-runtime.md` - proves the deployed Linux runtime exposes and enumerates controls for the configured C930e.
- Missing prerequisite architecture:
  - none.
- Missing prerequisite specifications:
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - final descriptor/live-read contract defined by the supplied foundation split plan; it does not yet exist on disk.
- Unimplemented prerequisite specifications:
  - `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md` - candidate exists with status `awaiting_independent_review`; it must be independently approved and implemented first.
  - `project/specs/camera-controls/v4l2-descriptor-discovery-and-live-read-provider.spec.md` - after this missing candidate is authored and independently approved, it must be implemented after the transaction/identity prerequisite and before this write child.
- Progression handling:
  - current item must be marked `Missing prerequisite`; both final prerequisite specifications must exist, be independently approved, and be implemented in dependency order before this write child can proceed. This revised candidate remains `awaiting_independent_review` and is not implementation-ready.

## Application Integration

- App type: library-only.
- User/caller surface: `project/specs/camera-controls/authenticated-camera-control-write-api.spec.md`, once authored and finalized, consumes the provider write result.
- Invocation route: the consumer passes a validated `CameraConfig`, stable serialized control ID, and supported scalar value to the public async provider method; it cannot pass a host path or adapter request.
- Wiring owner/module: `frigate/camera/v4l2_controls.py` owns the write behavior; the final transaction/identity and descriptor/live-read prerequisites own the shared provider infrastructure.
- Observable result: `V4L2ControlWriteResult` contains the authoritative target descriptor/value, the complete post-write control snapshot, and whether descriptor metadata was refreshed, or the call raises one foundation-compatible categorized error.
- Integration validation: `frigate/test/test_v4l2_controls.py` invokes the public method with a real `CameraConfig` fixture and the foundation's injected mocked adapter, asserting the returned snapshot and adapter trace.
- Incomplete status risk: designed; it becomes a usable library route only after both final prerequisite contracts exist, receive independent approval, and are implemented. The downstream API write contract must consume `V4L2ControlWriteResult` without redefining it; this candidate does not claim HTTP or UI integration.

App-type-specific proof:

- Library-only: the authenticated camera-control write API is the named consumer, and the paired test invokes the exact provider write boundary that consumer uses.

## Reuse And Extraction Plan

- Existing code to reuse:
  - Final descriptor/live-read `V4L2ControlProvider` plus transaction/identity configured-device resolution - preserve one trusted camera-to-device route.
  - Final descriptor/live-read `V4L2ControlDescriptor` plus transaction/identity `V4L2ControlError` - preserve one descriptor and categorized-failure vocabulary.
  - Final transaction/identity V4L2 adapter protocol - add try/set/get calls to the same deterministic seam.
  - Final transaction/identity per-device transaction and lock boundary - serialize the whole write and read-back sequence.
  - Final descriptor/live-read cache and refresh contract plus transaction/identity disconnect invalidation - handle `modify-layout` and disconnect consistently.
  - Final descriptor/live-read grouped current-value contract - produce the authoritative coupled post-write snapshot.
- Current reuse readiness:
  - add the cohesive write operation and result to the shared provider module after both final prerequisite specifications exist, receive independent approval, and are implemented.
- Extraction/wrapping needed:
  - none; this child extends the foundation's public provider and adapter contract in place.
- Additions to existing library/modules:
  - `frigate/camera/v4l2_controls.py` - add `V4L2ControlWriteResult`, public `set_control`, validation, and write/read-back orchestration.
- New reusable modules to expose:
  - none.
- One-off code justification, if any:
  - none.

## Required DTOs / Functions / Components

- DTOs/models:
  - `V4L2ControlWriteResult` - immutable result with `control: V4L2ControlDescriptor`, `controls: tuple[V4L2ControlDescriptor, ...]`, and `descriptors_refreshed: bool`; `control` is the target member from `controls`.
- Functions/methods:
  - `V4L2ControlProvider.set_control(camera_config, serialized_id, value) -> V4L2ControlWriteResult` - validate and apply one control inside the foundation transaction, perform mandatory grouped driver read-back and conditional layout refresh, and return authoritative post-write state.
- UI fields / visible data, if applicable:
  - not applicable.
- UI elements / controls, if applicable:
  - not applicable.
- UI components, if applicable:
  - not applicable.

## Performance Contract

- One public write performs at most one try request, one set request, and one grouped current-value read per discovered control class. A `modify-layout` result adds one descriptor enumeration plus grouped reads; no path performs per-frame work.
- The write transaction opens only the foundation-resolved device and remains bounded by the driver's reported descriptor count and menu spans. Separate devices retain independent locks.
- Blocking adapter work runs outside FastAPI's event loop and outside capture workers. No implicit retry can duplicate a physical write.

## Error And State Behavior

- A missing serialized ID raises `control_not_found`; ineffective writability raises `control_not_writable`; type, range, step, menu, string, or bitmask validation raises `invalid_value`; unsupported encodings raise `unsupported_control_type`.
- Driver rejection during try or set raises `driver_rejected`. Other try/set failures raise `device_io`, except foundation-classified removal, which raises `device_disconnected` and evicts device state.
- A set followed by failed mandatory read-back raises `device_io` or `device_disconnected` for the read stage and never reports success. The next operation uses the foundation recovery contract to reread live state.
- Driver clamping is accepted as hardware truth and appears in `result.control`. Automatic-mode changes appear in `result.controls`. A `modify-layout` write returns descriptors from fresh enumeration and sets `descriptors_refreshed=true`.
- Cancellation never returns partial success. The foundation transaction finishes or releases safely, and its next-call reread rule prevents cached assumptions about the physical value.

## Test Strategy

- Unit tests:
  - Cover boolean, integer/integer64, menu/integer-menu, button, string, and bitmask acceptance plus every invalid boundary; assert rejected and non-writable values issue no set.
  - Cover unknown, payload, compound, and array rejection; try-supported, try-unavailable, and try-rejected paths; exactly-once set; grouped read-back; target clamping; coupled automatic-mode changes; and `modify-layout` eviction, re-enumeration, and result flag.
  - Cover stable failure categories, safe messages, no submitted-string logging, write-time disconnect eviction, mandatory-read failure, same-device serialization, cross-device independence, and cancellation without partial-success reporting.
- Service/DB tests:
  - not applicable.
- GUI/controller tests, if applicable:
  - not applicable.
- Integrated route tests:
  - Construct a real `CameraConfig`, call public `set_control` through the injected mocked adapter, and assert adapter order, returned target, complete post-write snapshot, refresh flag, and categorized failure behavior. Private helpers cannot satisfy this route proof.
- Production-data rule:
  - Tests use foundation temporary identities, deterministic descriptors, and mocked adapter behavior and do not require production configuration, a physical camera, or a database.

## Acceptance Criteria

- Every supported scalar type is validated against its descriptor before driver access, and invalid, unsupported, inactive, grabbed, disabled, or read-only input never reaches `VIDIOC_S_EXT_CTRLS`.
- A valid write performs optional try, exactly one set, and mandatory grouped read-back inside one foundation per-device transaction and returns the driver's target and coupled values.
- Driver clamping and automatic-mode changes are visible in `V4L2ControlWriteResult`; a `modify-layout` control causes fresh descriptor enumeration and an explicit true refresh flag.
- Try, set, read-back, disconnect, and cancellation failures use the foundation-compatible stable categories, do not report partial success, and do not expose device paths, raw payloads, errno text, or submitted strings.
- Deterministic public-route tests prove same-device serialization, cross-device independence, exactly-once mutation, and off-event-loop adapter execution without hardware or production data.
- The child adds no HTTP, authorization, OpenAPI, UI, device-resolution, or foundation-read implementation responsibility.

## Readiness Checklist

- [x] Primary ancestor and architecture ancestor are explicit.
- [x] Review Score appears in the front matter and exactly matches the total in the final Review Score Calculation section.
- [x] The current implementation-spec template was loaded and its source path is recorded in the final Review Score Calculation section.
- [x] Review Score is adversarially recounted from the current spec text; prior scores are challenged instead of trusted.
- [x] Unresolved deferral/gap markers such as future spec, blocker, to be defined/TBD, not done, incomplete, unfinished, deferred, or later are either absent/resolved or counted as 100-point scoring events.
- [x] Source fields are carried into spec sections or preserved as explicit provenance/history.
- [x] Canonical status is explicit.
- [ ] Prerequisites are linked, implemented, or marked not applicable. The transaction/identity candidate exists but remains unapproved and unimplemented; the descriptor/live-read candidate does not yet exist.
- [x] Missing or stale prerequisite architecture discovered after the architecting phase has an ACD link, or is marked not applicable.
- [ ] Missing prerequisite behavior has a final spec link, or is marked not applicable. The descriptor/live-read final path is known, but its specification has not yet been authored.
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
- Prior recorded score: 23 from independent review pass `v4l2-validated-write-readback-pass-1`; adversarial input, not trusted for this revision.
- Adversarial rescore basis: recounted every category from the revised write-only child. One public method, one composed result model, the final provider prerequisites plus Linux ioctl operations, one observable result, six reused prerequisite contracts, one addition to the shared provider module, one serialized async transaction, one physical-write concern, one privacy concern, and one bounded-performance concern are counted. One missing-prerequisite event remains because the descriptor/live-read final specification defined by the supplied split plan does not yet exist; the transaction/identity candidate now exists but remains unapproved and unimplemented. Device discovery/read implementation, HTTP/auth/OpenAPI, and UI work remain excluded. At 23 points this candidate is in the explicit split-review band, but it remains cohesive because validation, one exactly-once set, mandatory read-back, and the returned write result form one transaction with one failure boundary and cannot be independently delivered without duplicating the mutation contract.
- Functions/methods: 1 x 2 = 2
- Data structures/models: 1 x 1 = 1
- Dependencies/services: 2 x 1 = 2
- Returns/outputs/signals: 1 x 1 = 1
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 6 x 0.5 = 3
- Adding code to an existing library/module: 1 x 1 = 1
- Creating a new reusable library/module: 0 x 3 = 0
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 1 x 3 = 3
- Destructive/write behavior: 1 x 3 = 3
- Security/privacy-sensitive behavior: 1 x 3 = 3
- Performance-sensitive behavior: 1 x 2 = 2
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 1 x 2 = 2
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: 23
- If total matches prior score, adversarial survival reason: the independent pass's implementation counts survive, and one missing-prerequisite event remains because the descriptor/live-read final specification does not exist. The concurrently authored transaction/identity candidate remains unapproved and unimplemented, so readiness still fails.
