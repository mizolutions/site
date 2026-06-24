---
title: "Bad data doesn't crash your backtest — it lies to you"
description: 'Data gotchas in vendor daily bars: why free feeds have holes, why unadjusted prices fake 95% crashes, why even adjusted prices miss spin-offs, and the one-line integrity guard that catches all of it.'
pubDate: 2026-08-11
lang: 'en'
draft: true
tags: ['quant', 'data-quality', 'backtesting', 'data-engineering', 'finance']
---

The most dangerous data problem isn't the one that throws an exception. It's the one that sails straight through
your pipeline, runs a clean backtest, and hands you a beautiful, confident, **completely wrong** answer. In
finance especially, bad data doesn't crash — it lies. And it lies in ways that look exactly like the signals
you're hunting for.

While building the data pipeline for [Trinitrade](/trinitrade), I hit every one of these. Here are the daily-bar
gotchas that quietly poison a backtest, and the cheap guard that catches them.

<figure>
  <img src="/blog/vendor-daily-bars-gotchas/silent-failure.svg" alt="A bad bar from a gap, split, or spin-off passes through the pipeline with no error, the backtest runs fine, and produces a beautiful but wrong result" loading="lazy" />
  <figcaption>The silent failure mode — no error, no crash, just a confident wrong answer.</figcaption>
</figure>

## Gotcha 1: free feeds have holes

The first trap is the cheapest data. A popular free source for US equities is IEX, but IEX is a *single exchange*
— it sees only the trades that happen on IEX, which is a small slice of total volume. Run a backtest on free IEX
bars and you can find **multi-year gaps**, including stretches around 2020 where the data you need most simply
isn't there.

The fix is to use the **SIP** (the consolidated tape / [Securities Information Processor](https://en.wikipedia.org/wiki/Securities_information_processor)),
which aggregates every exchange. It's the difference between "what traded on one venue" and "what actually
happened in the market." If your vendor offers SIP, pay the (usually small) difference; a backtest on a feed with
holes isn't conservative, it's just wrong in an unknown direction.

## Gotcha 2: unadjusted prices fake giant crashes

The second trap is **price adjustment.** When a company does a stock split — say 20-for-1 — the raw price divides
by 20 overnight. If you pull **unadjusted** ("raw") bars, that shows up as a **−95% one-day return**: a crash that
never happened.

<figure>
  <img src="/blog/vendor-daily-bars-gotchas/split-artifact.svg" alt="A 20-for-1 split makes raw prices drop about 95 percent in one day, looking like a crash, while adjustment=all rescales history into a continuous series with correct returns" loading="lazy" />
  <figcaption>A split on raw prices looks like a −95% crash; adjusted prices keep the series continuous.</figcaption>
</figure>

Any momentum, volatility, or drawdown calculation that sees that −95% will react to a catastrophe that was just an
accounting event. The fix is to request **split- and dividend-adjusted** bars (`adjustment=all` in Alpaca's API,
"adjusted close" elsewhere). This rescales the whole history so returns are continuous across the split.

## Gotcha 3: even adjusted prices don't fix spin-offs

Here's the one that gets you *after* you think you've solved adjustments. `adjustment=all` handles splits and
dividends — but it does **not** correctly handle **spin-offs**, where a company hands shareholders stock in a
newly separated business. The parent's price drops by the value of the spun-off piece, and most adjusted feeds
render that as a large negative one-day return that wasn't a loss at all.

<figure>
  <img src="/blog/vendor-daily-bars-gotchas/spinoff-artifact.svg" alt="adjustment=all fixes splits and dividends but not spin-offs; a spin-off can show a minus 71 percent one-day return, like RTX in 2020, which poisons momentum, volatility, and drawdown statistics" loading="lazy" />
  <figcaption>Spin-offs slip past even adjusted feeds — a single bar can read −71%, poisoning every downstream statistic.</figcaption>
</figure>

A real example: in 2020, Raytheon/United Technologies (RTX) spun off Carrier and Otis, and an adjusted feed can
show roughly a **−71% one-day return** for that date. Feed that into a strategy and it sees the apocalypse. The
event was real corporate plumbing; the −71% "return" is pure artifact.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>Bad financial data is dangerous precisely because its artifacts <strong>look like signals</strong>: a split
  looks like a crash, a spin-off looks like a collapse. Your strategy can't tell a real −71% from a fake one — so
  <em>you</em> have to, before the data reaches it.</p>
</aside>

## The guard: flag any impossible one-day move

You can't manually audit thousands of names across a decade. So I added a cheap **integrity guard** at ingestion:
**flag any single-day return below −50% as a likely split/spin-off data artifact.** A genuine −50% single-day move
in a large-cap is astronomically rare; an artifact from a corporate action is common. The guard quarantines the
suspicious bar for review instead of letting it silently corrupt the research.

<figure>
  <img src="/blog/vendor-daily-bars-gotchas/integrity-guard.svg" alt="Each daily bar is checked: if the one-day return is below minus 50 percent it is flagged as a likely split or spin-off artifact and quarantined for review, otherwise it passes into the pipeline" loading="lazy" />
  <figcaption>The integrity guard — one cheap threshold catches the artifacts before they reach research.</figcaption>
</figure>

And one more, tying back to [survivorship bias](/blog/survivorship-bias-backtest): **point-in-time, survivorship-free
index membership is usually paid data** (CRSP, Compustat, Norgate, Bloomberg). The free "today's constituents"
list is a data-quality trap of its own — it silently encodes the future into your universe.

## The engineering version: validate at the boundary

None of this is finance-specific. It's the universal lesson of data engineering: **never trust data crossing a
system boundary.** The artifacts just wear different costumes:

- A **bad upstream feed** (gaps, duplicates, timezone drift) produces a clean-looking aggregate that's quietly
  wrong — the same shape as IEX's holes.
- A **unit or encoding mismatch** (cents vs dollars, UTC vs local, a stray sentinel like `-999`) is the
  engineering twin of the unadjusted-split spike.
- The fix is the same: a **data contract** — range checks, freshness checks, schema checks, "this value is
  physically impossible" assertions — that fails loudly at ingestion instead of silently at the dashboard.

The −50% guard is just an assertion that encodes domain knowledge: *this can't really happen, so if I see it, the
data is wrong, not the world.* Every robust pipeline is built from assertions like that. Garbage in doesn't have
to mean garbage out — but only if something is checking the garbage at the door.

## References & further reading

- [Securities information processor](https://en.wikipedia.org/wiki/Securities_information_processor) (the SIP / consolidated tape) vs single-venue feeds.
- [Stock split](https://en.wikipedia.org/wiki/Stock_split), [corporate spin-off](https://en.wikipedia.org/wiki/Corporate_spin-off), and [adjusted closing price](https://en.wikipedia.org/wiki/Adjusted_closing_price).
- [Data quality](https://en.wikipedia.org/wiki/Data_quality) and [garbage in, garbage out](https://en.wikipedia.org/wiki/Garbage_in,_garbage_out).
- [Survivorship bias](https://en.wikipedia.org/wiki/Survivorship_bias) — the point-in-time membership trap.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — where this pipeline (and its guard) lives.
- Companion posts: [survivorship bias](/blog/survivorship-bias-backtest), [pre-registration](/blog/pre-registration-backtests), and [seven strategies, no edge](/blog/no-trading-edge-seven-strategies).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The data gotchas here are real ones I hit
and guarded against. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
