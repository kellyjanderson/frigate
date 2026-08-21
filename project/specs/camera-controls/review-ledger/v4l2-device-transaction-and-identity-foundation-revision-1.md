# V4L2 Device Transaction And Identity Foundation Revision 1

Date: 2026-08-19
Status: awaiting_independent_review
Workflow: `frigate-camera-controls-20260819`
Dispatch: `dispatch-f6d3624a-476f-4406-bce6-18c7bc4dc223`
Review pass: `v4l2-device-transaction-identity-pass-1`

## Bounded Finding Resolution

- Configured-reference binding: `_V4L2IdentityRegistry` now owns a process-lifetime mapping from each accepted configured-reference SHA-256 digest to its first validated physical-identity key. Matching node renumbering/reconnect preserves it; a different identity cannot silently replace it.
- Atomic replacement update: transactions lease prior/candidate states, acquire distinct device locks in ascending identity-digest order, and recheck the binding version under the registry mutex. A mismatch atomically invalidates the prior state and records the rejected candidate while leaving the prior binding authoritative, so repeated replacement attempts fail closed.
- Lock and state lifetime: the registry mutex is never held while awaiting device locks or adapter I/O. State leases cover waiters and active/cancellation work. An unbound stale state/lock retires only after its final lease with empty cache; a prior-bound invalidated state remains authoritative for matching reconnect and deterministic rejection.
- Paired verification: deterministic races now cover snapshot/recheck, sorted multi-lock ordering, repeated replacement rejection, matching reconnect, and lease-safe stale-state retirement.

## Authority And Score

- Implementation-spec template: `../.agents/process/templates/implementation-spec-template.md`
- Template SHA-256: `0b14fb5d3ac0afcf9d65cb64c56f7f6f95675e59977a9268c955fac48a6c2b8b`
- Specification-review scoring policy: `../.agents/process/specification-review-scoring-policy.md`
- Scoring-policy SHA-256: `ba000278370df847a613f6678f0682fd0d828d14f5e42bdfae585b32d2405a0a`
- Provisional author Review Score: 22.5. The new explicit `_V4L2IdentityRegistry` adds one data-structure/model point; the prior readiness blocker is resolved. The score remains below the forced-split threshold, and the independent pass already found the transaction-safety boundary cohesive with no new leaf required.

## Artifacts

- Candidate: `project/specs/camera-controls/v4l2-device-transaction-and-identity-foundation.spec.md`
- Paired test specification: `project/specs/camera-controls/tests/v4l2-device-transaction-and-identity-foundation.test-spec.md`
- Candidate ledger record: `project/specs/camera-controls/review-ledger/v4l2-device-transaction-and-identity-foundation-candidate.md`
- Independent review evidence preserved unchanged: `project/specs/camera-controls/review-ledger/v4l2-device-transaction-and-identity-foundation-review-pass-1.md`
- Files changed by this revision are the candidate, paired test specification, candidate ledger record, and this unique revision record.

No independent approval is claimed. The revised candidate status is `awaiting_independent_review`.
