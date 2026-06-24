---
title: "Don't page me at 3 a.m. for a system that's off on purpose"
description: 'The fastest way to make on-call ignore alerts is to page them for non-problems. How composite alarms and off-hours gating stop a deliberately-stopped system from crying wolf every single night.'
pubDate: 2026-10-06
lang: 'en'
draft: true
tags: ['sre', 'observability', 'alerting', 'cloud', 'aws']
---

There's a reliable way to destroy an alerting system: page a human for things that aren't problems. Do it enough
and they'll mute the channel, and then the *one* alert that mattered scrolls by unread. On
[Trinitrade](/trinitrade), my biggest source of false pages wasn't a flaky service — it was the system being
**off on purpose** and an alarm insisting that was an emergency.

## The setup: a system that's supposed to be off

To keep costs near zero, Trinitrade shuts down completely outside market hours — nights and weekends, the database
is stopped and the service is scaled to zero. That's the single biggest cost lever for a system that only needs to
run Monday to Friday.

It's also a minefield for naive alarms. "Running task count is zero"? Every night. "No requests in the last hour"?
Every night. "No successful build recently"? Every weekend. Each of these alarms is *technically correct* and
*completely useless* — the system is healthy; it's just asleep, exactly as designed.

<figure>
  <img src="/blog/dont-page-me-at-3am/false-page.svg" alt="A naive alarm watching running task count fires every night because the system is scaled to zero by design, producing a page for a non-problem" loading="lazy" />
  <figcaption>The false page — a naive "task count = 0" alarm fires nightly on a system that's off by design.</figcaption>
</figure>

## The real cost: alert fatigue

A false page isn't free, even though nothing broke. Every time an alarm cries wolf, it teaches you a little more
that *this alarm doesn't mean anything.* After a week of nightly pages, your brain has learned to dismiss it on
sight — and that reflex doesn't politely switch off on the night it's a real failure.

<figure>
  <img src="/blog/dont-page-me-at-3am/alert-fatigue.svg" alt="An alarm that fires every night trains on-call to mute it, so when a real failure happens the page is ignored along with all the false ones" loading="lazy" />
  <figcaption>Alert fatigue — cry wolf nightly and you train yourself to ignore the one night the wolf is real.</figcaption>
</figure>

An alarm that fires when nothing is wrong is worse than no alarm, because it actively erodes your trust in the
ones that matter.

## Fix 1: composite alarms — require two things to be true

The core mistake is alarming on a *symptom* without checking *context.* "Task count is zero" is only a problem if
the system is **supposed to be running.** So instead of paging on the raw symptom, I combine it with a condition
that captures intent: a **composite alarm** that fires only when the symptom is bad **and** the system should be
on.

<figure>
  <img src="/blog/dont-page-me-at-3am/composite-alarm.svg" alt="A composite alarm pages only when the symptom is bad AND the system should be running; if the system is intentionally off, the composite stays quiet" loading="lazy" />
  <figcaption>The composite alarm — page only when the symptom is bad AND the system is supposed to be up.</figcaption>
</figure>

Now "task count zero at 3 a.m." resolves to "expected, stay quiet," while "task count zero at 11 a.m. on a Tuesday"
resolves to "that's wrong, page me." Same symptom, opposite meaning, decided by context.

## Fix 2: gate the paging, don't disable the alarm

The tempting shortcut is to just *disable* the alarm at night. Don't. If you disable it, you also blind yourself
to off-hours problems you *do* care about (a backup that should run at 2 a.m., a scheduled job that failed). The
right move is to **gate the paging by the ON window** — the alarm still evaluates, but routing to a human is
suppressed when the system is intentionally down.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>An alarm's job is to fire when something is <strong>wrong</strong>, not when something is <em>different</em>.
  "Off" is not wrong if you turned it off on purpose. Encode <em>intent</em> — the ON window — into the alarm, so
  the same metric reads as "expected" or "emergency" depending on whether the system should be running.</p>
</aside>

<figure>
  <img src="/blog/dont-page-me-at-3am/off-hours-gating.svg" alt="During the ON window a bad symptom pages a human, while during the OFF window the same symptom is expected and the page is suppressed, but the alarm still evaluates" loading="lazy" />
  <figcaption>Off-hours gating — suppress the page when the system is intentionally off, but keep evaluating so real off-hours failures still surface.</figcaption>
</figure>

## The general lesson: alert on wrong, not on different

This is one instance of the oldest rule in good alerting: **every page must be actionable.** If the response to an
alert is "yep, that's expected, dismiss it," the alert is miscalibrated — it's measuring a *state*, not a
*problem*. The discipline is to push *intent* into the alarm:

- Alert on the **symptom that hurts users** (or, here, that means the system can't trade), not the raw metric.
- Encode **expected states** — maintenance windows, scale-to-zero schedules, planned downtime — so the alarm
  knows the difference between "off" and "broken."
- Keep evaluating during those windows; just **gate who gets woken up.**

Protecting a human's attention is a reliability concern, not a nicety. An on-call engineer who trusts every page
is faster and calmer than one who's learned to second-guess them. The cheapest way to earn that trust is to never
spend it on a 3 a.m. page about a system that's exactly where you left it: off.

## References & further reading

- [Alarm fatigue](https://en.wikipedia.org/wiki/Alarm_fatigue) — the human cost of crying wolf.
- [Amazon CloudWatch composite alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Create_Composite_Alarm.html) — combining conditions.
- The Google SRE book on [practical alerting](https://sre.google/sre-book/practical-alerting/) — every page should be actionable.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the cost scheduler and alarm design behind this.
- Related: [health checks that don't lie](/blog/health-checks-that-dont-lie) and [the alert that fired but never arrived](/blog/the-alert-that-never-arrived) *(same SRE series)*.
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. Its composite, off-hours-gated alarms are
real. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
