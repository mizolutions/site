---
title: 'CodeBuild runs in dash, not bash: the bashism that failed every build'
description: 'Every one of my CI builds failed on a single line — and it had nothing to do with my code. A bash-only construct in a shell that is not bash turned a passing check into a red build, and masked the real result for days.'
pubDate: 2026-09-01
lang: 'en'
draft: true
tags: ['devops', 'ci-cd', 'aws', 'bash', 'incident']
---

For a while, a daily check in my CI pipeline was failing every single run — and the failure had nothing to do
with what the check was actually testing. The script it ran **passed**. The build went **red** anyway, on a single
line of shell, because I'd written bash in a shell that isn't bash. Worse, the red build masked the real result
for days. Here's the footgun.

## The surprise: your buildspec isn't running bash

You write a CI buildspec, you write what looks like a shell script, and you reasonably assume it runs in bash —
because that's the shell on your laptop. On AWS CodeBuild, each command in a buildspec runs under **`/bin/sh`**,
which on the build image is **dash** (the Almquist shell), not bash. Dash is a lean, POSIX shell. It deliberately
*doesn't* implement bash's extensions — and that's where the trap springs.

<figure>
  <img src="/blog/codebuild-runs-in-dash-not-bash/dash-not-bash.svg" alt="You write what looks like a bash script in a CodeBuild buildspec, but each command runs under bin sh which is dash, so bash-only features are not available" loading="lazy" />
  <figcaption>The mismatch — you write bash, CodeBuild runs dash, and the bash-only bits quietly aren't there.</figcaption>
</figure>

## The bug: a one-line bashism that fails the build

My check ran a script and captured its exit status through a pipe, the way you would in bash:

```sh
./gate_a_check.sh | tee gate.log
RC=${PIPESTATUS[0]}     # <- bash-only array; dash has no idea what this is
```

`PIPESTATUS` is a bash array. Dash doesn't have it. So `${PIPESTATUS[0]}` isn't "the exit code of the first
command in the pipe" — it's a **syntax error**: `Bad substitution`, which exits non-zero. CodeBuild sees a command
exit non-zero and marks the **whole build FAILED** — regardless of what `gate_a_check.sh` actually returned.

<figure>
  <img src="/blog/codebuild-runs-in-dash-not-bash/bad-substitution.svg" alt="Under dash, PIPESTATUS array reference is a Bad substitution error that exits non-zero, so CodeBuild marks the build failed even though the real check script passed" loading="lazy" />
  <figcaption>The bashism itself fails — the build goes red on the bookkeeping line, not on the actual check.</figcaption>
</figure>

## The insidious part: a false red that masks the truth

This is what made it more than a typo. The check script itself **passed** — it reported all its checks green.
But the build went red on the line *after* it, the one meant to record the result. So:

- The real signal ("the system is healthy") said **pass**.
- The build said **fail**.
- A "no successful build recently" alarm, watching the build status, started firing — on a system that was
  actually fine.

I spent more time than I'd like to admit treating that alarm as a real failure before realizing the build had
never even evaluated the thing it was supposed to report. The bashism didn't just fail a build; it **inverted the
meaning** of a green check.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>A CI step's <strong>exit code</strong> is the only thing the platform believes — not your logs, not your
  intent. If a bookkeeping line exits non-zero, "PASS: 16, FAIL: 0" scrolling by just above it is invisible to the
  build. The exit code <em>is</em> the result.</p>
</aside>

## The fix: ask for bash explicitly, and propagate the real status

The fix is to stop assuming the shell and to capture the status the POSIX way. Wrap the pipeline in an explicit
bash invocation with `pipefail`, then read the standard `$?`:

```sh
bash -c 'set -o pipefail; ./gate_a_check.sh | tee gate.log'
RC=$?     # POSIX, works everywhere; pipefail makes the real status propagate through tee
```

`set -o pipefail` makes the pipeline's exit status the status of the **last command to fail**, so the check's real
result survives the `tee` — and `$?` reads it portably. No bash-only arrays, no surprises.

<figure>
  <img src="/blog/codebuild-runs-in-dash-not-bash/the-fix.svg" alt="Wrap the pipeline in bash -c with set -o pipefail, then read the POSIX dollar-question variable, so the real exit status of the check propagates through tee and the build reflects the true result" loading="lazy" />
  <figcaption>The fix — invoke bash explicitly, turn on pipefail, and read <code>$?</code> so the build reflects the real result.</figcaption>
</figure>

While I was at it, I swept the buildspec for the other dash gotchas: no `[[ ... ]]` (use `[ ... ]`), no arrays,
and `local` isn't guaranteed. Anything bash-specific has to live inside an explicit `bash -c`.

## A second, sneakier lesson: exit codes are a contract

There's a deeper point hiding here. A build that **exits 0 is SUCCEEDED**, no matter what it printed; a build that
exits non-zero is FAILED, no matter how healthy the system is. So exit codes aren't an afterthought — they're the
contract between your script and every alarm, dashboard, and gate downstream.

That cuts both ways. If a check can't run because the *environment* isn't ready (say, the system is intentionally
off), exiting non-zero would false-fire your quality alarms — the same inversion in reverse. The clean move is to
map "couldn't evaluate" to a **distinct, non-failing exit code** (a deliberate "skip"), so a real failure and an
absent environment never look the same.

<figure>
  <img src="/blog/codebuild-runs-in-dash-not-bash/exit-code-contract.svg" alt="exit 0 means succeeded no matter the logs, exit non-zero means failed no matter the system health, and an environment-not-ready case should map to a distinct skip code rather than a failure" loading="lazy" />
  <figcaption>Exit codes are the contract — and "environment not ready" deserves its own skip code, not a false failure.</figcaption>
</figure>

The universal lesson is the one every "works on my machine" bug teaches: **your script runs in the shell it
actually runs in, not the one you assumed.** CI environments are minimal on purpose. Don't assume bash, don't
assume your PATH, don't assume your locale — declare what you need, or port your script down to what's guaranteed.

## References & further reading

- [Almquist shell (dash)](https://en.wikipedia.org/wiki/Almquist_shell) vs [Bash](https://en.wikipedia.org/wiki/Bash_(Unix_shell)) — POSIX sh and its extensions.
- [Exit status](https://en.wikipedia.org/wiki/Exit_status) — the contract every CI platform reads.
- [Pipeline (Unix)](https://en.wikipedia.org/wiki/Pipeline_(Unix)) and `pipefail` — propagating status through a pipe.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the CI/CD pipeline behind this footgun.
- Related: [anything not in IaC will drift](/blog/anything-not-in-iac-drifts) and [never deploy a stateful service off-hours](/blog/never-deploy-stateful-off-hours).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. This footgun and its fix are documented as
dated records. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
