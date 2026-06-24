---
title: 'Cascade debt: when one red pipeline is hiding eight problems'
description: 'A CI pipeline that has been red for weeks is not one bug — it is a stack of bugs hiding behind the first one. Why fail-fast conceals downstream debt, and how to surface the whole backlog at once instead of one painful PR at a time.'
pubDate: 2026-09-15
lang: 'en'
draft: true
tags: ['devops', 'ci-cd', 'engineering-discipline', 'technical-debt']
---

A CI pipeline that's been red for weeks looks like one problem. It almost never is. It's a **stack** of problems,
neatly hidden behind the first one — and the moment you fix that first failure, the pipeline reveals the next, and
the next. I reactivated a long-dead CI job on [Trinitrade](/trinitrade) expecting a quick fix and instead peeled
through **eight layers** of accumulated debt, one PR at a time. Here's why that happens and how to avoid the slow
version of it.

## Fail-fast hides everything downstream

CI pipelines are usually **fail-fast**: the first failing step stops the run, and the later steps never execute.
That's the right default — it saves time and gives a clear signal. But it has a side effect that bites hard when a
pipeline has been broken for a while: **if step 1 has been failing for weeks, steps 2 through N haven't run in
weeks either** — so any debt that accumulated in them is completely invisible.

<figure>
  <img src="/blog/ci-cascade-debt/fail-fast-hides.svg" alt="A fail-fast pipeline stops at the first failing step, so all later steps never run and their accumulated debt stays invisible" loading="lazy" />
  <figcaption>Fail-fast stops at the first failure — so everything downstream of it has been silently rotting, unseen.</figcaption>
</figure>

In my case, the original cause was external: a CI runner outage took the pipeline red. While it was down, normal
development kept moving — new code, new dependencies, new tests — none of it ever validated, because the pipeline
that would have caught the drift was stuck at step one.

## The incident: eight layers, discovered one at a time

When the runner came back, I fixed the obvious failure and re-ran. Green? No — it just got *further* before
failing again. Each fix revealed the next buried problem:

<figure>
  <img src="/blog/ci-cascade-debt/serial-discovery.svg" alt="Fixing the first failing step reveals the second, fixing that reveals the third, and so on down a staircase of eight separate fixes each requiring its own PR and run" loading="lazy" />
  <figcaption>Serial discovery — each fix is a full PR-and-run cycle that only buys you the right to see the next failure.</figcaption>
</figure>

A linter on one directory, then the same linter on another, then a formatter, then a dependency audit, then a
missing install step, then test *collection* errors, then a few real test regressions that had landed while nobody
was looking. Eight distinct fixes, each in its own pull request — and crucially, **I couldn't see fix #8 until I'd
shipped #1 through #7,** because each green step was the only thing that let the next step run at all.

That's the trap: not the eight problems themselves, but discovering them **serially**, paying a full review-and-run
cycle for each layer just to unlock the next.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>A long-red pipeline isn't "one thing to fix" — it's an <strong>unknown depth</strong> of debt. Fail-fast tells
  you the first problem and hides the count. Treat reactivation as an <em>audit</em>, not a quick fix.</p>
</aside>

## The fix: surface the whole backlog before you fix anything

The serial march is avoidable. Before opening the *first* cleanup PR, **run every pipeline step locally, in order,
and don't stop at the first failure.** Let each step fail, record it, and move to the next. In ten minutes you get
the entire backlog instead of discovering it over eight round-trips.

<figure>
  <img src="/blog/ci-cascade-debt/run-all-locally.svg" alt="Running every CI step locally in order without stopping at the first failure collects all eight failures into a single backlog you can plan and fix as a batch" loading="lazy" />
  <figcaption>The fix — run all steps locally, collect every failure, and plan the cleanup as one batch instead of a staircase.</figcaption>
</figure>

With the full list in hand, you can plan deliberately: one PR per *kind* of fix, in a sensible order, with an
accurate estimate — instead of telling your reviewer "should be the last one" for the fourth time. You turn an
open-ended excavation into a known, scoped piece of work.

## The general lesson: a long-red gate is an audit, not a bug

This pattern lives anywhere a fail-fast gate has been bypassed or broken for a while:

- **Re-enabling a disabled check** (a linter rule, a type checker, a security scan) that's been off long enough for
  violations to pile up behind it.
- **Un-skipping a quarantined test suite** that's been `@skip`-ped for months while the code it guards drifted.
- **Fixing a build that's been broken on a branch** nobody merged to in weeks.

<figure>
  <img src="/blog/ci-cascade-debt/audit-not-bug.svg" alt="A long-red gate is not one bug to fix but an unknown depth of debt, so reactivation should be treated as an audit" loading="lazy" />
  <figcaption>Reframe it — a long-red gate is depth, not a bug. Reactivation is an audit.</figcaption>
</figure>

In every case, the instinct to "just fix the one error" is the trap. The honest first move is to **measure the
depth**: run the whole thing, see every failure at once, and treat the cleanup as the multi-step project it
actually is. A red signal that's been red for a long time isn't telling you about one bug — it's telling you it
stopped being able to warn you about everything that came after.

## References & further reading

- [Fail-fast](https://en.wikipedia.org/wiki/Fail-fast) — the design that gives a clear signal and hides the depth.
- [Technical debt](https://en.wikipedia.org/wiki/Technical_debt) and the [broken windows theory](https://en.wikipedia.org/wiki/Broken_windows_theory) applied to a codebase.
- [Continuous integration](https://en.wikipedia.org/wiki/Continuous_integration) — why keeping the pipeline green continuously is the whole point.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the CI/CD pipeline this happened on.
- Related: [CodeBuild runs in dash, not bash](/blog/codebuild-runs-in-dash-not-bash) and [keyless CI with OIDC](/blog/keyless-ci-with-oidc).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. This cleanup was a real, dated sequence of
pull requests. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
