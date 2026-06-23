---
title: 'I tried to find a trading edge — and failed seven times. That is the point.'
description: 'A pre-registered, bias-controlled research program found no robust edge across seven strategy families. Why a clean, well-documented negative is a success of method.'
pubDate: 2026-06-30
lang: 'en'
draft: true
tags: ['quant', 'research', 'backtesting', 'engineering-discipline', 'trading']
---

Most engineering portfolios show you the thing that worked. This one starts with the thing that didn't — on
purpose — because **how you handle a negative result says more about your judgment than any green dashboard.**

I built **Trinitrade**, a live algorithmic-trading platform, end-to-end as a single operator: Infrastructure as
Code, observability, a tamper-evident audit trail, the whole reliability stack. But the interesting question was
never "can I build it?" It was **"is there a real, harvestable edge here — or am I about to fool myself?"**

I ran a structured program to answer that honestly. It tested **seven distinct strategy families.** Every one of
them was a **NO-GO** versus simply holding the market (passive SPY). And the cleanest part of the whole project
is that I can *prove* I didn't cheat to get there.

## Why "did it work?" is the wrong first question

In trading research, the failure mode isn't building the wrong thing. It's **building the right thing and then
lying to yourself about the results.** Backtests are uniquely good at producing beautiful, completely fake
edges, because you have thousands of knobs (universe, lookback, rebalance, thresholds) and one dataset to tune
them against. Turn enough knobs and *something* will look profitable. That's not signal — that's
[multiple comparisons](https://en.wikipedia.org/wiki/Multiple_comparisons_problem) wearing a nice chart.

So before I ran anything, I made the rules harder to game than my own optimism:

- **Pre-registration.** Every hypothesis — its universe, rule, parameters, and the exact pass/fail criteria — was
  **frozen in a git commit before the backtest ran.** Git history then proves the criteria were set *a priori*,
  not moved after I saw the result. The universe of tickers is itself a parameter, so that got frozen too.
- **A pre-committed stop-rule.** I fixed an attempt budget *before* starting (e.g. two "shots" per mechanism
  class, and a program-level rule: a run of clean NO-GOs concludes the program). You don't get to run hypotheses
  until one wins by luck and then declare victory.
- **A multiple-comparisons-aware bar.** Acceptance wasn't just "beats SPY." It was a battery of criteria plus
  bias controls, with thin margins explicitly discounted.

This is the boring part. It is also the entire point.

## The seven families

Across two research tracks, I tested seven mechanism families. Here's the scoreboard:

| # | Strategy family | Verdict vs passive SPY |
|---|---|---|
| 1 | Trend-following overlay (SMA regime) | NO-GO |
| 2 | Volatility targeting | NO-GO |
| 3 | Dual momentum (rotate to bonds) | NO-GO |
| 4 | Cross-sectional momentum (pick winners) | NO-GO |
| 5 | Cross-asset time-series momentum | NO-GO |
| 6 | Mean-reversion / statistical pairs | NO-GO |
| 7 | Event-driven (post-earnings drift) | NO-GO |

The first three are *defensive overlays* — they try to time when to step out of the market. All three reduced
drawdown but produced **zero out-of-sample alpha**: cutting risk is not the same as beating the benchmark on a
risk-adjusted basis. That distinction trips up a lot of people. A strategy that loses less in a crash but lags a
simple buy-and-hold over the full cycle has not found an edge. It has found a worse version of cash.

Two of the seven are worth telling as their own stories, because they're where the discipline actually earned
its keep.

## The "edge" that was really survivorship bias

Family #4, cross-sectional momentum (hold the recent winners), looked the most promising. On a broad universe it
*passed* my criteria — a Sharpe ratio comfortably above SPY. For about a day, I had a GO.

Then I asked the uncomfortable question: **was that edge real, or was it an artifact of which names I let into
the universe?** Today's index membership is contaminated by hindsight. A list of "today's large caps" run back to
2016 silently over-includes the handful of stocks that became huge — exactly the names a momentum strategy loves.
That's survivorship bias, and it flatters momentum specifically.

So I rebuilt the test on a **survivorship-free, point-in-time** universe: the actual index membership as it was on
each historical date, including the names that later got dropped or delisted. Same rule, honest universe.

The Sharpe ratio collapsed below SPY. The GO became a clean **NO-GO**. The "edge" had been living in a few
ex-post mega-winners that a naive universe over-included. Removing the bias removed the alpha — which is exactly
what a separate decomposition test had predicted it would.

## The $0 control test that killed a t = 5.7

Family #7, post-earnings-announcement drift, gave me the only genuinely real *signal* in the whole program. Names
that jumped on an earnings surprise kept drifting in the same direction afterward — statistically, by a margin
with a **t-statistic around 5.7**, positive in ten of eleven years. By the standards most people use, that's a
slam dunk. "Five sigma. Ship it."

I didn't ship it. I ran a control that costs nothing but discipline: **hedge out the market.** If the drift is
real *alpha*, it should survive a market-neutral or beta-hedged construction. If it's just *beta* — the post-shock
names happening to be high-beta and riding the market up — the hedged version goes flat or negative.

Every hedged version went **negative.** The t = 5.7 drift was market beta in disguise, not harvestable alpha. The
signal was real; the *edge* was not. A free diagnostic on data I already had saved me from paying for a premium
data feed to chase a mirage.

> This is the whole game. A high t-stat tells you a pattern is unlikely to be random. It tells you **nothing**
> about whether the pattern is *yours to harvest* after costs and hedging. Conflating the two is how confident,
> credentialed people lose money.

## Concluding is a feature, not a failure

When the stop-rule's budget was spent, I wrote a capstone decision: **the program concludes. Passive SPY is the
honest benchmark.** No re-tuning a loser into a winner, no opening an eighth family hoping for a lucky draw.

That last move is the one most people can't make. There's enormous pressure — especially when you've built all
the infrastructure — to keep twisting knobs until the backtest smiles. **Pre-committing to a stop-rule, and then
honoring it, is what separates research from rationalization.** A clean, well-documented negative is a success of
method.

## Why a hiring manager should care

You might reasonably ask what a failed trading research program has to do with running production systems. To me
it's the same muscle:

- The discipline that **freezes a hypothesis in git before the run** is the discipline that **writes the
  rollback plan before the deploy.**
- The instinct to **distrust a beautiful t = 5.7** is the instinct to **distrust a green test suite that's
  testing the wrong thing.**
- The willingness to **stop on the evidence and document the negative** is the willingness to **say "this
  approach isn't working" in a design review** instead of shipping "probably fine" to production.

Measuring honestly and stopping on the evidence is the senior skill. The infrastructure was the easy part. Not
fooling myself was the hard part — and it's the part I'm proudest of.

---

*Trinitrade is a real, live system I designed, built, and operated solo. Every number here is traceable to a dated
Architecture Decision Record. The sanitized source and architecture live in the
[case study](/trinitrade) and the [public repository](https://github.com/mizolutions/trinitrade).*
