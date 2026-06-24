---
title: "Health checks that don't lie: liveness, readiness, and the one-second rule"
description: 'A single /health endpoint is the wrong tool. Why conflating liveness and readiness causes restart storms and routes traffic into the void — and why every dependency check needs a 1-second timeout.'
pubDate: 2026-09-29
lang: 'en'
draft: true
tags: ['sre', 'observability', 'reliability', 'cloud', 'fastapi']
---

A health check that lies is worse than no health check at all. A green check that's secretly testing the wrong
thing will cheerfully tell your orchestrator "all good" while requests fail — or worse, it'll kill a perfectly
healthy instance because a dependency blipped for a second. I learned to take health endpoints seriously building
[Trinitrade](/trinitrade), where a wrong answer has a dollar cost. Here's the design that doesn't lie.

## One `/health` endpoint is the wrong tool

The most common mistake is a single `/health` that "checks everything" — the process, the database, the cache, the
broker — and returns one combined yes/no. It feels thorough. It's actually two completely different questions
crammed into one answer:

- **Liveness:** *Is this process alive?* If no, the right action is to **restart** it.
- **Readiness:** *Can this process serve a request right now?* If no, the right action is to **stop routing
  traffic** to it (but leave it running).

<figure>
  <img src="/blog/health-checks-that-dont-lie/two-questions.svg" alt="Liveness asks if the process is alive and its consumer restarts on failure; readiness asks if it can serve a request now and its consumer stops routing traffic on failure" loading="lazy" />
  <figcaption>Two different questions with two different consumers and two different remedies — restart vs. stop routing.</figcaption>
</figure>

Those remedies are opposites. Conflating them means one signal drives two contradictory actions, and you get the
wrong one at the worst time.

## Why conflating them causes a restart storm

Say your single `/health` checks the database, and the container platform uses it as the **liveness** probe (the
one that decides whether to restart). Now the database blips for a few seconds — a failover, a brief network
hiccup. Every instance's `/health` goes red. The platform concludes the processes are dead and **restarts all of
them** — even though every process was perfectly alive and would have recovered the moment the database came back.

<figure>
  <img src="/blog/health-checks-that-dont-lie/restart-storm.svg" alt="A single health endpoint that checks the database is used as the liveness probe; when the database blips, all instances report unhealthy, the platform restarts healthy processes, causing a restart storm" loading="lazy" />
  <figcaption>The restart storm — a dependency blip becomes a fleet-wide restart, turning a 5-second hiccup into an outage.</figcaption>
</figure>

You've taken a transient dependency blip and amplified it into a self-inflicted outage. Liveness should have said
"the process is fine" (because it was) and let readiness quietly pull the instances out of rotation until the
database returned.

## The split: shallow liveness, deep readiness

So I split them, always:

- **`/health/live`** — dependency-free. It returns `200 {"status": "alive"}` if the process is running and can
  execute code. Nothing else. This is what the container and load balancer use to decide *restart or not*.
- **`/health/ready`** — the deep check: database, cache, broker, critical workers. This decides *route traffic or
  not*. Its result is cached for a few seconds so a burst of probes doesn't hammer your dependencies.

<figure>
  <img src="/blog/health-checks-that-dont-lie/readiness-flow.svg" alt="The readiness endpoint checks database, cache, and broker, each wrapped in a one-second timeout, with the combined result cached for five seconds, returning ready or not-ready" loading="lazy" />
  <figcaption>Readiness — a deep check of each dependency, each time-boxed, with the result cached so probes stay cheap.</figcaption>
</figure>

## The one-second rule: a probe must never wait

Here's the detail that separates a robust health check from a dangerous one: **every dependency check inside
readiness gets its own timeout — one second is a good default.** A probe's job is a *fast yes/no*, not "wait
patiently for the database to recover." If you let a dependency check block without a cap, then under load — when
you most need a clear signal — your probe hangs, the platform's probe times out, and the ambiguity cascades.

<figure>
  <img src="/blog/health-checks-that-dont-lie/one-second-rule.svg" alt="Each dependency check is wrapped in a one-second timeout so the probe returns a fast yes or no; an unbounded wait would hang the probe under load and cascade" loading="lazy" />
  <figcaption>The one-second rule — cap every dependency check so the probe answers fast, even when a dependency is slow.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>A health probe answers a question so an automated system can take an action. Ask the <strong>wrong</strong>
  question (deep checks on the liveness probe) and the automation does the wrong thing — restarting healthy
  instances. A probe that can <em>hang</em> doesn't answer at all; bound every wait, or your fast yes/no becomes a
  slow maybe.</p>
</aside>

## The boring details that save you

A few practices that turned out to matter more than they look:

- **Keep a retrocompat alias when you rename paths.** Moving the load balancer's health path is a rolling change
  *and* it silently breaks any external uptime monitor pointed at the old one. Aliasing `/health/live` to the old
  `/health` costs nothing and avoids both.
- **Validate twice: unit tests and a post-deploy `curl`.** Mocks pass; real caches and timeouts can still trip.
  After deploy, hit each variant and watch the status code *and* the response time.
- **Exercise the deep path under load.** If your load test only hits the shallow probe, you'll stop noticing when
  readiness regresses. Add `/health/ready` to the mix with a generous threshold so it's tested but doesn't gate.

## The general lesson: a probe is a question, so ask the right one

None of this is framework-specific. A health endpoint is an interface between your service and an automated
decision — restart, route, page. The discipline is to **match the question to the action**: liveness drives
restarts, so it must be shallow and never fail on a dependency; readiness drives routing, so it checks
dependencies but never blocks. And everywhere a probe touches the outside world, **bound the wait** — because the
one time a dependency is slow is exactly the time you need an instant answer.

## References & further reading

- [Health check](https://en.wikipedia.org/wiki/Health_check) and Kubernetes [liveness and readiness probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).
- [Timeouts](https://en.wikipedia.org/wiki/Timeout_(computing)) and [cascading failure](https://en.wikipedia.org/wiki/Cascading_failure) — why unbounded waits are dangerous.
- [Load balancing](https://en.wikipedia.org/wiki/Load_balancing_(computing)) health checks and target groups.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the system these probes guard.
- Related: [don't page me at 3am for a system that's off](/blog/dont-page-me-at-3am) *(in the same SRE series)*.
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. Its split health probes and 1-second
dependency timeouts are real. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
