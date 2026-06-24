---
title: "Fargate Spot plus an on-demand base: the trade-off as code"
description: 'Spot capacity is ~70% cheaper and can be reclaimed at any moment. A capacity-provider strategy lets you encode the cost-versus-availability trade-off directly in infrastructure code: a guaranteed base, with the cheap stuff on top.'
pubDate: 2026-11-24
lang: 'en'
draft: true
tags: ['finops', 'aws', 'cost', 'ecs', 'fargate']
---

Spot capacity is one of the best discounts in the cloud — often around 70% off — with one catch: it can be taken
back from you at a moment's notice. For a system that must be running while the market is open, "your task might
vanish mid-session" is not an acceptable property. On [Trinitrade](/trinitrade) I didn't have to choose between
cheap and reliable, because a capacity-provider strategy lets you encode *both* — a guaranteed on-demand base, with
the cheap interruptible capacity layered on top — directly in infrastructure code.

## The trade-off, stated plainly

Spot and on-demand are two ends of a single dial. On-demand capacity is guaranteed to be placed and won't be
reclaimed, but you pay full price. Spot capacity is dramatically cheaper, but the provider can reclaim it with about
two minutes' notice when it needs the capacity back. Most "should I use Spot?" debates treat this as a binary
choice. It isn't — you can have some of each, in a ratio you control.

<figure>
  <img src="/blog/fargate-spot-on-demand-base/the-tradeoff.svg" alt="A dial between on-demand capacity (guaranteed placement, full price) and Spot capacity (about 70 percent cheaper, reclaimable with two minutes notice)" loading="lazy" />
  <figcaption>The trade-off — on-demand is guaranteed but full price; Spot is far cheaper but reclaimable. It's a dial, not a switch.</figcaption>
</figure>

## Why 100% Spot is a real risk during the hours that matter

The naive cost-optimization is to run everything on Spot and pocket the savings. The hidden danger is that a Spot
reclaim during your active window isn't just an interruption — the orchestrator then has to *place a replacement*,
and if Spot capacity is tight at that moment, there may be nowhere to put it. Your desired count says "one task,"
but you have zero running, during the exact hours the system needs to be alive.

<figure>
  <img src="/blog/fargate-spot-on-demand-base/spot-risk.svg" alt="During market hours, a 100 percent Spot deployment is reclaimed, the orchestrator tries to place a replacement, Spot capacity is unavailable, and the service runs zero tasks despite a desired count of one" loading="lazy" />
  <figcaption>100% Spot during active hours — a reclaim plus tight capacity means zero running tasks when you most need one.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>Spot's discount is real, but so is its reclaim risk — and the risk bites hardest at exactly the wrong time.
  The fix isn't "all Spot" or "all on-demand"; it's a <strong>guaranteed on-demand base with Spot on top</strong>,
  expressed as a capacity-provider strategy. <em>You encode "always keep at least one safe task" as code, not as a
  hope.</em></p>
</aside>

## Encoding the trade-off as a capacity-provider strategy

The mechanism is a capacity-provider strategy: a small piece of configuration that says, for this service, *how* to
split tasks across on-demand and Spot. It has two levers. A **base** reserves a fixed number of tasks for one
provider — set the on-demand base to one and you always have at least one guaranteed task. **Weights** then
distribute everything above the base — give Spot the heavier weight and the extra tasks ride the cheap capacity.

<figure>
  <img src="/blog/fargate-spot-on-demand-base/capacity-strategy.svg" alt="A capacity provider strategy with an on-demand base of one task and a Spot weight for everything above the base, defined in infrastructure code" loading="lazy" />
  <figcaption>The strategy as code — an on-demand base of one guaranteed task, with Spot carrying everything above it.</figcaption>
</figure>

Because it lives in infrastructure code, the trade-off is reviewed in a pull request, versioned, and reproducible —
not a checkbox someone clicked once in a console and forgot. If the ratio is wrong, you can see it, discuss it, and
change it like any other code.

## How it behaves as you scale

The elegant part is how this single strategy adapts to the size of the service. At one desired task, the base claims
it, so that lone task is on-demand — effectively 100% guaranteed, which is exactly what you want for a system where
losing the one task means losing the session. Scale to several tasks and the base still guarantees one on-demand,
while the rest ride Spot for the discount. The same configuration is conservative when small and economical when
large, with no changes.

<figure>
  <img src="/blog/fargate-spot-on-demand-base/scaling-behavior.svg" alt="At one task the on-demand base makes it fully guaranteed; at several tasks one stays on-demand and the rest run on Spot, all from the same strategy" loading="lazy" />
  <figcaption>Same strategy, different scales — one task is fully guaranteed; many tasks keep one safe and put the rest on cheap Spot.</figcaption>
</figure>

This pairs naturally with scaling to zero off-hours: during the hours the system is off, none of this costs
anything; during the hours it's on, the base keeps it safe and Spot keeps any extra capacity cheap.

## The lesson: make the trade-off explicit and reviewable

The reason to push this into code rather than leaving it as a deployment-time choice is that cost-versus-availability
trade-offs are exactly the decisions that rot when they're implicit. A capacity-provider strategy turns "we think
this is mostly on Spot" into a precise, auditable statement: *this many guaranteed, the rest cheap.* You get most of
the Spot discount without betting your active hours on capacity being available, and anyone reading the
infrastructure can see exactly how much reliability you bought and how much you saved.

## References & further reading

- [Amazon ECS capacity providers](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/cluster-capacity-providers.html) and the [Fargate Spot](https://docs.aws.amazon.com/AmazonECS/latest/userguide/fargate-capacity-providers.html) provider.
- [Capacity provider strategies](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/cluster-capacity-providers.html#capacity-providers-strategy) — base and weight semantics.
- [Spot interruption notices](https://docs.aws.amazon.com/AmazonECS/latest/userguide/fargate-capacity-providers.html#fargate-capacity-providers-considerations) — the two-minute warning.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the compute stack and its capacity strategy.
- Related: [scaling to zero on nights and weekends](/blog/scaling-to-zero-nights-weekends) and [your monthly cloud bill is an SLO](/blog/cloud-bill-is-an-slo).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The capacity-provider strategy described
here is real and defined in infrastructure code. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
