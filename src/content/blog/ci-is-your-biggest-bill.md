---
title: "When CI is your biggest cloud bill"
description: 'Once you scale the production system to zero off-hours, the thing that quietly becomes your largest line item is the one that runs all the time: continuous integration. Here is how the CI runner became cost item number one, and how to tame it.'
pubDate: 2026-12-01
lang: 'en'
draft: true
tags: ['finops', 'aws', 'cost', 'ci', 'codebuild']
---

There's a funny thing that happens when you get serious about cost. You scale the production system to zero on
nights and weekends, you put the database on a schedule, you right-size everything — and then you open the cost
scorecard and the biggest line item isn't the trading system at all. It's **continuous integration**. On
[Trinitrade](/trinitrade), the build runner quietly became the single largest source of spend, precisely *because*
I'd optimized everything else so well.

## The paradox: optimize the product, and CI floats to the top

Cost is relative. When the production system runs 24/7, it dominates the bill and CI is a rounding error. But the
moment you scale production to zero for most of the week, its share collapses — and whatever runs on every push,
every pull request, and every scheduled job is now proportionally huge. CI didn't get more expensive; everything
else got cheaper, and CI was left holding the top spot.

<figure>
  <img src="/blog/ci-is-your-biggest-bill/cost-shift.svg" alt="Before optimization the production system dominates the bill and CI is small; after scaling production to zero off-hours, CI becomes the largest remaining line item" loading="lazy" />
  <figcaption>The paradox — scaling production to zero doesn't make CI bigger, it makes CI the biggest remaining slice.</figcaption>
</figure>

This is worth internalizing as a general FinOps pattern: **the more successfully you optimize your largest cost, the
more your second-largest cost matters.** Cost optimization is a game of whack-a-mole where the moles keep getting
smaller, and at some point the mole is your build pipeline.

## Where the build minutes actually go

A managed build runner bills by the minute, so the question becomes: what is consuming minutes? In my case it was a
predictable set of culprits, none of which were the actual tests:

- **No dependency caching** — every build reinstalls the full toolchain from scratch, paying for the same downloads
  over and over.
- **Redundant and superseded builds** — pushing twice in quick succession runs two full pipelines when only the
  latest matters.
- **Oversized runner images** — a heavier base image takes longer to pull and start on every single build.
- **Scheduled jobs running when nothing changed** — daily crons firing on weekends, when the system is off and
  there's nothing meaningful to check.

<figure>
  <img src="/blog/ci-is-your-biggest-bill/where-minutes-go.svg" alt="Build minutes consumed by no dependency caching, redundant superseded builds, oversized runner images, and scheduled jobs running when nothing changed" loading="lazy" />
  <figcaption>Where the minutes go — mostly setup and waste, rarely the tests themselves.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>CI cost is mostly <strong>not</strong> the cost of running your tests — it's the cost of everything *around*
  them: reinstalling dependencies, pulling images, and running pipelines nobody needed. The fastest savings come
  from cutting the setup and the redundancy, not from making the tests shorter. <em>Profile where the minutes go
  before you touch the test suite.</em></p>
</aside>

## The weekend-cron trap

One specific waste deserves its own callout because it compounds with another problem. If a scheduled build runs
every day at a fixed time, but your system is only *on* during weekdays, then every weekend that build fires against
a system that's switched off. It doesn't just waste minutes — it often *fails*, because it's checking a system that
isn't there, which then produces false alarms on top of the wasted spend.

<figure>
  <img src="/blog/ci-is-your-biggest-bill/weekend-cron.svg" alt="A daily scheduled build fires on weekends against a system that is switched off, wasting minutes and producing false failures, fixed by scheduling it only on weekdays" loading="lazy" />
  <figcaption>The weekend-cron trap — a daily build against an off system wastes minutes and pages falsely; schedule it to match the system's hours.</figcaption>
</figure>

The fix is simply to make the schedule match reality: if the system runs weekdays, the checks that depend on it run
weekdays too. This is the same lesson as matching spend to your schedule, applied to CI.

## Taming it

None of the fixes are exotic; they're the boring blocking-and-tackling of build hygiene:

- **Cache dependencies** so each build reuses the toolchain instead of reinstalling it.
- **Right-size the runner image** so startup is fast and light.
- **Cancel superseded builds** so a rapid second push doesn't run a doomed first pipeline to completion.
- **Schedule jobs to match the system's real hours** so nothing fires into the void.
- **Put CI on the cost scorecard** so it's observed like any other spend, and the next time it creeps up you see it
  early.

<figure>
  <img src="/blog/ci-is-your-biggest-bill/tame-ci.svg" alt="Taming CI cost with five boring fixes: cache dependencies, right-size the runner image, cancel superseded builds, schedule to match system hours, and put CI on the cost scorecard" loading="lazy" />
  <figcaption>Taming CI cost — five unglamorous fixes, none of which touch the tests themselves.</figcaption>
</figure>

The last one closes the loop: CI became my biggest line item *because* I had a cost scorecard that surfaced it. The
bill told me where to look. Without that observability, it would have stayed invisible, hiding behind the assumption
that "the product is the expensive part."

## The lesson: cost optimization never ends, it just moves

The real takeaway isn't "cache your builds" — it's that there's always a biggest line item, and optimizing it just
promotes the next one. The discipline is to keep the whole bill observable so that whatever floats to the top is
visible, whether that's your production compute, your database, or — surprisingly often — the pipeline that builds
the thing rather than the thing itself. Follow the money, and sometimes it leads somewhere you didn't expect.

## References & further reading

- [AWS CodeBuild pricing](https://aws.amazon.com/codebuild/pricing/) — billed by build-minute.
- [Caching in CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/build-caching.html) — local and S3 caches.
- [GitHub Actions concurrency](https://docs.github.com/en/actions/using-jobs/using-concurrency) — cancelling superseded runs.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the CI/CD pipeline and its cost profile.
- Related: [your monthly cloud bill is an SLO](/blog/cloud-bill-is-an-slo) and [CI cascade debt](/blog/ci-cascade-debt).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. CI genuinely became the largest line item
after the production system was scaled to zero off-hours. The sanitized source lives in the [case study](/trinitrade)
and the [public repository](https://github.com/mizolutions/trinitrade).*
