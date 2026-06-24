---
title: "SLOs for a system only you operate"
description: 'Service level objectives are not just enterprise ceremony. Even for a system with exactly one operator and one user, a handful of measurable targets turn "it feels fine" into a decision tool for shipping, alerting, and investing.'
pubDate: 2026-10-27
lang: 'en'
draft: true
tags: ['sre', 'observability', 'slo', 'reliability', 'aws']
---

"SLOs" sound like something a large org with an on-call rotation and a reliability team invents to hold itself
accountable. So when you operate a system solo — one engineer, one user, you on both ends — it's tempting to skip
them. On [Trinitrade](/trinitrade) I wrote them anyway, and they turned out to be one of the highest-leverage
documents in the whole project: not a compliance contract, but a **decision tool**.

## What an SLO is actually for (when you're the only one)

A service level objective is just a measurable definition of "the system is healthy." For a solo operator, that
definition does three concrete jobs:

- **It decides whether a change can ship.** "Does this regress p95 latency past the target?" is a yes/no question
  only if you've written the target down.
- **It calibrates your alarms.** Thresholds should relate to the target, not be plucked from the air.
- **It justifies investment.** "Is it worth building high availability?" is answerable only against a stated
  availability objective.

<figure>
  <img src="/blog/slos-solo-operator/slo-decision-tool.svg" alt="An SLO feeds three decisions: whether a change can ship, how to calibrate alarms, and whether to invest in high availability" loading="lazy" />
  <figcaption>An SLO is a decision tool — it gates shipping, calibrates alarms, and justifies (or doesn't) investment.</figcaption>
</figure>

Without these targets you operate on vibes: "it feels fast enough," "it seems up." Vibes don't survive a 2 a.m.
incident or a "should I ship this?" moment. A number does.

## The anatomy of one SLO

Each of mine is a small, complete record. It's not enough to say "latency should be low"; the SLO is only useful if
it carries everything you need to act on it:

- **The source metric** — exactly what's measured and where (e.g. load-balancer response time for read endpoints).
- **The target** — a hard number with a window (p95 < 300 ms over 5 minutes).
- **The observed value** — what the system actually does today, measured under load, so you know your headroom.
- **The alarm** — which alert watches this, and at what threshold.
- **The action plan** — the ordered checklist to run *when* it breaches, written calmly in advance.

<figure>
  <img src="/blog/slos-solo-operator/slo-anatomy.svg" alt="Each SLO carries five parts: source metric, target with window, observed value, associated alarm, and a written action plan for when it breaches" loading="lazy" />
  <figcaption>The anatomy of an SLO — five parts, so a breach turns into a checklist instead of a panic.</figcaption>
</figure>

That last part is the one people skip, and it's the most valuable at 2 a.m.: a pre-written "if latency breaches,
check CPU, then the connection pool, then recent deploys" list means you're executing a plan, not improvising under
stress.

## The trick: your alarm threshold is *not* your SLO

Here's the most useful thing I learned writing these. The natural instinct is to alarm at the SLO target — if the
target is p95 < 300 ms, alarm at 300 ms. That gives you a screaming, noisy pager, because real systems brush their
targets constantly under normal jitter (GC pauses, a database blip, an autoscale event).

Instead, **set the alarm threshold deliberately above the SLO target.** My read-latency target is p95 < 300 ms; the
alarm fires at 1000 ms. The alarm means "the SLO has been violated *with margin* — this is real, wake up." For the
real-time SLO itself, you look at the dashboard, not the email.

<figure>
  <img src="/blog/slos-solo-operator/slo-vs-alarm.svg" alt="The healthy baseline sits well below the SLO target; the alarm threshold is set above the target so it only fires on a real, sustained breach, while the dashboard tracks the SLO in real time" loading="lazy" />
  <figcaption>Three distinct lines — baseline, SLO target, and a higher alarm threshold — so the pager fires on real breaches, and the dashboard tracks the SLO.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>The alarm threshold and the SLO target are <strong>different numbers on purpose</strong>. The SLO is what you
  promise; the alarm is the line past which a breach is undeniable. Setting them equal turns every bit of normal
  jitter into a page. <em>Watch the SLO on a dashboard; page only on a margin past it.</em></p>
</aside>

## Pick targets from your baseline, not your wishes

A target you pull from thin air is useless — too tight and you breach constantly, too loose and it never protects
you. The honest way is to measure the system under load first, then set the target as a multiple of the baseline.
Mine came out of a deliberate load campaign: observed read p95 was 53 ms, so a 300 ms target gives roughly six times
the headroom — tight enough to catch a real regression, loose enough to ignore normal noise.

This also gives you an **error budget**: if your availability target is 99.5%, you've explicitly allowed yourself a
small amount of downtime per month. That budget is permission — it's how you decide you *can* take a maintenance
window or ship a risky change, because you've quantified how much unreliability you can afford.

<figure>
  <img src="/blog/slos-solo-operator/error-budget.svg" alt="An availability target of 99.5 percent defines an error budget of allowed downtime per month, which is spent on maintenance windows and risky deploys" loading="lazy" />
  <figcaption>The error budget — a target below 100% is a feature, not a failure; it's the downtime you're allowed to spend.</figcaption>
</figure>

## The lesson: write the number down, even for an audience of one

The objection to SLOs for a solo system is "I'll know if it's slow." You won't, reliably — not under stress, not
when deciding whether to ship, not months later when you've forgotten what "normal" felt like. Writing down a dozen
measurable targets, each with its metric, its margin, its alarm, and its action plan, converts a pile of intuition
into something you can reason about, calibrate against, and hand to a future version of yourself who has forgotten
all the context. That's worth doing even when the only person you're being accountable to is you.

## References & further reading

- The [Google SRE book on SLOs](https://sre.google/sre-book/service-level-objectives/) and [error budgets](https://sre.google/workbook/error-budget-policy/) — the canonical treatment.
- [Percentile latency](https://en.wikipedia.org/wiki/Percentile) — why p95/p99, not averages.
- [Amazon CloudWatch alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html) — where the thresholds live.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the SLO document and load campaign behind this.
- Related: [a traffic-light incident wall in Grafana](/blog/incident-wall-grafana-zero-cost) and [health checks that don't lie](/blog/health-checks-that-dont-lie) *(same SRE series)*.
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The SLOs and the load campaign that
calibrated them are real. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
