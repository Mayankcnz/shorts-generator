# Prompt and model progression

Retrospective record: 12 November 2026. This is a chronology of approaches from the
conversation, not a complete exact prompt archive. Do not assign reconstructed
prompts to historical runs as though captured at execution time.

| Stage | Main change | Evidence boundary |
| --- | --- | --- |
| P01 | Detailed editorial instructions with gym/drone JSON example; Qwen 2.5 7B | Prompt inspected earlier; historical per-run snapshots incomplete |
| P02 | Removed gym example, grounding rules, explicit [] | No-speech guard separately blocks punctuation-only inputs |
| P03 | Explicit clip schema, English instruction | Structure improved in examples; invalid timing and language persisted |
| P04 | Shorter prompts and temporary 430-475 excerpt experiments | Prompt and input were not always varied independently |
| P05 | Up to 5, stronger duration calculation and complete-moment rules | Still reported invalid durations and empty outputs |
| P06 | Switched to Qwen 3 8B; added segment labels | Not a formal model comparison; numeric output contract initially remained |
| P07 | Segment-ID schema, labeled input, timestamp lookup | Correct IDs appeared; short ranges still rejected |
| P08 | Initial attempt plus at most two validation retries | Mocked behavior tested; live improvement still needs evaluation |

## Current implementation reference

See `lib/generateClipSuggestions.ts` and `lib/labelTranscriptSegments.ts` at the
repository root. Current prompt, schema and generation parameters are defined in
code; do not maintain a second hand-edited copy here that can silently diverge.
A dated exact source snapshot and extracted prompt template were saved locally
in ignored diagnostics during creation of this record. That snapshot is not an
actual rendered request: its transcript interpolation is still a placeholder.

## For future experiments

Before generation, save exact rendered request JSON (prompt, schema, model and
options), transcript hash, model digest, source commit/dirty status and context
configuration. Save the response envelope separately from its generated text.
Capture completion reason, prompt/evaluation counts and latency where available.
Use an experiment ID and run ID to connect them. Do not put private full transcripts
or secrets in versioned docs.

## Interpretation limits

Prompt rewriting, model changes, schema changes, and retries are distinct variables.
One successful run does not establish reliability. Repeated results are not proof
of caching. Different suggestion counts are valid under an up-to limit; assess
quality and compliance separately. More requirements can also encourage abstention,
but a returned [] alone does not demonstrate why the model abstained.
