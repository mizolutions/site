---
title: 'Survivorship bias is sneakier than you think'
description: 'A cross-sectional momentum strategy passed every test — until I rebuilt it on survivorship-free data and the edge vanished. A field guide to the bias everyone "knows about" and still falls for.'
pubDate: 2026-07-14
lang: 'en'
draft: true
tags: ['quant', 'research', 'backtesting', 'statistics', 'data-quality']
---

In World War II, the U.S. military studied the bullet holes on planes returning from combat and proposed
reinforcing the areas with the most damage. The statistician **Abraham Wald** pointed out the flaw: they were
only looking at the planes that *came back*. The places where survivors had **no** holes were exactly where the
lost planes had been hit. You armor where the data is silent, not where it's loud.

That is survivorship bias, and it is the most quietly dangerous bias in quantitative research — not because it's
obscure (everyone "knows about it"), but because in a backtest it doesn't look like a mistake. It looks like a
clean, reasonable universe of stocks. I had a momentum strategy *pass every one of my pre-registered criteria* —
and then watched the edge evaporate the moment I removed this one bias. Here's the story, and how to not get
fooled.

<figure>
  <img src="/blog/survivorship-bias-backtest/wald-planes.svg" alt="Wald's insight: returning planes show holes on wings and fuselage; the naive fix armors the holes, the correct fix armors where survivors have no holes because those planes did not return" loading="lazy" />
  <figcaption>Wald's planes — the lesson is to look at what the survivors can't tell you.</figcaption>
</figure>

## What it actually is in a backtest

Survivorship bias in backtesting usually sneaks in through the **universe** — the list of names you test on. The
intuitive move is to grab "the S&P 500" or "the S&P 100" and run your rule back through history. But *today's*
index is a list of winners. Run it backwards to 2016 and you've silently excluded every company that was in the
index then but got dropped, acquired, or delisted since — and you've over-included the handful of names that grew
huge enough to still be there.

<figure>
  <img src="/blog/survivorship-bias-backtest/membership.svg" alt="Today's index run backwards only contains names still in the index today; point-in-time membership also includes the names that later dropped out or delisted" loading="lazy" />
  <figcaption>Today's-index-run-backwards silently drops the dropouts; point-in-time membership keeps them.</figcaption>
</figure>

The bias isn't uniform — and that's what makes it treacherous. It **specifically flatters momentum.** A strategy
that buys recent winners is delighted to find a universe pre-stocked with the decade's biggest winners, because
*you already knew which ones survived*. The backtest looks like skill. It's actually hindsight, baked into the
ticker list.

## My GO that didn't survive contact with honest data

I was testing cross-sectional momentum — hold the top tercile of names by trailing 12-month return, rebalanced
monthly. On a broad **today's-S&P-100** universe, it cleared my pre-registered bar: a Sharpe ratio around **0.97
versus ~0.89 for passive SPY.** Four criteria, all green. For about a day, I had the only GO of the entire program.

I didn't trust it — precisely because momentum is the strategy survivorship bias flatters most. So I did the
expensive thing: I rebuilt the universe **survivorship-free and point-in-time** — the *actual* S&P 500 membership
as it stood on each historical rebalance date, including the **235 names that later dropped out or were delisted**.
About 736 names across 2016–2026, with the losers put back in.

Same rule. Honest universe. The result:

<figure>
  <img src="/blog/survivorship-bias-backtest/the-flip.svg" alt="On today's biased S&P 100, momentum Sharpe is about 0.97, above SPY; rebuilt on point-in-time survivorship-free S&P 500, momentum Sharpe drops to about 0.67, below SPY at 0.89, a clean NO-GO" loading="lazy" />
  <figcaption>The flip — removing the bias turned a Sharpe of ~0.97 (GO) into ~0.67 (NO-GO), below passive SPY.</figcaption>
</figure>

The Sharpe ratio fell from ~0.97 to ~**0.67**, now *below* SPY's ~0.89. The GO became a clean NO-GO. Nothing
about the strategy changed — only the honesty of the data did.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>Survivorship bias doesn't add noise — it adds a <strong>directional</strong> tailwind that points exactly
  where your strategy wants to go. That's why it survives a smell test: the biased result looks <em>plausible</em>,
  even impressive.</p>
</aside>

## Proving where the "edge" was hiding

A lower Sharpe is suggestive, but I wanted to *locate* the bias. So I ran a look-ahead-winner ablation: rank every
name by its **full-sample** (ex-post) total return, **drop the top ~10 mega-winners**, and re-run the identical
momentum rule on what's left.

<figure>
  <img src="/blog/survivorship-bias-backtest/ablation.svg" alt="Rank names by full-sample return, drop the top ten ex-post winners, re-run the momentum rule, and the edge collapses below SPY, proving it lived in a few names" loading="lazy" />
  <figcaption>The ablation — drop the ten biggest ex-post winners and the 'edge' collapses, proving it lived in a handful of names a biased universe over-includes.</figcaption>
</figure>

The edge collapsed. The entire apparent advantage had been living in a few enormous winners that a "today's index"
universe hands you for free. Strip out the names you only knew to include *because they won*, and there's nothing
left. That's the signature of survivorship bias, made visible.

This matched what a separate point-in-time decomposition had already predicted — which is the comforting part of
pre-registered, control-heavy research: the failure mode announced itself before I'd spent a dollar of real
capital on it.

## Why people skip this (and how to not)

Honest, survivorship-free, point-in-time membership data is genuinely hard to get. Knowing *which names were in
the index on a given date in 2017*, with the dropouts, is usually a paid dataset (CRSP, Compustat, Norgate,
Bloomberg). The free path — "today's constituents" — is right there, and it quietly biases every momentum or
quality backtest **upward**. So a lot of impressive-looking research is impressive precisely because it's biased.

A few rules that keep me honest:

- **Treat the universe as a parameter, and freeze it in your pre-registration** — including *how* you got
  point-in-time membership.
- **If you can only get today's constituents, read a "pass" as suggestive, never decisive** — the bias points in
  the favorable direction.
- **Run the ablation.** Drop the ex-post top winners and see if the edge survives. It's cheap and brutal.
- **Put the losers back.** When I found the membership data free (an open-source point-in-time list plus delisted
  prices), the *first* thing I did was add back the 235 dropouts. That single step flipped the verdict.

## The engineering version of the same mistake

You don't need a backtest to commit this error. It's the same shape as:

- **Reading metrics only from the servers that are still up.** Your p99 latency looks great because the instances
  that fell over stopped reporting — you're measuring the survivors.
- **Learning only from the customers who stayed.** Churned users don't fill out your survey; the happy ones do.
- **A test suite that only exercises the happy path.** It's green because it never asks about the requests that
  died on the way in.

The fix is always the same: go find the data that *didn't make it back*. Look at the planes that didn't return,
the names that got delisted, the requests that timed out, the users who left. The truth is usually hiding in the
silence, not in the survivors.

## References & further reading

- [Survivorship bias](https://en.wikipedia.org/wiki/Survivorship_bias) — the general phenomenon, with Wald's planes.
- [Abraham Wald](https://en.wikipedia.org/wiki/Abraham_Wald) and the WWII Statistical Research Group.
- [Look-ahead bias](https://en.wikipedia.org/wiki/Look-ahead_bias) and the case for point-in-time data.
- [Momentum in finance](https://en.wikipedia.org/wiki/Momentum_(finance)) — Jegadeesh & Titman (1993), the strategy most flattered by this bias.
- [The Sharpe ratio](https://en.wikipedia.org/wiki/Sharpe_ratio) — the yardstick that fell from ~0.97 to ~0.67.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — where this GO-to-NO-GO happened.
- Companion posts: [seven strategies, no edge](/blog/no-trading-edge-seven-strategies) and [pre-registration for backtests](/blog/pre-registration-backtests).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The Sharpe figures here are from real,
dated, pre-registered backtests. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
