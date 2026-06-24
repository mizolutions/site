---
title: 'Pre-registration for backtests: how to not fool yourself'
description: 'A backtest can always be tortured into a confession. Freezing the hypothesis in git before you run it is the cheapest defense against fooling yourself.'
pubDate: 2026-07-07
lang: 'en'
draft: true
tags: ['quant', 'research', 'backtesting', 'engineering-discipline', 'statistics']
---

There's a dirty secret in quantitative research: **give a backtest enough chances and it will confess to
anything.** Universe, lookback, rebalance frequency, entry threshold, exit threshold — each is a knob, and you
have one history to tune them against. Turn enough knobs and *something* will look like a money printer. It
won't be an edge. It will be your own optimism, laundered through a chart.

I ran a structured research program on **Trinitrade**, my live trading platform, specifically to *not* fall for
that. The single most important tool wasn't a fancy model or an exotic dataset. It was a discipline borrowed from
science: **pre-registration** — writing down exactly what I would test, and what would count as success, **before
running anything.** This post is about why that works and how to do it concretely.

## The problem: too many forking paths

The failure mode has a name. Statisticians call it the [multiple comparisons problem](https://en.wikipedia.org/wiki/Multiple_comparisons_problem);
Andrew Gelman calls it the *garden of forking paths*. The idea is simple: if you make enough analysis choices
*after* seeing the data, you can almost always find a result that looks "significant" — even in pure noise.

<figure>
  <img src="/blog/pre-registration-backtests/forking-paths.svg" alt="A tree of analysis choices — universe, lookback, rebalance, thresholds — branching into thousands of paths, one of which looks profitable by chance" loading="lazy" />
  <figcaption>The garden of forking paths — with enough post-hoc choices, at least one configuration looks profitable by pure chance.</figcaption>
</figure>

The dangerous part is that this doesn't feel like cheating. You're not fabricating data. You're "exploring." You
try a 200-day lookback, it's meh, you try 100, it's better, you swap the universe, you add a volatility filter —
and at some point the equity curve smiles back at you. You stop, and you tell yourself you *found* something. What
you actually did was run dozens of silent hypothesis tests and report only the winner. That's not signal; it's a
selection effect.

## The fix: freeze the hypothesis before the run

Pre-registration breaks the loop by **fixing every degree of freedom in advance.** Before a single backtest runs,
I write the hypothesis down — completely — and commit it to git. The commit timestamp is the proof: the criteria
existed *before* I saw the result, so I can't have moved them afterward.

<figure>
  <img src="/blog/pre-registration-backtests/prereg-vs-phack.svg" alt="Two flows: a p-hacking loop that runs, tweaks a knob, and repeats until it looks good; versus pre-registration that freezes the hypothesis in git, runs once, and applies pre-set criteria" loading="lazy" />
  <figcaption>P-hacking is a loop you exit when the chart looks good. Pre-registration is a straight line: freeze, run once, judge against fixed criteria.</figcaption>
</figure>

Concretely, the frozen document pins down five things — and **the universe is one of them**, because *which names
you allow into the test* is itself a parameter (and a notorious source of [survivorship bias](https://en.wikipedia.org/wiki/Survivorship_bias)):

<figure>
  <img src="/blog/pre-registration-backtests/what-gets-frozen.svg" alt="One dated git commit pinning down the universe, the rule, the parameters, the acceptance criteria, and the GO/NO-GO verdict mapping" loading="lazy" />
  <figcaption>What gets frozen — all five in one dated commit, before any run.</figcaption>
</figure>

Here's a representative pre-registration from the program — written and committed *before* the backtest existed:

```yaml
# EDGE-H00X.md — frozen 2026-06-13, commit a1b2c3d (BEFORE any run)
hypothesis: cross-sectional momentum beats passive SPY, net of costs
universe: S&P 100 members, frozen list           # a parameter — pinned on purpose
rule: hold the top tercile by trailing 12m return, equal-weight, monthly rebalance
params: { lookback_days: 252, rebalance_days: 21, top_fraction: 0.333, costs_bps: 20 }
acceptance:
  C1: Sharpe(strategy) > Sharpe(SPY)             # risk-adjusted, net
  C2: winners-minus-losers spread > 0            # the mechanism actually pays
  C3: positive excess return in >= 3 of 4 out-of-sample windows
  C4: survives walk-forward (no in-sample peeking)
verdict:
  GO:    C1 and C2 and C3 and C4
  NO-GO: C1 fails or C3 fails
budget: 2 shots for this mechanism class; if both fail -> conclude
```

Once that's committed, the backtest is almost an anticlimax. I run it **once**, read the criteria, and write down
the verdict — GO or NO-GO. No "let me just try one more lookback." The result is whatever the pre-registered rule
says it is.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>Pre-registration doesn't make you <em>right</em> — it makes you <strong>honest</strong>. It converts a vague
  "I found something" into a falsifiable "I tested a specific thing, and here is the pre-agreed verdict."</p>
</aside>

## The two rules that make it stick

Pre-registration only works if you also commit to two follow-through rules, because the temptation to cheat moves
*downstream* of the first result.

**Rule 1 — a stop-rule, fixed in advance.** Before starting a mechanism class, I fix an attempt budget: e.g.
*two shots; if both are NO-GO, the class is concluded.* Without this, "pre-registration" degenerates into running
pre-registered hypotheses forever until one passes by luck — multiple comparisons with extra steps.

**Rule 2 — never re-tune a NO-GO into a GO.** When a hypothesis fails, the follow-up must be a *different
mechanism* or *more data / breadth* — never the same idea with the knobs nudged until it passes.

<figure>
  <img src="/blog/pre-registration-backtests/follow-up-rule.svg" alt="After a NO-GO, the allowed move is a different mechanism class or more data; re-tuning the same knobs until it passes is forbidden because it is p-hacking" loading="lazy" />
  <figcaption>The follow-up rule — a NO-GO may lead to a new mechanism or more data, never to knob-twiddling the loser.</figcaption>
</figure>

This is the discipline that lets a *negative* result mean something. If I'd allowed myself to re-tune, every
NO-GO would just be a way-station on the road to a manufactured GO. By pre-committing, a NO-GO is a real,
trustworthy answer — and across the whole program, seven mechanism families came back NO-GO and I believed every
one of them.

## Why this is an engineering skill, not just a stats trick

If you've written an RFC or an Architecture Decision Record, you already know pre-registration — you just apply it
to code instead of backtests:

- Writing the **acceptance criteria before the run** is writing the **test before the implementation.** You define
  "done" before you start, so you can't quietly redefine success to match whatever you built.
- The **stop-rule** is the **kill-criteria on a spike**: "we'll time-box this investigation; if it doesn't clear
  the bar, we stop." It's how you avoid sunk-cost engineering.
- "**Never re-tune a NO-GO**" is "**don't keep loosening the threshold until the flaky test passes.**" Moving the
  goalposts to make red turn green is the same sin in both worlds.

The same instinct that makes a backtest trustworthy makes an engineering decision trustworthy: decide what would
change your mind *before* you look, and then actually honor it. Pre-registration is just intellectual honesty with
a timestamp.

## References & further reading

- [The multiple comparisons problem](https://en.wikipedia.org/wiki/Multiple_comparisons_problem) and the *garden of forking paths* (Gelman & Loken).
- [Researcher degrees of freedom](https://en.wikipedia.org/wiki/Researcher_degrees_of_freedom) — the choices that quietly inflate false positives.
- [Pre-registration](https://en.wikipedia.org/wiki/Preregistration_(science)) in the sciences.
- [Overfitting](https://en.wikipedia.org/wiki/Overfitting) and [walk-forward optimization](https://en.wikipedia.org/wiki/Walk_forward_optimization).
- Bailey, Borwein, López de Prado & Zhu, "The Probability of Backtest Overfitting" — why more trials demand a higher bar.
- Harvey, Liu & Zhu (2016), "…and the Cross-Section of Expected Returns" — the case that a *t*-stat of 2 is nowhere near enough after data-mining.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — where this program lived.
- The companion post: [I tried to find a trading edge and failed seven times](/blog/no-trading-edge-seven-strategies).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. Every pre-registration described here was
a real, dated git commit. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
