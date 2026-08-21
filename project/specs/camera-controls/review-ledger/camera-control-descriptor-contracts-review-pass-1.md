# Camera-Control Descriptor Contracts Independent Review Pass

Date: 2026-08-19
Pass identifier: `camera-control-descriptor-contracts-pass-1`
Result: `split_required`
Candidate: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`

## Artifacts Reread

- Candidate: `project/specs/camera-controls/camera-control-descriptor-contracts.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/camera-control-descriptor-contracts.test-spec.md`
- Candidate record: `project/specs/camera-controls/review-ledger/camera-control-descriptor-contracts-candidate.md`
- Direct parent: `project/specs/camera-controls/descriptor-control-renderer.spec.md`
- Direct parent split record: `project/specs/camera-controls/review-ledger/descriptor-control-renderer-review-pass-1.md`
- Shared API contract dependency: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`
- Architecture anchor: `project/architecture/acd/usb-v4l2-camera-controls.md`
- Current-runtime anchor: `project/architecture/current-camera-runtime.md`
- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`

The parent split record defines two sibling responsibilities, accessible value editors and setting-row state/unsupported presentation, but no active sibling candidate files exist on disk. Their definitions were read only from the direct parent split record for ownership and coverage.

## Pinned Scoring Authorities

- Template path: `../.agents/process/templates/implementation-spec-template.md`
- Supplied template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Verified template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Scoring-policy path: `../.agents/process/specification-review-scoring-policy.md`
- Supplied scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Verified scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Authority status: exact match; scoring is valid.

## Independent Review Score

The candidate's recorded 24 was treated as an untrusted claim. The fresh recount found eight distinct public data contracts rather than four. `DescriptorNormalizationResult`, `DescriptorEditorKind`, `DescriptorValidationResult`, and `DescriptorCommitCallback` are named public contracts with independently specified shapes or semantics; they cannot be omitted while `CameraControlValue`, another public union type, is counted as a model.

- Functions/methods: 3 x 2 = 6
  - `normalizeCameraControlDescriptor`
  - `getDescriptorEditorKind`
  - `validateDescriptorValue`
- Data structures/models: 8 x 1 = 8
  - `CameraControlValue`
  - `CameraControlMenuItem`
  - `CameraControlDescriptor`
  - `DescriptorControlState`
  - `DescriptorNormalizationResult`
  - `DescriptorEditorKind`
  - `DescriptorValidationResult`
  - `DescriptorCommitCallback`
- Dependencies/services: 1 x 1 = 1
  - authenticated read/shared API descriptor contract
- Returns/outputs/signals: 4 x 1 = 4
  - normalization result
  - editor-kind result
  - validation result
  - synchronous typed commit intent
- UI surfaces/components: 0 x 2 = 0
- UI fields/elements: 0 x 1 = 0
- Existing reusable code reused as-is: 0 x 0.5 = 0
- Adding code to an existing library/module: 0 x 1 = 0
- Creating a new reusable library/module: 2 x 3 = 6
  - `web/src/types/cameraControls.ts`
  - `web/src/utils/cameraControlDescriptors.ts`
- Database queries/tables/migrations: 0 x 2 = 0
- Async/concurrency behavior: 0 x 3 = 0
- Destructive/write behavior: 0 x 3 = 0
- Security/privacy-sensitive behavior: 1 x 3 = 3
  - fail closed for unsafe/unrepresentable payloads and omit raw payload, path, ioctl, and exception content
- Performance-sensitive behavior: 0 x 2 = 0
- Cross-screen reusable behavior: 0 x 2 = 0
- Readiness blockers: 0 x 2 = 0
- Missing prerequisites: 0 x 2 = 0
- Unresolved deferral/gap markers: 0 x 100 = 0
- Total: **28**
- If total matches prior score, adversarial survival reason: not applicable; the independent score is 28 rather than the recorded 24.

Because 28 is at or above the policy's forced-split threshold of 25, cohesion cannot preserve this as one final implementation leaf.

## Exact Split Plan

### Proposed child 1: Camera-Control Descriptor Wire Normalization And Effective State

- Proposed path: `project/specs/camera-controls/camera-control-descriptor-normalization.spec.md`
- Responsibility:
  - Own the shared API-wire mapping and the public `CameraControlValue`, `CameraControlMenuItem`, `CameraControlDescriptor`, `DescriptorControlState`, and `DescriptorNormalizationResult` contracts in `web/src/types/cameraControls.ts`.
  - Own `normalizeCameraControlDescriptor` in `web/src/utils/cameraControlDescriptors.ts`.
  - Own exact identity, scalar, menu, flags, element metadata, active, writable, and read-supported normalization; capability-reducing effective state; safe-integer and canonical-ID checks; and fail-closed handling for malformed, integer64, payload-bearing, compound, array, and unknown descriptors.
  - Own privacy-safe unsupported results and omission of raw payload bytes, device paths, ioctl structures, and raw server exceptions.
  - Own normalization/effective-state fixtures and tests, including all exact generated-schema fields, supported and unsupported families, malformed shapes, flag contradictions, and privacy omissions.
- Parent coverage:
  - Covers wire/frontend descriptor contracts, normalization, effective capability state, safe unsupported metadata, and normalization-level verification.

### Proposed child 2: Camera-Control Editor Kind, Value Validation, And Commit Intent

- Proposed path: `project/specs/camera-controls/camera-control-value-policy.spec.md`
- Responsibility:
  - Own `DescriptorEditorKind`, `DescriptorValidationResult`, and `DescriptorCommitCallback`, consuming child 1's descriptor and scalar contracts without redefining them.
  - Own `getDescriptorEditorKind` and `validateDescriptorValue` as additions to `web/src/utils/cameraControlDescriptors.ts`.
  - Own supported editor discrimination; inclusive range and positive-step policy; sparse menu and integer-menu membership; boolean, string, button-null, and bitmask validation; preservation of unknown set bits; stable local failure codes; effective-state denial; and the exact canonical-ID/value callback tuple.
  - Own editor-kind, candidate-validation, callback typing, and public consumer-harness tests. Invalid, denied, and unsupported cases must expose no commit value.
- Parent coverage:
  - Covers supported-type policy, value validation and normalization, validation outputs, callback/result contracts, and commit-policy verification.

## Split Coverage And Dependencies

- Candidate coverage status: **100% covered** by the two proposed children.
- Candidate responsibilities still uncovered: none.
- Inter-child dependency: child 2 depends on child 1's public normalized descriptor, scalar value, effective-state, and normalization-result contracts. Child 1 does not depend on child 2.
- Shared authoritative wire contract: `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`; both children consume its implemented generated descriptor schema, and neither owns or widens that API schema.
- Shared authoritative architecture: `project/architecture/acd/usb-v4l2-camera-controls.md`.
- Paired verification ownership:
  - Split `project/specs/camera-controls/tests/camera-control-descriptor-contracts.test-spec.md` into one paired test specification per proposed child.
  - Child 1 owns exact API-fixture normalization, effective state, malformed/unsupported handling, safe metadata, and privacy omission tests.
  - Child 2 owns editor-kind discrimination, all candidate-value rules and stable codes, unknown-bit preservation, callback typing/payload, and the public normalization-to-callback consumer route using child 1.
- Immediate parent coverage: the direct renderer parent's contract responsibility remains 100% allocated after this split. Its other two renderer child definitions remain owned by the existing parent split record.
- Original UI-parent coverage: **incomplete/ambiguous**, unchanged. `descriptor-driven-camera-controls-ui.spec.md` still lacks a durable split record naming all composition and request-orchestration children.
- New leaves: the two proposed definitions above; no child files were created in this pass.

## Findings And Gates

- Primary finding: four named public result/kind/callback contracts were omitted from the candidate's data-structure recount, raising the score from 24 to 28.
- Cohesion finding: the two proposed leaves retain a single authoritative type module and utility module while creating a clean dependency seam between wire normalization/effective state and consumer value/commit policy.
- Architecture gate: sufficient. The ACD defines descriptor metadata, effective states, supported editor mappings, driver authority, and fail-closed unknown-type handling.
- Evidence gate: no factual evidence gap blocks this split or deterministic verification.
- Readiness gate: the current candidate fails the mandatory sizing threshold. The proposed children require their own paired test specifications and fresh independent review before readiness can be established.
- Dependency gate: final frontend schema binding remains sequenced after independent acceptance and implementation of `project/specs/camera-controls/authenticated-camera-control-read-api.spec.md`.
- Parent-coverage gate: this candidate and its immediate renderer-parent responsibility are fully allocated by the exact split plans; aggregate coverage of the original UI parent remains incomplete/ambiguous outside this candidate's ownership.
- Revision-only findings: none separate from the required split.
- Architecture gaps: none.
- Evidence gaps: none.
