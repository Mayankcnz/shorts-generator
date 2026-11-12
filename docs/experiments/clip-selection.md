# Clip-selection investigation and experiment history

Recorded retrospectively: 12 November 2026, Australia/Melbourne.

## Evidence policy

This consolidates the conversation, user-provided terminal output and source
inspection. Entries are not all controlled experiments. Exact prompts, model
versions, generation metadata and dates were not retained for every run. Unknown
values remain unknown. Do not infer causation from improvements after multiple
simultaneous edits. No new live generation was performed for this documentation.

The historical job IDs identify discussion examples, not freshly queried database
state. A local evidence index in ignored `diagnostics/clip-selection/` links retained
attachments and explicitly marks copied excerpts. Current source snapshots are
later captures, not reconstructions of the source used by old jobs.

## E01 - Instrumental input produced an unsupported gym story

- Evidence: Punctuation-only transcript; user confirmed instrumental music without
  lyrics. Worker output showed the gym/drone response. Failed download job
  `d0f0fa19-7487-415d-9f33-7fd33a59d1fc` and later completed generation job
  `286d4d4a-a9de-4a23-9922-3139d272b8d9` were distinct runs.
- Observation: A model-generated hook matched the gym/drone example in the prompt.
- Interpretation: Strong evidence of example contamination, not content discovered
  in the song. This does not prove the precise internal generation mechanism.
- Change: Reject empty/punctuation-only speech after stripping timestamp metadata;
  remove the specific narrative example; allow explicit empty selections.
- Verification: After restarting an outdated worker, fresh job
  `59f2cee5-7128-4ce0-a883-3586fb98d205` returned no-speech failure and no clips.
  User subsequently reported another expected no-speech failure.
- Limit: The guard detects absent lexical content, not all transcription errors.

## E02 - Unexpected transcript-shaped JSON

- Evidence: Job `9569b28a-c65c-4b1c-8bfc-075a4a45a1e4`; raw response was an object
  with a `transcript` array, `time` pairs and `text`, not clip objects.
- Observation: Application validation rejected the response.
- Interpretation: Output-contract noncompliance. Generic JSON mode allowed a JSON
  shape unrelated to the requested clip fields.
- Not established: Whether input accuracy, prompt length, runtime context or another
  factor caused the model to ignore the task.
- Follow-up: Add explicit schema; retain parser/application checks and malformed
  response regression coverage. Current tests include transcript-shaped output.

## E03 - Chinese dialogue instead of suggestions

- Evidence: User supplied an object whose Chinese key means dialogue content.
- Observation: Valid JSON contained dialogue, not the required clip schema.
- Interpretation: A task/format/language mismatch, not proof of a transport failure.
- Limitation: Request/response pairing and exact runtime configuration were not
  retained for that example. The raw output cannot establish what Whisper heard.

## E04 - Questionable Hindi transcription

- Evidence: Logged request had 11,226 transcript characters and abrupt multilingual
  passages. User stated that the creator spoke Hindi.
- Observation: Input was suspicious and required comparison with the audio.
- Interpretation: Possible transcription inaccuracy; not a universal explanation
  for later errors. A different house-competition transcript was more coherent.
- Deferred: Test accurate short Hindi passages with explicit language configuration
  and separate output paths. No completed language-accuracy study is established.
- Logging note: Node's `... more characters` display does not prove request or model
  context truncation. Characters are not tokens.

## E05 - Schema improved shape, not timing or grounding

- Change: Replaced generic JSON mode with a clip-array schema.
- Observation: Structured objects appeared, sometimes in Chinese, with oversized
  summary hooks and titles referring outside the selected interval.
- Examples: `515-524` is 9 seconds; `515-679` is 164 seconds. The latter occurred
  in job `3e17b78b-f4b2-4b03-a809-784b032493c6`. Other reported selections lasted
  111, 14 and 152 seconds.
- Result: Duration validation correctly rejected out-of-range clips. Later error
  messages included the reason rather than only a generic failure.
- Interpretation: Schema conformance is distinct from arithmetic, language,
  grounding and editorial quality. Do not relax duration limits to obtain success.
- Further observation: A Chinese suggestion had valid 25-second timing but an
  apparently unsupported episode number. Duration alone is insufficient.

## E06 - Prompt experiments and explicit empty results

- Variants: Long editorial instructions, shortened instructions, stricter timing
  reminders, English rules and temporary excerpt input. See prompt-history.md.
- Observation: User reported working excerpt suggestions and also `[]` for the full
  transcript, including job `ec136ed3-3dab-42ca-89a6-922171e978f2`.
- Interpretation: Empty-array handling worked; editorial abstention quality was not
  established. Comparing a simplified excerpt prompt with a full old prompt
  changes multiple variables and cannot isolate the cause of improvement.
- Not established: That all empty results are reasonable, or that context capacity
  caused the response drift. Inspect allocated context and generation metadata.

## E07 - Model switch and sentence-by-sentence selection

- Change: Qwen 2.5 7B to Qwen 3 8B. Gemma was suggested, not established as tested.
- Evidence: Job `02a962f5-37a2-4ee5-8635-29f33efcc7a9` returned five neighboring
  sentence-length ranges: 515-517, 517-520, 520-522, 522-524 and 524-526.
- Observation: English and expected fields, but 2-3-second fragments with repeated
  scores of seven and generic explanations.
- Interpretation: The model selected transcript lines rather than standalone
  moments. Repeated sevens may reflect source rating language; not proven.
- Limit: Model swap was not a controlled comparison or proof of overall superiority.

## E08 - Segment labels and contract alignment

- Stage 1: Added S1, S2, etc. to model input. Numeric output remained; labels alone
  did not move timestamp selection into code.
- Found mismatch: Prompt requested IDs while schema expected numbers; at one point
  the prompt still interpolated the unlabeled transcript.
- Stage 2 implemented: Shared parser supplies IDs, schema permits actual IDs, prompt
  requests continuous segment ranges, and code resolves IDs to original seconds.
  Frontend/database clip shape stays numeric. Unknown/reversed IDs, invalid source
  order and 15-90-second violations are rejected.
- Evidence: Job `73d0873d-9272-45ba-a854-bb2890864bad` returned ID selections, but
  resolved ranges lasted 4, 4, 5, 4 and 4 seconds and were rejected.
- Interpretation: Contract alignment and ID lookup worked; editorial and duration
  selection remained unreliable. Hooks were summaries, not source openings.

## E09 - Bounded validation feedback

- Implemented: At most three calls: initial plus two retries. Feedback includes
  rejected segment ranges and concrete validation errors. Each attempt is validated.
- Mixed-result policy: Return valid clips immediately and discard invalid ones.
  Do not regenerate valid selections merely to fill the count.
- Explicit []: Valid final empty result, including on a retry.
- Transport/HTTP failures: Not retried by this selection-validation loop.
- Verification: Historical automated run reported 64 tests passing, TypeScript and
  targeted lint passing. Mocks exercised success on calls 2/3, exhaustion at 3,
  partial success at 1, malformed output correction and empty results.
- Limit: Live retry effectiveness and editorial improvement have not been established.
  Historical test counts are not a new assertion about current runtime health.

## What to measure next

Use accurate transcripts from whole held-out videos and stable configurations.
Record valid-range rate, malformed-response rate, explicit empty rate, grounded
hooks/titles, human usefulness, latency and call count. Record denominator and
review criteria. Keep model version, prompt, schema, input and context fixed when
changing one variable. Reference selections are evaluation examples, not training
unless deliberately included in a training procedure.

## Alternatives not yet implemented

- Code-generated overlapping candidates around sentence/segment boundaries.
- Better segment-range selection with wider context and explicit feedback.
- A separate suggestion-only workflow to repeat generation without a whole job.
- Persisted model/prompt/config provenance and reproducible evaluation harness.
- Ranking-model training or Qwen fine-tuning after collecting reviewed data.
- Suggestion caching keyed by transcript content, prompt, model and settings.

None should be described as a completed quality improvement. We still need
source/video checks: valid JSON, English and duration do not establish a good clip.
