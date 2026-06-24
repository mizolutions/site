---
title: "Your monthly cloud bill is an SLO"
description: 'Most teams treat the cloud bill as a monthly surprise to dread. Treat it instead like any other service level objective — a target, a metric, an alarm — and a runaway cost becomes an early signal that something is broken, not a month-end shock.'
pubDate: 2026-11-17
lang: 'en'
draft: true
tags: ['finops', 'aws', 'cost', 'observability', 'slo']
---

The cloud bill is usually the one number nobody monitors until it hurts. You provision things, you ship features,
and once a month you open the billing console and either exhale or wince. On [Trinitrade](/trinitrade) I started
treating the monthly bill the same way I treat latency or error rate: as a **service level objective** with a
target, a metric, and an alarm. The reframe changes everything, because a cost that's drifting is almost always a
symptom of something wrong.

## Cost has exactly the shape of an SLO

Look at what makes a latency SLO useful: a measurable metric, a target number, and an alarm when you breach it. Cost
has all three. The metric is your spend, the target is your budget, and the alarm is a budget alert. The only reason
it doesn't *feel* like an SLO is that people check it manually, monthly, after the fact — which is exactly how you'd
operate latency if you only looked at a graph once a month.

<figure>
  <img src="/blog/cloud-bill-is-an-slo/cost-as-slo.svg" alt="A cost SLO has the same three parts as a latency SLO: a metric (spend), a target (budget), and an alarm (budget alert), monitored continuously instead of checked monthly" loading="lazy" />
  <figcaption>Cost is an SLO — a metric (spend), a target (budget), and an alarm — monitored continuously, not checked once a month.</figcaption>
</figure>

Once you accept the shape, the tooling is obvious: set a monthly budget, and alarm on it. The point isn't to feel
guilty about the bill — it's to find out *during* the month that you're off-target, while you can still do something
about it.

## Alarm on thresholds and on the forecast

A good cost alarm doesn't just fire when you've already blown the budget — by then it's too late, the money is
spent. You alarm at several points along the way: a warning band partway through, the target itself, and crucially a
**forecast** alert that fires when you're *projected* to exceed the budget based on current run-rate, even if you
haven't hit it yet.

<figure>
  <img src="/blog/cloud-bill-is-an-slo/budget-thresholds.svg" alt="Cost alarms fire at a warning threshold partway to budget, at the budget itself, and on a forecast that projects current spend rate to month-end" loading="lazy" />
  <figcaption>Layered cost alarms — a warning band, the budget line, and a forecast alert that catches an overrun before it happens.</figcaption>
</figure>

The forecast alert is the one that earns its keep. It turns the bill from a lagging indicator into a leading one:
you find out you're on track to overspend on day ten, not on the invoice.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>A sudden jump in spend is rarely "we used the system more." It's almost always a <strong>defect</strong> — a
  resource left running, a misconfiguration, a runaway process, a forgotten environment. Treating cost as a
  reliability metric means a cost anomaly becomes a <em>bug report</em> you investigate, not a number you
  rationalize at month-end.</p>
</aside>

## A cost anomaly is a signal something is broken

This is the mental shift that makes cost-as-SLO genuinely useful. When spend deviates from its expected shape, your
first reaction shouldn't be "I guess it was a busy month." It should be the same reaction you'd have to a latency
spike: *what changed?* In practice, an unexpected cost jump is almost always one of a small set of defects.

<figure>
  <img src="/blog/cloud-bill-is-an-slo/cost-anomaly.svg" alt="A cost anomaly traced to common root causes: a resource left running, a misconfiguration, a runaway process, or a forgotten environment, each treated as a bug to fix" loading="lazy" />
  <figcaption>A cost anomaly is a symptom — trace it to the resource left on, the misconfig, the runaway, the forgotten environment.</figcaption>
</figure>

Anomaly detection automates the "what changed" question: instead of you eyeballing a graph, a detector learns your
normal spend pattern and flags deviations. Paired with the off-hours scale-to-zero schedule, this is how you catch
"something didn't turn off last night" the next morning instead of on the invoice three weeks later.

## Make cost observable, like everything else

The last piece is to stop treating cost data as something that lives only in the billing console. The detailed
usage data can be exported, queried, and graphed on the same dashboards as your operational metrics — a cost
scorecard that sits next to your latency and error panels. Now cost is reviewed in the same loop as reliability,
with the same cadence and the same seriousness.

<figure>
  <img src="/blog/cloud-bill-is-an-slo/cost-scorecard.svg" alt="Detailed cost and usage data is exported, queried, and rendered on a dashboard as a cost scorecard alongside operational metrics, reviewed on the same cadence" loading="lazy" />
  <figcaption>A cost scorecard — export the usage data, query it, and graph it next to your operational metrics.</figcaption>
</figure>

## The lesson: spend is a reliability signal, so observe it like one

The reason "the bill is an SLO" is more than a cute analogy is that it changes *when* and *how* you react. A team
that checks cost monthly is always reacting to history. A team that has a cost target, layered budget alarms, a
forecast alert, and anomaly detection treats overspend the way it treats an outage: as something to be detected
early, investigated as a defect, and fixed before it compounds. Your cloud bill is telling you something about the
health of your system every single day — you just have to instrument it like you mean it.

## References & further reading

- [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html) and [AWS Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html).
- [Cost and Usage Reports](https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html) and querying them with [Amazon Athena](https://docs.aws.amazon.com/athena/latest/ug/what-is.html).
- The [FinOps Foundation framework](https://www.finops.org/framework/) — cost as a shared, continuous practice.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the cost scorecard and budget architecture.
- Related: [scaling to zero on nights and weekends](/blog/scaling-to-zero-nights-weekends) and [SLOs for a system only you operate](/blog/slos-solo-operator).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The cost scorecard and budget alarms
described here are real. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
