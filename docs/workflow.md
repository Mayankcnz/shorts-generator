# Agent-assisted development workflow

## Ownership

The human chooses the product priority and judges whether the result meets the
need. The agent proposes technical steps, implements within authorized scope, and
supplies evidence. Ask for clarification on material product tradeoffs; routine
implementation does not require line-by-line approval. Instructions guide behavior;
tests and tools verify particular properties, not overall product correctness.

## The cycle

1. Define the user outcome before selecting technology.
2. Specify success, invalid input, failures, concurrency, and behavior to preserve.
3. Inspect relevant source, callers, contracts, and tests before editing.
4. Separate code facts, runtime observations, predictions, and unknowns.
5. Agree on a focused change; record unrelated findings in TODO.md.
6. Implement and inspect the diff for unintended changes.
7. Run appropriate checks and exercise the actual user journey.
8. Record what changed, what passed, what remains unverified, and the next priority.

Use the [multiple-job task](tasks/multiple-job-tracking.md) as an example.

## Reusable task brief

```text
Goal:
[Observable customer or system outcome.]

Observed problem and evidence:
[Current behavior, reproduction, relevant errors.]

Required behavior:
[Success and failure scenarios.]

Preserve:
[Existing behavior and contracts.]

Scope and non-goals:
[Boundaries, constraints, excluded work.]

Before editing:
Inspect code and tests. Separate confirmed findings from assumptions.
Explain material product/architecture tradeoffs and affected connections.

Implementation:
Make one focused, reviewable change within the agreed scope.

Verification and handoff:
Run relevant checks. Explain the diff, results, manual verification steps,
and remaining uncertainty. Distinguish mocks from live evidence.
```

## Investigation-only prompt

```text
Investigate without editing. Reproduce the failure and identify its stage.
Check the relevant callers and dependencies. Verify process, working
folder, port, source version, and database when runtime matters.
Separate facts from hypotheses. Propose the smallest experiment that
would distinguish likely causes. Report what you did not inspect.
```

## Review and learning prompts

```text
Review this diff against the acceptance scenarios, not against the
implementation's own assumptions. Identify lost behavior, incompatible
contracts, unsafe side effects, and unverified claims. Do not edit yet.
```

```text
I do not understand this finding. Explain it with an A/B timeline,
show the relevant code, and distinguish what it prevents from what
it does not solve. Do not edit yet.
```

```text
Let me implement the core logic. Give one hint at a time, then review
my attempt against our requirements before providing a full solution.
```

## Handling a discovered limitation

Record the problem, evidence, impact, desired outcome, and investigation in
TODO.md. Do not silently fix it inside another task. A possible next instruction:

```text
Record this as a separate backlog item. Do not implement it in this task.
Continue with the agreed frontend scope.
```

## Evidence and uncertainty

| Classification | Example | Next action |
| --- | --- | --- |
| Source finding | A submission clears the single job slot | Trace affected callers/state |
| Runtime observation | One worker launch chain exists at inspection time | Do not assume health or remote-worker count |
| Prediction | Enabling only the button would lose tracking of A | Verify in a test or controlled run |
| Hypothesis | Context truncation could affect model compliance | Inspect context and compare controlled inputs |
| Deferred requirement | Interrupted processing needs recovery | Record in backlog, prioritize explicitly |

Do not preserve old worker counts, PIDs, or job statuses as timeless facts. When a
hypothesis is tested, update its status with evidence, not just a more confident tone.

## Verification layers

- Unit tests: controlled logic and dependency boundaries; no accidental real tools.
- Route tests: input/output contracts; mocks do not prove database persistence.
- Database tests: use the separate test database and clean up only test-owned rows.
- End-to-end checks: run actual tools and verify the exercised customer flow.
- Content checks: compare transcript, selected passage, hook, and exported video.
- TypeScript/lint: static properties; not usefulness, grounding, or all runtime errors.

Run relevant checks after changes. Broaden testing when shared code or failures
justify it. Test that a regression test detects the original problem where practical.
Never weaken expectations merely because generated code behaves differently.

## Guardrails and useful mechanisms

| Mechanism | Responsibility |
| --- | --- |
| AGENTS.md | Recurring repository working instructions |
| Skills | Reusable procedures for relevant specialist tasks |
| Plugins/connectors | Tools and external access, not automatic code standards |
| Linters/types/tests | Mechanical checks for selected properties |
| CI | Consistent execution of configured checks before merging |

These are roles, not a claim that every tool or CI check is configured here.

## What remains: task versus project

For a task, compare required behavior with implementation and evidence. At project
milestones, review broader goals, functional capabilities, operational failure
handling, and usability. Code inspection and logs may reveal gaps absent from the
original requirements. Record unknowns rather than implying complete coverage.

For example: retry tests can prove a three-call cap with fake responses; they do
not establish better live editorial recommendations. Durable job rows do not
establish automatic recovery after a worker dies. See TODO.md and ADR 0002.

## Reviewable handoff

Report changed files, rationale, checks and exact results, baseline failures,
remaining limitations, and manual verification steps. Identify processes started
or stopped. Review `git diff` and staged paths; stage only intended files. Keep
private diagnostic output in ignored `diagnostics/`, with sanitized summaries here.

For interviews, distinguish what you observed, decided, delegated, implemented,
and verified. Do not present planned recovery, multi-job UI, or AWS as deployed.


## Prompt and model experiments

Use [the experiment index](experiments/README.md) and
[run template](experiments/run-template.md). Store raw evidence in ignored
`diagnostics/clip-selection/`; record sanitized observations, interpretations,
unknowns and next experiments in versioned docs. Exact request snapshots matter
more than reconstructed prompt names. Change one variable at a time when comparing.
