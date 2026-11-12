# Project documentation

## Start here

- [Agent instructions](../AGENTS.md): recurring working rules, not feature status.
- [Workflow and reusable prompts](workflow.md): investigation, implementation,
  review, and handoff templates.
- [Project backlog](../TODO.md): deferred problems and future investigation.
- [Multiple-job tracking task](tasks/multiple-job-tracking.md): current scoped
  frontend work, findings, acceptance criteria, and verification gaps.

## Investigation history

- [Experiment index](experiments/README.md)
- [Clip-selection evidence and findings](experiments/clip-selection.md)
- [Prompt/model progression](experiments/prompt-history.md)
- [Run template](experiments/run-template.md)
- [Project evolution and lessons](project-history.md)

## Architecture decisions

- [ADR 0001](adr/0001-asynchronous-video-processing.md): original asynchronous
  design and future cloud considerations. Read with ADR 0002 for current state.
- [ADR 0002](adr/0002-local-postgresql-job-delivery.md): current local PostgreSQL
  polling boundary, alternatives, and limitations.

- [ADR 0003](adr/0003-segment-selection-and-bounded-validation-retries.md):
  implemented segment-ID resolution and bounded validation feedback; editorial
  reliability remains under evaluation.

## Where information belongs

| Information | Location | Git policy |
| --- | --- | --- |
| Recurring agent rules | AGENTS.md | Review and commit |
| Goal, scope, scenarios, findings | docs/tasks/ | Review and commit |
| Sanitized experiment findings | docs/experiments/ | Review and commit |
| Deferred problems | TODO.md | Review and commit |
| Significant architecture choices | docs/adr/ | Review and commit |
| Reusable prompts and review methods | docs/workflow.md | Review and commit |
| Raw private logs, transcripts, screenshots | diagnostics/ | Local and ignored |

Do not copy whole conversations into the repository. Summarize decisions and
sanitized evidence. Never commit credentials, connection strings, or private
transcripts. An ignored directory is not encryption, and ignore rules do not
remove previously tracked files or Git history.

Documentation is a dated record, not live state. Recheck source and runtime before
relying on a finding. No documentation entry makes a proposed feature implemented.
