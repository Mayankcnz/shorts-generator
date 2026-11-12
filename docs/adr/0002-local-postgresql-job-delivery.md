# ADR 0002: Use PostgreSQL polling for local job delivery

- Status: Accepted current implementation, documented retrospectively.
- Recorded: 12 November 2026. This is not the original implementation date.
- Related: [ADR 0001](0001-asynchronous-video-processing.md).

## Context

The implemented application persists analysis jobs and results in PostgreSQL.
A separate local worker polls for queued jobs. The present personal-use and
learning workload does not establish a requirement for a separate message broker.
ADR 0001 describes the asynchronous direction and possible later SQS use; those
future service references are not evidence of a running cloud deployment.

## Decision

Keep PostgreSQL as both durable state storage and local queued-work delivery.
`POST /api/jobs` inserts a queued row and returns HTTP 202. Each worker calls the
repository's transactional claim operation, selects the oldest unlocked queued
row with `FOR UPDATE SKIP LOCKED`, and marks it processing before committing.
It awaits analysis and completion/failure storage before its next claim.

The idle delay is used when no work is found, not after every processed job.
The row lock protects claiming; it is not held throughout video analysis.
Multiple workers may run, but their current count and health are runtime facts.

## Alternatives

- Keep the synchronous endpoint: simpler for local use, but ties response latency
  to processing and lacks this job-status boundary.
- Add a separate managed queue now: useful for independently deployed workers,
  but introduces credentials, delivery semantics, costs, and database-to-queue
  consistency concerns before a demonstrated operational need.

## Consequences and limits

- State and queued delivery share one local service; no separate message publish
  is required in this implementation.
- Polling adds database activity. Capacity and query behavior need measurement
  before changing infrastructure.
- Each worker executes one job at a time. Multi-job frontend tracking is a separate
  concern and is not completed by this decision.
- A worker crash after claiming can leave a job processing indefinitely; durable
  storage is not automatic recovery. See [backlog](../../TODO.md).
- Distinct jobs for the same video are not prevented by row claiming. The partial
  active-video index needs populated video IDs and repository conflict handling.
- Shared artifact paths and repeated side effects need review before treating
  multi-worker execution as fully safe.

## Revisit when

Independent worker deployment, measured polling overhead, burst buffering, or a
specific AWS learning objective justifies a queue. Before adding SQS, design for
message redelivery and the database-write/message-publish gap, for example with a
transactional outbox where appropriate. No SQS or recovery mechanism is implemented
by this documentation.

## Evidence boundary

This records source inspection of the submission endpoint, repository and worker
on the recorded date. It does not establish runtime health, throughput, deployed
worker count, or recovery behavior under crashes.
