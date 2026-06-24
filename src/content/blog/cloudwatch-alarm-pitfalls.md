---
title: "CloudWatch alarm pitfalls I learned the hard way"
description: 'An alarm that fires forever, a metric stream that is silently empty, a SEARCH expression that is rejected, and a monthly detector that is impossible to build. Five CloudWatch alarm traps and how to avoid each.'
pubDate: 2026-11-03
lang: 'en'
draft: true
tags: ['sre', 'observability', 'cloudwatch', 'aws', 'alerting']
---

CloudWatch alarms look simple: pick a metric, pick a threshold, get paged. But the simple surface hides a set of
traps that each cost me real debugging time on [Trinitrade](/trinitrade) — alarms that fired forever, streams that
were silently empty, expressions that were rejected at deploy, and a detector that was simply impossible to build as
designed. Here are five I won't make again.

## Pitfall 1: an empty dimension list is not "any dimension"

The first instinct, when you want an alarm that fires "if this metric crosses the threshold for *any* value of a
dimension," is to leave the dimension list empty. That is **not** what an empty dimension list means. An alarm with
no dimensions targets the **namespace aggregate stream** — a separate stream that is empty unless you explicitly
publish an undimensioned datapoint to it.

<figure>
  <img src="/blog/cloudwatch-alarm-pitfalls/empty-dimensions.svg" alt="An alarm with an empty dimension list reads the namespace aggregate stream, which stays empty unless code explicitly publishes an undimensioned datapoint, not 'any dimension'" loading="lazy" />
  <figcaption>An empty dimension list reads the aggregate stream — which stays empty unless you dual-emit an undimensioned datapoint.</figcaption>
</figure>

The fix is to **dual-emit** from your code: publish the metric once with its dimensions (for per-thing dashboards)
and once with no dimensions (for the aggregate alarm to read). The undimensioned stream doesn't populate itself.

## Pitfall 2: "treat missing as breaching" over an empty stream pages at minute one

This one compounds the first. If you create an alarm with `TreatMissingData = breaching` pointed at a stream that
has never received a datapoint, the alarm goes to **ALARM at minute one and stays there forever** — there's no data,
missing data is treated as a breach, so it's breaching. You ship it, and it pages immediately for a condition that
isn't real.

<figure>
  <img src="/blog/cloudwatch-alarm-pitfalls/treat-missing-breaching.svg" alt="An alarm with treat-missing-as-breaching pointed at a never-published metric stream goes to ALARM immediately and stays there, because missing data is treated as a breach" loading="lazy" />
  <figcaption>Treat-missing-breaching over an empty stream — instant, permanent false ALARM, because absence is read as breach.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>"0 datapoints" almost never means "the alarm is broken" — it usually means the alarm is reading the
  <strong>wrong stream</strong>, or the producer never published. Always validate a new alarm by deliberately
  emitting a probe metric after deploy. <em>Don't trust an alarm you haven't seen transition on real data.</em></p>
</aside>

## Pitfall 3: metric alarms do not support SEARCH expressions

When you want "alarm if *any* active dimension breaches," the elegant-looking tool is a `SEARCH` expression. It
works in dashboards. It works in composite alarms. It does **not** work in a plain metric alarm — the deploy fails
with `SEARCH is not supported on Metric Alarms`. And `cdk synth` won't catch it; it's a service-side rejection you
only see at create time.

<figure>
  <img src="/blog/cloudwatch-alarm-pitfalls/search-not-supported.svg" alt="A SEARCH expression works in dashboards and composite alarms but is rejected by plain metric alarms at deploy time, not caught by template synthesis" loading="lazy" />
  <figcaption>SEARCH works in dashboards and composite alarms, but a metric alarm rejects it — and only at deploy, not at synth.</figcaption>
</figure>

The workaround is the same dual-emit trick from pitfall 1: emit one dimensioned datapoint *and* one undimensioned
aggregate, and alarm on the aggregate. You replace a clever expression with a boring extra metric, and it actually
works.

## Pitfall 4: the alarm period must be at least the producer's cadence

If a metric is produced once a day — say a nightly batch job emits a success metric on a `cron` schedule — an alarm
with a 30-minute evaluation window will flap to ALARM for the ~23 hours a day when no fresh datapoint exists. The
**alarm period has to be at least as long as the interval between datapoints**, with margin. For a once-a-weekday
producer, that means a window over 24 hours, not 30 minutes.

<figure>
  <img src="/blog/cloudwatch-alarm-pitfalls/period-vs-cadence.svg" alt="A once-daily producer with a 30-minute alarm window flaps to ALARM for most of the day; the period must be at least the producer cadence plus margin" loading="lazy" />
  <figcaption>Period vs cadence — a short window over a slow producer flaps; size the period to the production interval plus margin.</figcaption>
</figure>

A related surprise: long-period alarms re-evaluate only at period boundaries, not every minute. After you fix a
broken producer, a multi-hour alarm can stay in its old state until the current bucket completes — so don't expect a
stale alarm to clear the instant you fix the thing it watches.

## Pitfall 5: a monthly detector is impossible as a single metric alarm

Here's the one that looks fine in dry-run and then rolls back on first real deploy. CloudWatch has a hard limit: for
alarms with a period of an hour or more, **`EvaluationPeriods × Period` must not exceed one week**. So a "no
successful run in 35 days" stale detector — a single alarm with a 35-day period — fails at create with `Metrics
cannot be checked across more than a week`. Template synthesis does not catch this; it's a service-side limit.

A monthly-cadence stale detector simply cannot be one metric alarm. You redesign it — a small scheduled function
that queries the age of the last run and emits a daily "age" heartbeat metric, then alarm on *that* — instead of
trying to widen the window past what the service allows.

## The thread through all five

Every one of these is the same underlying lesson: **an alarm is a small program with sharp edges, and a
green deploy is not a working alarm.** The template synthesizing, the stack deploying, even the alarm existing — none
of those prove it will fire correctly on real data. The only thing that proves it is watching it transition: emit a
probe, breach it on purpose, fix it, and confirm it clears. Treat every new alarm as unverified until you've seen it
go red and green on data you produced yourself.

## References & further reading

- [CloudWatch alarms and missing data](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html#alarms-and-missing-data) — the `treatMissingData` semantics.
- [Using metric math](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/using-metric-math.html) and [composite alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Create_Composite_Alarm.html) — where SEARCH belongs.
- [Publishing custom metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/publishingMetrics.html) — dimensions and the dual-emit pattern.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the alarm topology these lessons came from.
- Related: [SLOs for a system only you operate](/blog/slos-solo-operator) and [don't page me at 3am](/blog/dont-page-me-at-3am) *(same SRE series)*.
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. Every pitfall here is one I actually hit and
fixed. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
