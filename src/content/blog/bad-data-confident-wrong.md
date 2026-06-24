---
title: "Bad data silently produces confident-but-wrong results"
description: 'Bad market data rarely crashes anything. It does something worse: it feeds your backtest a believable number that is completely wrong. A split-day looks like a 95% crash, a spin-off like a 71% one — and your strategy learns from garbage. Here is the integrity guard that catches it.'
pubDate: 2026-12-15
lang: 'en'
draft: true
tags: ['data', 'data-quality', 'backtesting', 'research', 'integrity']
---

The scariest data bugs don't throw exceptions. A division by zero crashes loudly and you fix it. But a price series
with a fake 95% one-day crash in it doesn't crash anything — it quietly flows into your backtest, your strategy
"reacts" to a catastrophe that never happened, and out comes a confident, plausible, completely wrong result. On
[Trinitrade](/trinitrade), defending against silent data corruption turned out to be more important than almost any
modeling decision, because garbage in doesn't error out — it produces *believable* garbage out.

## The failure mode: confident and wrong

Most engineering bugs are loud. Data-quality bugs are the opposite: the pipeline runs green, the numbers look
reasonable, and the conclusion is false. A backtest fed corrupted prices will happily report a Sharpe ratio, a
drawdown, an equity curve — all internally consistent, all derived from data that doesn't reflect reality. You can't
tell by looking at the output; the output's whole job is to look believable.

<figure>
  <img src="/blog/bad-data-confident-wrong/garbage-in-garbage-out.svg" alt="Corrupted price data flows through a green pipeline into a backtest that produces a confident, plausible, but completely wrong result, with no error raised anywhere" loading="lazy" />
  <figcaption>The failure mode — bad data doesn't crash; it produces a confident, believable, wrong result with no error anywhere.</figcaption>
</figure>

## Where the corruption comes from: corporate actions

The classic source isn't a vendor typo — it's the difference between *raw* and *adjusted* prices around corporate
actions. When a stock does a 20-for-1 split, its raw price drops ~95% overnight while nothing economically happened.
If you backtest on raw prices, that split looks like an apocalyptic single-day crash. The fix is to use
fully-adjusted prices (split *and* dividend adjusted), which back-propagate the adjustment so the series is
continuous.

<figure>
  <img src="/blog/bad-data-confident-wrong/split-artifact.svg" alt="On a 20-for-1 split the raw price drops about 95 percent overnight, looking like a crash; fully adjusted prices remove the artifact and keep the series continuous" loading="lazy" />
  <figcaption>The split artifact — raw prices show a fake 95% crash on split day; full adjustment removes it.</figcaption>
</figure>

So you use adjusted data and you're safe — except you're not, entirely.

## The artifact that adjustment doesn't fix

Here's the trap that bit me. Full adjustment handles splits and dividends, but it does **not** cleanly handle
**spin-offs**. When a company spins off a division, part of its value walks out the door, and the adjusted series can
still show a large, real-looking one-day drop that's actually a corporate restructuring, not a market move. A
well-known case shows up as a ~71% single-day "loss" that no amount of standard adjustment removes. So even with the
right adjustment mode, a corrupted-looking bar can still slip through.

<figure>
  <img src="/blog/bad-data-confident-wrong/spinoff-artifact.svg" alt="A spin-off produces a large one-day drop of around 71 percent that full split-and-dividend adjustment does not remove, so a corrupted-looking bar still slips through" loading="lazy" />
  <figcaption>The artifact adjustment misses — a spin-off shows a ~71% one-day drop that standard adjustment leaves in.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>You cannot trust the data source to be clean, even with the right adjustment settings. The defense is a cheap,
  blunt <strong>integrity guard</strong>: flag any single-day move so extreme it's almost certainly a data artifact
  — a one-day return worse than −50% — as <em>a data error to investigate, not a real event to trade.</em> A
  near-impossible number is a bug until proven otherwise.</p>
</aside>

## The guard: flag the impossible

The guard is deliberately simple. A real, single, liquid equity essentially never falls more than 50% in one day; a
move that large is overwhelmingly more likely to be a data artifact — an unadjusted split, a spin-off, a vendor
glitch — than a genuine market event. So the pipeline flags any one-day return below that threshold and refuses to
silently feed it into research. It's a smoke detector, not a fire department: it doesn't fix the data, it stops the
data from quietly poisoning your conclusions.

<figure>
  <img src="/blog/bad-data-confident-wrong/integrity-guard.svg" alt="An integrity guard checks each one-day return; anything worse than minus 50 percent is flagged as a probable data artifact to investigate instead of flowing into the backtest" loading="lazy" />
  <figcaption>The integrity guard — any one-day return below −50% is flagged as a probable artifact, not fed into research.</figcaption>
</figure>

There are related guards worth having: prefer a consolidated data feed over a free one with multi-year gaps, and
treat any unexplained discontinuity as suspect. But the −50% one-day guard is the highest-value single check,
because it catches exactly the class of artifact that masquerades as a tradeable catastrophe.

## The lesson: validate at the boundary, because silence is the danger

The general principle is that the most dangerous bugs are the ones that don't announce themselves. A crash gets
fixed; a confidently-wrong number gets *acted on*. Anywhere data enters your system from outside — a market vendor, a
file upload, a third-party API — you should validate it at the boundary against what's physically plausible, because
once it's inside, every downstream computation will treat it as truth and dress it up in a believable result. Cheap,
blunt sanity checks at the edge are worth far more than sophisticated modeling on top of data you never verified.

## References & further reading

- [Stock split](https://en.wikipedia.org/wiki/Stock_split) and [adjusted closing price](https://en.wikipedia.org/wiki/Adjusted_closing_price) — why raw prices lie around corporate actions.
- [Corporate spin-off](https://en.wikipedia.org/wiki/Corporate_spin-off) — the artifact that adjustment doesn't fix.
- [Garbage in, garbage out](https://en.wikipedia.org/wiki/Garbage_in,_garbage_out) — the underlying principle.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the research pipeline and its data-integrity guards.
- Related: [vendor daily bars gotchas](/blog/vendor-daily-bars-gotchas) and [why TimescaleDB hypertables for market data](/blog/timescaledb-hypertables-market-data).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The −50% integrity guard described here is
real and caught real artifacts in real vendor data. The sanitized source lives in the [case study](/trinitrade) and
the [public repository](https://github.com/mizolutions/trinitrade).*
