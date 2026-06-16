---
title: 'From storing logs to real observability'
description: 'How instrumenting a critical algorithmic trading system turns log soup into questions you can actually answer in production.'
pubDate: 2026-06-16
lang: 'en'
draft: true
tags: ['observability', 'sre', 'cloud', 'trading']
---

Every team says they have observability. Most of them have logs. Those are not
the same thing — and the gap between them is exactly where 3 a.m. incidents are
born.

I learned the difference instrumenting **Trinitrade**, a live algorithmic
trading system where a missed signal or a silent failure has a dollar cost,
measured in real time. Here is how we went from _storing logs_ to being able to
_ask new questions about production without shipping new code_.

## 1. The logs-as-observability trap

`logger.info("order submitted")` _feels_ like observability. It isn't. Logs
answer questions you already knew to ask. Real observability is the property
that lets you answer the questions you **didn't** anticipate — after the system
is already in production and misbehaving.

The classic framing is three pillars: **logs** (discrete events), **metrics**
(aggregatable numbers over time), and **traces** (the causal path of a single
request). A pile of `print` statements shipped to CloudWatch is one pillar,
half-built. It will tell you _that_ something happened; it will not tell you
_how often_, _how slow_, or _why this particular order_.

## 2. Instrumenting the critical path

In a trading system the critical path is the order lifecycle:
`signal → risk check → broker submit → fill → reconciliation`. We instrument
each hop with **structured events**, not free text:

- `order_submit_latency_ms` — the number behind every latency SLO.
- `slippage_bps` — measured per fill, alerted above 30 bps.
- fill / reject ratio — a leading indicator of broker or strategy trouble.
- `risk_rejections_total` — the Risk Manager halting anomalous orders.
- reconciliation discrepancies — which must be **0**, always.

The rule: every number you would put in an alert has to be a first-class metric,
and every log line is structured JSON with a stable key set. **Cardinality
discipline** matters — a `symbol` label is fine; an `order_id` label will blow
up your metrics bill. Apply RED (Rate, Errors, Duration) to the submit endpoint
and USE (Utilization, Saturation, Errors) to the Fargate task, and you have a
complete first cut.

## 3. From metrics to SLOs and actionable alerts

Metrics are inert until they have a target. We define **SLOs**: p95
order-submit latency under a fixed budget, reconciliation discrepancies equal to
zero, signal-to-submit success ratio above a threshold. Each SLO gets an error
budget — and, the part most teams skip, **every alert must be actionable and map
to a runbook**. If a page fires and the runbook is "look around until you find
it", that is not an alert, it is an interruption.

We killed more alarms than we added. A CloudWatch alarm on a never-published
metric with `treatMissingData: breaching` will page you forever for nothing; a
long-period alarm evaluated at bucket boundaries will _stay_ red long after
you've fixed the cause. **Alert hygiene is observability work.**

## 4. Closing the loop — traces and post-mortems

The final pillar is tracing. When one order misbehaves, you don't want to grep
five services — you want the causal timeline of _that_ order across Fargate
tasks and the event bus. Distributed tracing turns "something was slow" into
"the broker call on this order took 1.8s at 21:30:04".

Instrumentation is also what makes a post-mortem **blameless and useful**: you
reconstruct what happened from data, not memory. And that is the meta-point —
observability is what lets you operate a system you can't pause. A trading
system does not stop for you to attach a debugger. Neither does production.

If you're staring at a wall of logs still unable to answer "is it healthy?" —
that gap is the work. Closing it is most of the job.
