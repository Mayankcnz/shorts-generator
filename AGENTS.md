<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Shorts Generator project guidance

These are recurring working rules, not a declaration that every capability below
already exists. Read current code and TODO.md to establish implementation status.
Task-specific acceptance criteria belong in the task brief.

## Inspect and agree on the change

- Confirm the application repository before investigating or editing.
- Read relevant code, callers, contracts, and tests before making changes.
- Establish the intended outcome, acceptance scenarios, and existing behavior
  that must remain intact. Do not treat the implementation as the specification.
- Distinguish confirmed code findings, runtime observations, and assumptions.
- Explain material product or architecture tradeoffs before implementing them.
- Honor an investigation-only or learning-mode request without premature edits.

## Keep scope focused

- Make small, reviewable changes and preserve unrelated user edits.
- Record newly discovered out-of-scope limitations in TODO.md; do not silently
  expand the implementation to address them.
- Prefer the simplest solution that satisfies current requirements.
- Justify new dependencies, cloud services, and architecture boundaries.
- Keep generated artifacts and private material out of source commits; inspect
  staged files rather than staging unrelated changes indiscriminately.

## Architecture and frontend behavior

- Submission routes validate input, persist jobs, and respond promptly; downloading,
  transcription, and model generation belong in the worker.
- Keep external commands, filesystem access, and model calls replaceable in tests.
- Preserve existing API contracts unless the task explicitly changes them.
- Distinguish accepting multiple submissions from concurrent job execution.
- Distinguish an in-flight POST from an accepted job that is still processing.
- When implementing multiple-job tracking, retain earlier jobs and associate
  polling, results, and errors with the correct job ID. A failed new submission
  must not discard existing tracking.
- Clean up polling timers and ignore late responses after cleanup.
- Do not claim reload recovery, deduplication, or worker crash recovery without
  checking the complete implementation. Durable records alone do not provide recovery.
- For changes to job lifecycle behavior, review process failure points and identify
  work that could become stuck, lost, or duplicated. Record deferred requirements.

## Model output and transcript integrity

- Treat model responses as untrusted data. Keep prompt, schema, parser, and
  application validators consistent.
- Resolve segment IDs to source timestamps in code; preserve duration and range
  validation. Do not weaken validators merely to make generated output pass.
- Reject empty or punctuation-only transcripts before generation. This is not a
  guarantee that all remaining transcription is accurate.
- Distinguish explicit empty selections from malformed or invalid output.
- Bound validation retries, provide specific feedback, and preserve the agreed
  policy for mixed valid and invalid selections.
- Assess structural validity, grounding, language compliance, and editorial
  usefulness separately. Model scores are not calibrated confidence or performance.
- Preserve source media and transcript provenance during diagnosis. Make temporary
  excerpts and experiments explicit; do not silently overwrite diagnostic evidence.

## Evidence-driven debugging

- Reproduce failures and isolate the failing stage before changing unrelated code.
- Verify the active process, port, repository, environment, and database when
  runtime behavior differs from the source.
- Check worker launch chains when logs are missing; multiple related processes
  can represent one worker, while separate launches can consume different jobs.
- Worker source changes require restart unless a verified watch setup is active.
- Do not leave additional workers or servers running unintentionally. Report
  processes started or stopped and the services that remain running.
- Test external tools independently when useful, then verify the complete app.
- Avoid logging full private transcripts or secrets by default. Keep temporary
  diagnostics limited and remove them when no longer needed.

## Verification and handoff

- Test user-visible acceptance scenarios and relevant regression behavior.
- Ensure mocks replace the actual dependencies used; isolated tests must not
  accidentally download videos, write production files, or call live models.
- Run database integration tests against the separate test database. Clean up
  only test-owned rows; do not reset application data for convenience.
- Run relevant tests, TypeScript checks, and targeted lint after code changes.
  For documentation-only changes, review the diff and formatting instead.
- Review changed callers and contracts, not only the edited function.
- Report baseline failures separately from failures introduced by the change.
- Explain the change, evidence, limitations, and concrete manual verification steps.
- Distinguish mocked test results from live integration and model-quality evidence.
- Never present a proposed feature or unverified outcome as completed work.


## Documentation map

- Read docs/README.md for document locations and their Git/privacy policy.
- Use docs/workflow.md for reusable task and review prompts.
- Keep current task scope, findings, assumptions and verification in docs/tasks/.
- Keep deferred work in TODO.md; record significant decisions in docs/adr/.
- Store raw private debugging material only in ignored diagnostics/.
- Keep documentation status accurate; recording a plan does not implement it.
