# Project backlog

## Worker crash recovery

- Status: Backlog (identified 12 November 2026).
- Priority: Reassess before unattended deployment.

### Problem

A worker can exit after claiming a queued job and marking it `processing`.
Workers currently claim only `queued` rows, so the interrupted job can remain
`processing` indefinitely. Durable job storage alone does not provide recovery.

### Desired outcome

Interrupted jobs can recover without duplicating genuinely active work, and an
old worker cannot overwrite the outcome of a reclaimed job.

### Investigation

- Review claim expiry, heartbeats, retry limits, and terminal failure handling.
- Consider per-attempt ownership checks when storing results.
- Account for partial files and repeated external operations.
- Define acceptable manual recovery for local use before choosing automation.

### Acceptance scenarios for a future implementation

- A worker stops after claiming a test job; the agreed recovery mechanism
  eventually makes progress or records a terminal failure.
- A healthy, long-running job is not incorrectly reclaimed.
- A stale worker cannot update a job reclaimed by another worker.
- Repeated crashes respect retry limits and remain diagnosable.

### Scope

Separate from the multiple-job frontend change. This entry records a limitation
and investigation, not an implemented or verified recovery mechanism. Do not
bulk-reset `processing` jobs without establishing whether their workers are active.


## Multiple-job frontend tracking

- Status: Investigated; implementation pending.
- Task: [Scope, findings, scenarios and verification plan](docs/tasks/multiple-job-tracking.md).
- Outcome: Submit B while A is active without losing A's visibility.
- Excludes worker concurrency, crash recovery, and reload persistence.

## Active-video deduplication integration

- Status: Backlog; separate from per-card deduplication.
- Evidence: The partial index exists, but repository creation currently inserts
  only `videoUrl`; an unset `videoId` bypasses active-video uniqueness.
- Outcome: Equivalent URLs for the same active video reuse the existing job safely
  under concurrent submissions. Different videos remain independently accepted.
- Next: Review URL parsing, existing null IDs and active duplicates, repository
  conflict handling, and response compatibility. Define completed-job reuse policy
  explicitly before implementation.

## Recommendation evaluation

- Status: Ongoing evaluation; no claim of reliable editorial quality.
- Outcome: Measure structural validity, valid durations, grounded hooks, language
  compliance and human usefulness on accurate transcripts from different videos.
- Next: Keep inputs/model/settings fixed for comparisons and distinguish mocked
  retry tests from live model performance. Do not infer quality from completion alone.

## Export automation and cloud exploration

- Status: Future candidates; prioritize separately.
- A manual FFmpeg cut was reported working; an export button and worker-driven
  export are not established as implemented.
- S3/SQS or hosted workers need explicit learning or operational goals. Do not add
  them merely because asynchronous processing exists. See ADR 0002.


## Clip-selection reliability: next controlled experiments

- Status: Planned; grounded in [experiment history](docs/experiments/clip-selection.md).
- [Current decision](docs/adr/0003-segment-selection-and-bounded-validation-retries.md)
  covers segment-ID resolution and bounded validation retries, not a quality guarantee.
- Compare retry and no-retry behavior on fixed, accurate transcripts; record model
  digest, prompt/schema versions, context, call counts, latency and human review.
- Compare full input against short excerpts while changing only input length.
- Evaluate overlapping code-generated candidates with sentence-aware boundaries
  if model-selected ranges remain unreliable. Do not silently trim to a duration.
- Assess language compliance and exact/translated opening-hook grounding separately.
- Improve Hindi transcription only after checking source audio and current settings.
- Consider a suggestion-only rerun path and privacy-aware structured provenance logs;
  current diagnostic templates do not implement either feature.

## Suggestion cache and training: defer until justified

- Status: Future options, not implemented.
- If caching is introduced, key on transcript content/version, model identity,
  prompt/schema version and relevant generation settings. In-memory cache scope
  and invalidation must be explicit; existing transcript-file reuse is separate.
- Consider ranking-model training or Qwen fine-tuning only after reviewed examples
  and held-out-video evaluation establish a baseline and a justified need.
- Do not buy hardware or infer benefit from training without a measured comparison.
