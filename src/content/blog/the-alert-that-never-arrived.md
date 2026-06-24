---
title: "The alert that fired but never arrived"
description: 'Your alarm did its job perfectly — and you still never found out, because the notification died on the way to your phone. The alarm firing and the alert arriving are two different reliability problems.'
pubDate: 2026-10-13
lang: 'en'
draft: true
tags: ['sre', 'observability', 'alerting', 'reliability', 'aws']
---

There's a particularly cruel failure mode in monitoring: the alarm fires, correctly, exactly as designed — and you
still don't find out, because the *notification* never reaches you. The condition was detected. The page was sent.
And somewhere between "the alarm fired" and "a human's phone buzzes," it quietly vanished. On
[Trinitrade](/trinitrade), this taught me to treat the path that *delivers* an alert as a first-class reliability
problem, separate from the alarm itself.

## "The alarm fired" is not the end of the story

Most people mentally stop at "I have an alarm for that." But an alarm firing and an alert *arriving* are two
different events, separated by a small distributed system. In my case, the path looked like this: a CloudWatch
alarm publishes to an SNS topic, which triggers a fan-out Lambda, which calls out to Telegram and Discord to
actually reach me.

<figure>
  <img src="/blog/the-alert-that-never-arrived/delivery-chain.svg" alt="An alarm publishes to SNS, which triggers a fan-out Lambda, which calls Telegram and Discord; every hop in the chain is a separate thing that can fail" loading="lazy" />
  <figcaption>The delivery chain — every hop between "alarm fired" and "phone buzzes" is a separate component that can fail.</figcaption>
</figure>

That's four hops, and **every one of them can fail independently of the alarm being correct.** The alarm is the
easy part. Getting its message all the way to a human is a delivery problem with its own failure modes.

## All the ways an alert silently dies

None of these touch the alarm; all of them eat the notification:

- The fan-out **Lambda throws** — a bad deploy, a timeout, an unhandled edge case — and the event is dropped.
- A **third party is down or rate-limiting.** Telegram or Discord has an outage, or you've sent too many messages
  and they start refusing.
- A **credential expired** — a bot token was rotated, a webhook was revoked — and the call fails with a 401 nobody
  is watching.
- A **destination disappeared** — the chat was deleted, the channel archived, the webhook URL went stale.

<figure>
  <img src="/blog/the-alert-that-never-arrived/silent-drop.svg" alt="The alarm fires correctly, but a failed hop in the delivery chain such as a Lambda error or a rate-limited third party means the human never hears about it" loading="lazy" />
  <figcaption>The silent drop — the alarm is right, a downstream hop fails, and the alert evaporates with no one the wiser.</figcaption>
</figure>

The cruelty is that this failure is **invisible by construction.** The system that was supposed to tell you
something is wrong is the very system that's broken — so it can't tell you it's broken. You find out the slow way:
by noticing the problem the alert should have caught, hours later.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>The alarm firing and the alert arriving are <strong>two different reliability problems</strong>. A perfect
  alarm behind a broken delivery path is worth exactly nothing. The notifier is not plumbing you can ignore — it's
  a critical system that, when it fails, fails <em>silently</em>.</p>
</aside>

## The fix: treat the notifier as a critical system

Once you accept that the delivery path can fail on its own, you protect it like anything else critical:

- **Redundant channels.** Fan out to more than one destination (Telegram *and* Discord, plus email) so a single
  third-party outage doesn't black you out.
- **A dead-letter queue.** When delivery fails, the message lands somewhere durable instead of vanishing, so you
  can see and replay what didn't get through.
- **Monitor the notifier itself.** Alarm on the fan-out Lambda's errors and throttles — the watcher needs a
  watcher.

<figure>
  <img src="/blog/the-alert-that-never-arrived/the-fix.svg" alt="Redundant delivery channels, a dead-letter queue for failed messages, and monitoring of the notifier Lambda's own errors make the delivery path resilient" loading="lazy" />
  <figcaption>Harden the delivery path — redundancy, a dead-letter queue, and alarms on the notifier's own errors.</figcaption>
</figure>

## Who watches the watcher? A heartbeat

Redundancy and dead-letter queues help, but they share a blind spot: they all assume *something* notices the
failure. The deepest version of this problem is silence — a delivery path that's been quietly dead for a week, and
you don't know because *no alert has needed to fire.* You can't distinguish "all healthy" from "the alerting is
broken" by absence alone.

The answer is a **heartbeat**: a tiny, independent signal that flows through the *entire* alerting path on a
schedule and proves it works end-to-end. If the heartbeat stops arriving, the alerting path itself is down —
detected by a separate, dead-simple mechanism that doesn't depend on the thing it's checking.

<figure>
  <img src="/blog/the-alert-that-never-arrived/heartbeat.svg" alt="A scheduled heartbeat flows through the whole alerting path end-to-end; if it stops arriving, a separate simple check concludes the alerting itself is broken" loading="lazy" />
  <figcaption>The heartbeat — a periodic signal through the whole path, so silence becomes a detectable signal instead of a blind spot.</figcaption>
</figure>

## The general lesson: monitor the thing that monitors

This is the meta-monitoring problem, and it shows up the moment your alerting has more than one hop:

- The **pager that's out of battery** is the analog version of the same bug.
- A **single notification channel** is a single point of failure for *every* alert you have.
- **Absence of alerts is ambiguous** — it means "all healthy" *or* "the alerting is dead," and only a heartbeat
  tells them apart.

The mental shift is to stop thinking of alerting as the safety net and start thinking of it as another production
system — one with the unusual property that when it fails, it fails quietly, and its whole job was to be loud.
Build the path to deliver alerts with the same paranoia you'd build the path to take an order. Then build one more
small thing whose only job is to prove that path is still alive.

## References & further reading

- [Amazon SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html) fan-out and [dead-letter queues](https://en.wikipedia.org/wiki/Dead_letter_queue).
- [Heartbeat (computing)](https://en.wikipedia.org/wiki/Heartbeat_(computing)) — proving a path is alive.
- [Single point of failure](https://en.wikipedia.org/wiki/Single_point_of_failure) — why one notification channel is risky.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the alarm and fan-out architecture behind this.
- Related: [don't page me at 3am](/blog/dont-page-me-at-3am) and [health checks that don't lie](/blog/health-checks-that-dont-lie) *(same SRE series)*.
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. Its multi-channel fan-out and heartbeat
are real. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
