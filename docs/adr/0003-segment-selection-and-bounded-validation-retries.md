# ADR 0003: Resolve segment selections in code with bounded validation feedback

- Status: Accepted implemented approach; quality evaluation ongoing.
- Recorded retrospectively: 12 November 2026.
- Evidence: [Clip-selection history](../experiments/clip-selection.md).

## Context

Prompt-only duration instructions and model changes did not reliably produce
15-90-second selections. Correctly shaped JSON could still describe unsupported
content, use the wrong language, or select 2-second and 164-second ranges.

## Decision

Parse timestamped transcript segments and assign request-local IDs S1, S2, etc.
Use the same source segments for labeled prompt input, ID schema and timestamp
lookup. Ask the model for startSegmentId and endSegmentId plus editorial fields.
Resolve the range to numeric start/end for the existing frontend contract.

Reject unknown IDs, reversed selections, invalid/out-of-order source timestamps,
and durations outside 15-90 seconds. Keep the model qwen3:8b and five-item schema.

Allow an initial call and at most two validation retries. Append application-generated
feedback describing the failed ranges. Validate every attempt. Return valid clips
immediately when mixed valid/invalid results exist; do not retry simply to fill the
maximum count. An explicit [] is a valid final empty result. Transport and HTTP
errors are not retried by this validation loop. Exhaustion reports the latest reasons.

## Alternatives

- Stronger prompting alone: low implementation cost, but observed noncompliance.
- Automatic range extension/trimming: valid length can lose the setup or payoff.
- Code-generated overlapping candidates: stronger control but boundary quality and
  coverage need evaluation; not implemented as part of this decision.
- Different or fine-tuned models: requires comparison data; does not replace validation.

## Consequences

Timestamps come from source segments instead of model-invented numeric positions.
Duration remains a validator guarantee, not guaranteed model compliance. Retries
add latency and model work and may still fail. [] is execution success, not proof
of good editorial abstention. Partial success may return fewer suggestions.

Language accuracy, exact hook grounding, semantic continuity, transcript accuracy,
and usefulness are not guaranteed by IDs or schema. Do not present model scores as
calibrated confidence. Current logs may contain full raw responses; privacy-aware
logging and persisted provenance are future work, not installed by this document.

## Verification and revisit conditions

Mocked tests previously passed for resolution, invalid ranges, correction on calls
2/3, exhaustion, empty results and partial success. This document does not rerun
those checks. Measure live validity, usefulness, latency and empty rates on fixed
inputs before asserting improvement. Revisit if retries remain ineffective or long
inputs exceed runtime context capacity. See TODO.md for proposed experiments.
