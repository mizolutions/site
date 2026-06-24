---
title: "Scaling a trading system to zero on nights and weekends"
description: 'A system that only works during market hours has no business running 24/7. A scheduler that scales compute and the database to zero off-hours was the single biggest lever on my cloud bill — and it has to own the on/off switch, not you.'
pubDate: 2026-11-10
lang: 'en'
draft: true
tags: ['finops', 'aws', 'cost', 'ecs', 'rds']
---

The single most effective thing I did for my cloud bill on [Trinitrade](/trinitrade) wasn't picking cheaper
instances or chasing reserved-capacity discounts. It was much blunter: **turn the whole system off when it isn't
doing anything.** A trading system for US equities is only useful when the market is open — a few hours a day, five
days a week. The other ~80% of the week, every running container and database was burning money to do nothing.

## The usage pattern makes the decision for you

Look at *when* the system actually needs to be alive. US equity markets are open 6.5 hours a day, Monday to Friday.
Add a generous margin for pre-market preparation and post-close reconciliation and you're still well under
half the week. Yet the default for almost any deployment is to run continuously — 168 hours a week — regardless of
whether anyone or anything needs it.

<figure>
  <img src="/blog/scaling-to-zero-nights-weekends/usage-pattern.svg" alt="A week-long timeline showing the market open only during weekday daytime hours, while a 24/7 deployment runs continuously through nights and weekends doing nothing" loading="lazy" />
  <figcaption>The usage pattern — useful only during weekday market hours, yet a default deployment runs all 168 hours of the week.</figcaption>
</figure>

When most of your week is idle by design, the highest-leverage cost action isn't optimizing the running cost — it's
not running at all.

## Scaling to zero: turn off compute *and* the database

"Scaling to zero" means exactly that: during off-hours, the container service goes to a desired count of zero, and
the database is stopped, not just idle. The compute is usually the obvious target, but the database is often the
bigger always-on cost — a managed database instance bills whether or not a single query runs. Stopping both is what
makes the saving real.

<figure>
  <img src="/blog/scaling-to-zero-nights-weekends/scale-to-zero.svg" alt="A scheduler triggers two actions off-hours: the container service desired count goes to zero and the managed database is stopped, then both are restored before market open" loading="lazy" />
  <figcaption>Scale to zero — a scheduler stops both the container service and the database off-hours, and restores them before the open.</figcaption>
</figure>

A scheduled function does the work: on a stop trigger it sets the service to zero tasks and stops the database; on a
start trigger it brings the database back and scales the service up, with enough lead time before the open for the
database to become available and the app to warm up.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>The biggest FinOps win is often not making the running system cheaper — it's <strong>not running it when nobody
  needs it</strong>. For a system with a known schedule, scale-to-zero off-hours beats almost every per-resource
  optimization, because it removes the cost entirely instead of shaving it. <em>Don't optimize idle time — delete
  it.</em></p>
</aside>

## The weekly rhythm

The result is a clean weekly rhythm: the system wakes before market open each weekday, runs through the session and
its margins, sleeps overnight, and stays off entirely across the weekend. Nights and weekends — the bulk of the
calendar — cost essentially nothing.

<figure>
  <img src="/blog/scaling-to-zero-nights-weekends/weekly-rhythm.svg" alt="A weekly schedule where the system wakes before each weekday market open, sleeps each night, and stays completely off Saturday and Sunday" loading="lazy" />
  <figcaption>The weekly rhythm — awake for weekday sessions, asleep every night, fully off all weekend.</figcaption>
</figure>

There's a subtlety worth knowing: a stopped managed database doesn't stay stopped forever — the provider will
restart it after about a week if you never touch it. A weekly cadence sidesteps that automatically, because the
database gets started every Monday well within that window. A truly always-off resource needs a different design.

## The scheduler must own the switch — not you

Here's the operational rule that took me a moment to internalize: **the scheduler has to be authoritative.** If you
ever reach in and manually set the service to zero, you've created two sources of truth for "is the system on,"
and they will disagree. The next scheduled start might fight your manual state, or a deploy might silently
re-assert the wrong count.

<figure>
  <img src="/blog/scaling-to-zero-nights-weekends/authoritative-scheduler.svg" alt="Two paths to control on/off state: a manual override creates conflicting sources of truth, while routing every on/off action through the scheduler keeps one authority" loading="lazy" />
  <figcaption>One authority — route every on/off through the scheduler; a manual override creates a second, conflicting source of truth.</figcaption>
</figure>

So every on/off action goes through the scheduler. Want it on outside its window for a one-off? Trigger the
scheduler's start action, don't hand-edit the service. There's a related deploy trap here too: deploying a stateful
service while its database is stopped can crash-loop the new tasks (they can't reach the database on startup) and
roll your change back — so you do those deploys inside the on-window, with the database available, and let the
scheduler restore the off state afterward.

## The lesson: match spend to the schedule you actually have

A lot of FinOps advice is about shaving percentages off resources you've decided must run. That's worth doing — but
it's second-order. The first-order question is whether the resource needs to run *at all* right now. Any system with
a predictable schedule — business-hours apps, batch pipelines, anything tied to market or office hours — is
probably paying for a large block of guaranteed-idle time. Scaling that block to zero, with a scheduler that owns
the switch, is the cheapest big win in the whole discipline.

## References & further reading

- [Stopping and starting an Amazon RDS instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_StopInstance.html) — and the ~7-day auto-restart.
- [Scheduling Amazon ECS service auto scaling](https://docs.aws.amazon.com/autoscaling/application/userguide/examples-scheduled-actions.html) and [Amazon EventBridge schedules](https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html).
- [US market hours](https://www.nyse.com/markets/hours-calendars) — why the window is so small.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the scheduler and the cost architecture around it.
- Related: [never deploy a stateful service off-hours](/blog/never-deploy-stateful-off-hours) and [health checks that don't lie](/blog/health-checks-that-dont-lie).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The cost-auto-stop scheduler described here
is real and is the largest single line-item saving on the project. The sanitized source lives in the
[case study](/trinitrade) and the [public repository](https://github.com/mizolutions/trinitrade).*
