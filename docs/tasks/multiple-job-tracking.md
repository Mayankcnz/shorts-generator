# Multiple-job submission and tracking

- Status: Investigated; implementation pending.
- Last source inspection: 12 November 2026.
- Scope: Current page session only.

## Outcome

Users can submit Video B while Video A is queued or processing and retain
independent visibility of both jobs, their results, and errors.
Accepting multiple submissions is distinct from executing them simultaneously.

## Confirmed source findings

These are static findings, not a new runtime demonstration:

- `app/page.tsx` stores one `jobId`, one job response, and one shared error.
- The button is disabled when submitting, when the job is active, or input is empty.
- `submitVideo()` clears the current job ID and response before sending the POST.
- The effect tracks only the current ID. Cleanup clears its timer and marks old
  responses cancelled. This protects the replacement view but does not retain A.
- `POST /api/jobs` creates a row and responds with its ID; it does not wait for
  video processing. Status and results are retrieved by job ID.
- Each worker awaits processing before claiming its next job. Current worker
  count, health, and database state must be checked at runtime if relevant.

## Predicted behavior if only the button changes

Submitting B clears A's frontend tracking even if B's submission fails. A is not
cancelled on the backend. The old cancellation guard prevents a late A response
from updating the replacement view; cross-job overwrites are not established.
This particular button-only experiment has not been run for this record.

## Proposed smallest complete change

1. Keep URL input, POST-pending state, and submission errors in Home.
2. Store accepted entries `{ jobId, submittedUrl }`; append only after successful
   submission, without clearing earlier jobs. Deduplicate cards by returned job ID.
3. Use a tracker component keyed by ID, with its own polling, response, refresh
   error, and result rendering. No new state library or API is needed.
4. Disable Analyze only during a pending POST or empty/whitespace input; retain
   server-side validation. Snapshot the submitted URL for the accepted card.
5. Display submitted URL and loading/queued state before the first GET resolves.

This is a proposal, not completed implementation.

## Acceptance and regression scenarios

- Submit B while A's first GET is pending, while queued, and while processing.
- Both remain visible; interleaved responses update the correct card.
- Repeated clicks during a pending POST do not create extra submissions.
- Empty/whitespace input cannot submit; invalid URLs remain rejected by the server.
- Failed submission of B preserves A and permits a subsequent retry.
- Repeated returned job IDs produce one tracker, not duplicate cards.
- A completing or failing does not stop B's polling.
- A refresh error retries locally without clearing B's results or errors.
- Terminal jobs stop polling; unmount cleanup clears timers and ignores late responses.
- Existing transcript, formatted timestamps, clips, failure and no-clips displays remain.

## Out of scope

Worker concurrency, crash recovery, backend video deduplication, schema changes,
AWS, cancellation controls, reload recovery, and model-generation changes.
Per-card deduplication is not backend duplicate-video prevention.

## Verification plan and evidence status

Inspect `__tests__/unit/Home.test.tsx`; replace the old expectation that all new
submissions remain blocked while a job's first GET is pending. Add scenario tests
above, run relevant frontend/route tests and TypeScript checks, and review the diff.
Manually submit A and B with the intended dev server and worker active.

No implementation, new task-specific tests, or A/B runtime demonstration was
performed while creating this document. Existing test outcomes do not establish
that this frontend feature exists. Fill in actual commands, results, and remaining
uncertainty after implementation; do not mark complete on the strength of a plan.

## Open decisions

- Reload persistence is not part of this iteration; decide later whether required.
- Backend active-video deduplication needs its own integration and verification.
- Check whether the default ordering should remain submission order during review.
