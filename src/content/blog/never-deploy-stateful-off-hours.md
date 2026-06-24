---
title: 'Never deploy a stateful service off-hours: the circuit-breaker rollback trap'
description: 'I shipped a one-line config change while my database was asleep. The deployment rolled itself back — correctly — and taught me that "deploy any time" is a lie for stateful services.'
pubDate: 2026-08-25
lang: 'en'
draft: true
tags: ['devops', 'aws', 'ecs', 'sre', 'incident']
---

To keep [Trinitrade](/trinitrade) cheap, a scheduler turns the whole system **off** at night and on weekends:
the database is stopped, the service is scaled to zero. It's the single biggest cost lever for a system that only
needs to run during market hours. It also set a trap I walked straight into — by trying to ship a harmless,
one-line config change while everything was asleep.

The deployment **rolled itself back.** And the frustrating, instructive part is that *every component did exactly
the right thing.* Here's the chain.

## The setup: a circuit breaker that auto-rolls-back

Production runs with two safety features that are individually excellent. The service runs **more than one task**
for availability, and it uses a **deployment circuit breaker** with automatic rollback: if a new deployment's
tasks can't become healthy, AWS aborts the rollout and reverts to the last good version. That's exactly what you
want in prod — a bad image should never take down the service; it should roll back on its own.

The container's startup sequence also does the right thing: on boot, before serving traffic, it runs database
migrations (`alembic upgrade head`) to guarantee the schema matches the code.

Each of these is a best practice. Together, off-hours, they form a trap.

## The incident: a deploy that couldn't possibly succeed

I made a tiny change — adding a feature flag — and ran `cdk deploy`. The database was stopped (it was off-hours).
Here's what unfolded:

<figure>
  <img src="/blog/never-deploy-stateful-off-hours/crash-loop.svg" alt="cdk deploy off-hours re-asserts the desired task count, new tasks start, the entrypoint runs database migrations, there is no database because RDS is stopped, tasks crash-loop, the circuit breaker trips, and the deployment rolls back" loading="lazy" />
  <figcaption>The chain — each step is correct on its own, and together they guarantee a rollback.</figcaption>
</figure>

1. `cdk deploy` re-asserted the service's desired state, including its task count, and started **new tasks** with
   the new configuration.
2. Each new task ran its startup migrations — which need the database.
3. The database was **stopped**. The migration couldn't connect. The task failed its startup and exited.
4. New task, same failure. **Crash loop.**
5. The deployment circuit breaker saw a rollout whose tasks never became healthy, did its job, and **rolled the
   whole deployment back** to the previous version.

My one-line change was gone — reverted by a safety mechanism that was working perfectly. The deploy never had a
chance: I'd asked the system to start containers that *cannot* start without a database, in a window where there
*is* no database.

## You can't win the race by waking the database mid-rollback

My first instinct was to start the database to rescue the in-flight deploy. It doesn't work. A stopped managed
database takes **several minutes** to come back to *available*; the circuit breaker evaluates task health on a
much shorter fuse. By the time the database is ready, the rollback has already fired.

<figure>
  <img src="/blog/never-deploy-stateful-off-hours/race.svg" alt="The database takes several minutes to wake to available, while the deployment circuit breaker evaluates failing tasks much faster, so the rollback fires before the database is ready" loading="lazy" />
  <figcaption>The race you can't win — the database wakes in minutes; the circuit breaker fires in less.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>The circuit breaker wasn't the bug — it was the <strong>only</strong> thing behaving like an emergency. The
  bug was deploying into an environment where success was <em>impossible</em>. A deploy has preconditions; if you
  ignore them, your safety mechanisms will faithfully reject a deploy that couldn't have worked.</p>
</aside>

## The fix: a deploy window, encoded as a rule

The fix isn't to weaken the circuit breaker or skip migrations — both are doing real work. The fix is to respect
the **precondition**: a stateful service can only be deployed when its state store is available.

So the rule, written into the runbook, is blunt: **never deploy a stateful service stack outside its ON window.**
Deploy when the system is up and the database is available; off-hours deploys are forbidden, full stop. The cost
scheduler that turns things off is wonderful for the bill and a landmine for deploys — so the two have to be
coordinated, not run blind.

<figure>
  <img src="/blog/never-deploy-stateful-off-hours/deploy-window.svg" alt="A deploy is only allowed when the system is ON and the database is available; off-hours, with the database stopped, deploys are forbidden because the new tasks cannot start" loading="lazy" />
  <figcaption>The rule — deploy inside the ON window only. Off-hours, the database is asleep and the deploy can't pass health.</figcaption>
</figure>

## The general lesson: deploys have an environment, not just an artifact

It's tempting to think of a deploy as "ship the new artifact." But a deploy also assumes an **environment** — and
for stateful services, that environment includes a reachable, ready data store. The same trap appears far beyond
cost schedulers:

- Deploying during a **maintenance window** when the database is in read-only or failover.
- A **rollout that runs migrations** pointed at a replica that's still catching up.
- **Health checks gating a rollout** the same way the circuit breaker did — correctly refusing to promote tasks
  that can't reach their dependencies.

The mature move is to make the precondition explicit: a preflight check that refuses to deploy unless the data
store is available, or a scheduler that *knows* it must wake state before it can ship. A safety mechanism rolling
you back isn't the system failing — it's the system telling you that you asked for the impossible. Listen to it,
and encode the precondition so you never ask again.

## References & further reading

- [Amazon ECS deployment circuit breaker](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html) — automatic rollback on unhealthy rollouts.
- [Database migration](https://en.wikipedia.org/wiki/Schema_migration) at startup, and [health checks](https://en.wikipedia.org/wiki/Health_check) gating rollouts.
- [Blue–green](https://en.wikipedia.org/wiki/Blue%E2%80%93green_deployment) and rolling deployments — and their environmental assumptions.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the architecture and the cost scheduler behind this trap.
- Related: [anything not in IaC will drift](/blog/anything-not-in-iac-drifts).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. This incident and its runbook rule are
documented as dated records. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
