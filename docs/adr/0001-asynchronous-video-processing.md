# ADR 0001: Process video analysis asynchronously

- Status: Proposed
- Date: 2026-09-10

## Context

The application currently handles video analysis inside a single HTTP request.
The request remains open while the server downloads the video, extracts its
audio, transcribes it, and generates clip suggestions.

This is acceptable for the application's current single-user, local use case.
It would become unreliable in a multi-user environment because processing time
is long and unpredictable, every request can start resource-intensive child
processes immediately, and the application has no durable record of progress or
failure.

The project will implement an asynchronous version as a learning exercise. The
goal is to practise PostgreSQL, background processing, AWS services, API design,
testing, and observability without claiming that the additional infrastructure
is necessary for the current local use case.

## Decision drivers

- HTTP requests should return without waiting for video processing to finish.
- Processing concurrency must be controllable.
- Job status and results must survive application and worker restarts.
- Failed work must be observable and retryable.
- The frontend must be able to retrieve the latest job state.
- The first implementation must remain testable and runnable locally.

## Options considered

### 1. Keep synchronous request processing

The API would continue waiting for `analyzeVideo` to finish before returning a
response.

This is the simplest option and remains suitable for personal use. It does not
provide durable status, controlled concurrency, or reliable recovery from long
processing times and request timeouts.

### 2. Use PostgreSQL as both the database and work queue

The API would insert a queued job, and workers would poll PostgreSQL for work.

This avoids introducing a separate queue, but it requires careful locking so
that multiple workers do not claim the same job. Frequent polling also adds
database traffic and combines durable application storage with work delivery.

### 3. Use PostgreSQL for state and SQS for work delivery

The API would create a durable job record in PostgreSQL and send its identifier
to SQS. A worker would consume the message, run the processing workflow, and
update the PostgreSQL job record.

This adds infrastructure but gives the database and queue distinct
responsibilities.

## Decision

Use an asynchronous job model in which:

1. The API validates the video URL.
2. The API creates an `analysis_jobs` record with a `queued` status.
3. The API submits the job identifier for background processing.
4. The API returns `202 Accepted` with the job identifier.
5. A worker changes the status to `processing` and calls `analyzeVideo`.
6. The worker stores the result and changes the status to `completed`, or records
   the failure and changes the status to `failed`.
7. The frontend retrieves the latest state through a job-status endpoint.

PostgreSQL will be introduced locally first. SQS and an AWS-hosted worker will
be added only after the local database model and job API have been verified.

## Consequences

### Positive

- HTTP request duration is no longer tied to video-processing duration.
- PostgreSQL becomes the durable source of truth for job status and results.
- Work can be processed according to available worker capacity.
- Failed jobs can be diagnosed and retried.
- The API, workflow, queue, and persistence layers can be tested separately.
- Additional workers can be introduced without redesigning the public API.

### Negative

- The architecture contains more components and operational overhead.
- The frontend must handle eventual consistency and intermediate job states.
- Workers must tolerate duplicate message delivery and make processing
  idempotent.
- Publishing to SQS and writing to PostgreSQL create a dual-write consistency
  problem that may later require an outbox or reconciliation strategy.
- Queue depth, worker health, failures, and processing duration require
  monitoring.
- AWS infrastructure introduces deployment complexity and cost.

## Initial scope

The first milestone includes:

- Local PostgreSQL running through Docker
- `analysis_jobs` and `clip_suggestions` tables
- Database migrations
- A Node.js repository boundary
- `POST /api/jobs`
- `GET /api/jobs/:jobId`
- A locally runnable background worker
- Unit and integration tests

Authentication, user ownership, subscriptions, SQS, ECS, and production AWS
deployment are explicitly deferred to later milestones.

## Follow-up decisions

Separate ADRs should record:

- The PostgreSQL schema and indexing strategy
- Whether local workers poll PostgreSQL or use a development queue adapter
- The SQS retry, visibility-timeout, and dead-letter queue policy
- The compute environment used for production workers
- The storage location for videos, audio, transcripts, and generated clips
