---
title: "Testing pitfalls that only bite in CI"
description: 'Some bugs pass every time on your machine and fail only in CI. The cause is almost always the same: hidden shared state plus a different execution order. Settings singletons, module-level locks, and random-order flakes — and how to reproduce them before they embarrass you.'
pubDate: 2027-02-02
lang: 'en'
draft: true
tags: ['testing', 'ci', 'python', 'pytest', 'debugging']
---

There's a special kind of frustrating bug: it passes every single time on your laptop, and fails in CI. You re-run
it locally, green. You stare at the CI log, red. On [Trinitrade](/trinitrade) I hit this family enough times to learn
that it almost always has one root cause — **hidden shared state meeting a different execution order** — and that CI
isn't being flaky; it's being a more honest test environment than your machine.

## Why "passes locally, fails in CI" is a category, not a fluke

Your local test run is the gentlest environment your code will ever see: tests usually run in a stable order, in one
process you've warmed up, often the same way every time. CI is harsher on purpose — it randomizes test order, runs in
a fresh process, sometimes in parallel. So when a test passes locally and fails in CI, the difference between the two
environments *is the bug report*. The most common difference is order: locally the tests happen to run in an order
that hides a shared-state problem; in CI's randomized order, they don't.

<figure>
  <img src="/blog/testing-pitfalls-ci/passes-local-fails-ci.svg" alt="Local runs use a stable test order that hides a shared-state problem, while CI randomizes the order and exposes it, so the difference between environments is the bug" loading="lazy" />
  <figcaption>A category, not a fluke — local's stable order hides shared state; CI's randomized order exposes it.</figcaption>
</figure>

## Pitfall 1: the settings singleton everyone shares

The classic. A configuration object is a cached singleton — one instance shared by every module that reads config.
A test reaches in and mutates a flag on it with a plain assignment to set up its scenario, and never restores it.
Locally, the test order happens to put that mutating test last, so nothing downstream notices. In CI's random order,
it runs *first*, and now every later test that reads that flag sees the polluted value and fails — tests that have
nothing to do with the one that broke them.

<figure>
  <img src="/blog/testing-pitfalls-ci/settings-pollution.svg" alt="A test mutates a flag on a shared cached settings singleton with a bare assignment and never restores it, so in random order later unrelated tests read the polluted value and fail" loading="lazy" />
  <figcaption>Settings pollution — a bare mutation of a shared singleton leaks into unrelated tests, but only in random order.</figcaption>
</figure>

The tell is that the *failing* tests aren't the one with the bug. You added a test that sets a flag, and three
unrelated, pre-existing tests went red. That's the signature of shared state being mutated without cleanup.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>When a new test makes <strong>other, unrelated tests fail</strong> — especially only in CI — suspect shared
  mutable state, not the new test's logic. Mutate any singleton or cached config through an auto-restoring fixture
  that undoes the change at teardown, never with a bare assignment. <em>The test that breaks is rarely the test with
  the bug.</em></p>
</aside>

## Pitfall 2: a module-level lock bound to a dead loop

The async cousin. A lock or other async object cached at module level is silently bound to the event loop it was
created on. With a test runner that creates a fresh loop per test, the second test to touch that cached object gets
one bound to a loop that's already been torn down — and an await on it never returns. Locally with a single test it's
fine; in CI's full random-order suite, it deadlocks until a timeout kills it, with no useful traceback. Same
fingerprint — fine alone, broken in company — different mechanism.

<figure>
  <img src="/blog/testing-pitfalls-ci/module-level-lock.svg" alt="A module-level async lock bound to one test's event loop is reused by a later test whose loop is different, so the await hangs until a timeout with no traceback" loading="lazy" />
  <figcaption>The async cousin — a module-level lock bound to a torn-down loop deadlocks the next test that touches it.</figcaption>
</figure>

## The fix: isolation and auto-restoring fixtures

Both pitfalls have the same cure: never let one test's state survive into another. Mutate shared configuration only
through a fixture that records the old value and restores it at teardown, so the change can't leak. Key any
loop-bound object by the current loop, or create it fresh per test, so it can't be reused across loops. The principle
is that every test must start from the same clean slate, regardless of what ran before it — which is exactly the
property CI's random order is checking for.

<figure>
  <img src="/blog/testing-pitfalls-ci/auto-restore-fix.svg" alt="An auto-restoring fixture records the original value, lets the test mutate it, and restores it at teardown so no state leaks between tests" loading="lazy" />
  <figcaption>The fix — an auto-restoring fixture records, lets the test mutate, and restores at teardown, so nothing leaks.</figcaption>
</figure>

## Reproduce it before it embarrasses you

The decisive habit is to stop running your tests in the gentle local mode and start running them the way CI does.
Randomize the order locally — and, crucially, when CI fails, **reuse the exact random seed from the failed run** so
you reproduce the same order deterministically. A bug that "only happens in CI" usually reproduces instantly once you
feed your local run the seed that broke it. Then it's just a normal bug, debuggable on your machine.

<figure>
  <img src="/blog/testing-pitfalls-ci/reproduce-with-seed.svg" alt="Reproducing a CI failure locally by taking the random seed from the failed CI run and running the test suite with that exact seed to get the same order" loading="lazy" />
  <figcaption>Reproduce with the seed — take the failing CI run's random seed and replay it locally to get the same order.</figcaption>
</figure>

A related habit: some concurrency tests use real sleeps to force a race, and those get flaky under busy CI runners
plus thread-based timeouts. Mark them as slow, keep them out of the fast gate, and run them deliberately rather than
letting deadline drift turn them into noise.

## The lesson: CI is the honest test, so make your local run as hostile as CI

The temptation is to dismiss CI-only failures as flakiness and re-run until green. That's exactly backwards. CI's
randomized, fresh-process, parallel environment is a *better* model of reality than your warm, ordered laptop — it's
finding real assumptions your code makes about order and shared state. The fix isn't to make CI gentler; it's to make
your local runs as hostile as CI, so these bugs surface on your machine where you can fix them, instead of in the
pipeline where they cost you a red build and an afternoon. Treat "passes locally, fails in CI" not as bad luck, but
as a precise message about hidden state.

## References & further reading

- [pytest-randomly](https://github.com/pytest-dev/pytest-randomly) — randomized order and reproducible seeds.
- [pytest fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html) and [monkeypatch](https://docs.pytest.org/en/stable/how-to/monkeypatch.html) — auto-restoring state.
- [Test isolation](https://en.wikipedia.org/wiki/Test_fixture#Software) and [flaky tests](https://en.wikipedia.org/wiki/Flaky_test).

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the test suite and the CI that exposed these.
- Related: [async SQLAlchemy with asyncpg](/blog/async-sqlalchemy-asyncpg-pitfalls) and [CI cascade debt](/blog/ci-cascade-debt).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. Every pitfall here is one I actually hit,
diagnosed, and fixed. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
