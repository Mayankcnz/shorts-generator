# Project evolution and lessons

Retrospective summary recorded 12 November 2026. Evidence comes from the project
conversation and inspected source. This is not a complete chronological Git audit.

## Product and architecture

1. Personal need: help find useful short-form passages in long YouTube videos.
   Suggestions are not automatically edited vertical videos.
2. Initial local synchronous endpoint: downloading, FFmpeg audio extraction,
   Python/Whisper transcription and model generation ran before HTTP response.
3. Separation of responsibilities: HTTP route, analyzeVideo orchestration and
   real external dependencies. Injection permits isolated workflow tests; module
   mocks permit route tests. The exact original disconnected-mock incident has
   not been independently reconstructed from Git; do not overclaim its history.
4. Asynchronous jobs: PostgreSQL stores queued/processing/completed/failed state;
   a local worker claims and processes work. See ADRs 0001 and 0002.
5. Current quality work: no-speech guard, schema, segment selection and bounded
   feedback. See the experiment log and ADR 0003.

## Runtime and dependency debugging

- Missing POST handler: at different inspections the route contained misplaced
  test code, later an empty skeleton. Handler restoration and route tests followed.
- Source/runtime mismatch: an earlier production server still answered on port
  3000 while development source differed. Confirm the process before explanations.
- Download HTTP 403: same command failed outside the app. User confirmed Homebrew
  upgrade of yt-dlp made the direct download work. This supports a version-related
  explanation, not a proven upstream root-cause analysis. End-to-end verification
  was separate from downloading.
- Stale worker: code loaded before the no-speech fix continued consuming new jobs.
  Restarted worker rejected the reused punctuation-only transcript. Saved files
  and code loaded in a process are different kinds of reuse.
- Missing logs: two independent launches could consume different jobs. Stopping
  the extra agent-started worker restored a single intended consumer. Related
  npm/tsx/Node processes can represent one worker; old PIDs are not current state.
- Connection refused on 5432: PostgreSQL unavailable; Docker daemon was also stopped
  in a reported run. Startup order matters. A process existing does not prove health.

## Frontend product review

A button restriction prevented any further submissions during processing. The
human questioned it against the asynchronous product goal. Inspection showed
single-job state also discards earlier tracking, so changing the button alone is
incomplete. Existing cancellation cleanup prevents stale-view updates, not backend
cancellation. See the multiple-job task; implementation remains pending in this record.

## Output and export

Instrumental audio produced an unsupported prompt-example story. Raw response
inspection distinguished model generation from UI display. Hindi-input anomalies
require audio comparison; later English house-competition input was more coherent.
Malformed structures, Chinese responses, short/long ranges, repeated subjective
scores and empty arrays demonstrate separate quality dimensions.

User reported a successful suggestion at 07:17-07:44 and a manual FFmpeg export:
start 437 seconds, duration 27. This is not an automated export UI, captions, or
vertical reframing. Recheck the actual output file before a demonstration.

## Workflow and repository hygiene

- Separate user goals, functional scenarios and operating assumptions.
- Document current code facts, runtime observations, hypotheses and unknowns.
- Preserve existing behavior; do not test only the generated implementation's intent.
- Stage focused changes; generated CV files were inadvertently included historically.
  Removing tracking and adding ignore rules does not remove old Git history.
- Recurring rules live in AGENTS.md; tasks in docs/tasks; deferred gaps in TODO.md;
  decisions in ADRs; raw/private evidence in ignored diagnostics.

## Current status boundary

No new live tests were run while writing this history. Do not infer today's worker
count, service health, model quality, or completed frontend capability from earlier
results. Automatic crash recovery, full deduplication integration, reload recovery,
automatic export, AWS deployment and training/fine-tuning remain separate future work.
