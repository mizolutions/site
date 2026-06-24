---
title: "The $0 control test: when a t = 5.7 'edge' is just beta"
description: 'I found a five-sigma trading signal and threw it away. A free, market-neutral control test showed the "edge" was market beta in disguise — not harvestable alpha. Here is the decomposition that saved me from paying for it.'
pubDate: 2026-07-21
lang: 'en'
draft: true
tags: ['quant', 'research', 'backtesting', 'statistics', 'engineering-discipline']
---

I once found a trading signal with a *t*-statistic of about **5.7** — five sigma, positive in ten of eleven years
— and I deleted it. Not because the statistics were wrong. They were right. I deleted it because a control test
that cost **$0** showed the "edge" was something I could already buy for free: market exposure. This is the story
of that test, and why "is it statistically real?" and "is it an edge?" are two completely different questions.

## A real signal is not the same as a harvestable edge

Here's the trap that sinks confident, credentialed people: a high *t*-statistic tells you a pattern is unlikely to
be random. It tells you **nothing** about whether that pattern is *yours to harvest* after costs, after hedging,
and after you account for exposures you could have gotten for free. A pattern can be rock-solid real and still put
zero dollars in your pocket — because the thing driving it is just **beta**, the market's own return, wearing a
clever disguise.

Every strategy's return decomposes into two parts: the part explained by market exposure (**beta** — free, you
can get it by buying an index fund) and the part that's left over (**alpha** — the actual skill). If your
"edge" disappears the moment you hedge out the market, you never had an edge. You had a leveraged, complicated way
to own SPY.

<figure>
  <img src="/blog/zero-cost-control-test/decomposition.svg" alt="A strategy's return splits into market beta (free, available via an index) and alpha (skill that survives hedging); hedge out beta and if nothing is left, it was beta, not an edge" loading="lazy" />
  <figcaption>Every return is beta + alpha. Hedge out the beta; if nothing survives, you were just buying the market.</figcaption>
</figure>

## The five-sigma signal that looked like the real thing

The signal was [post-earnings-announcement drift](https://en.wikipedia.org/wiki/Post%E2%80%93earnings-announcement_drift)
(PEAD): stocks that jump on an earnings surprise tend to keep drifting in the same direction for weeks afterward.
It's one of the most-documented anomalies in finance, and in my pre-registered test it showed up loud and clear —
names that jumped drifted about **+0.71% more** than non-event names, with a Welch *t* of ~**5.7**, positive in
**ten of eleven years**.

By the standard most people apply, that's a slam dunk. Five sigma. Ship it. And here's the tempting next move: the
free price-proxy data I used was crude, so the obvious upgrade was to **pay ~$30–50/month for premium earnings
data** (real surprise magnitudes) and build the "real" version. I was about to reach for my wallet.

## The control that costs nothing but discipline

Before spending a cent, I ran the cheapest, most brutal test there is: **hedge out the market and see if anything
survives.** If the drift is real alpha, a market-neutral or beta-hedged construction should still make money. If
it's just beta — the post-shock names happening to be high-beta and riding a rising market — the hedged versions
go flat or negative.

I built three independent hedged versions of the same book:

<figure>
  <img src="/blog/zero-cost-control-test/three-hedges.svg" alt="The PEAD long-only book with t=5.7 is rebuilt three ways — dollar-neutral long/short, inverse-volatility weighted, and beta-hedged long-only — and all three produce negative risk-adjusted returns" loading="lazy" />
  <figcaption>Three independent hedges of the same book — dollar-neutral, inverse-vol, and beta-hedged — all came back negative.</figcaption>
</figure>

**Every single one was negative** (risk-adjusted returns around −1.0). Not weak-positive. Not break-even.
Negative. The moment I removed market exposure, the entire "edge" didn't just vanish — it inverted. That's the
unmistakable signature of a result that was *all beta*.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>A signal that survives a significance test but <strong>dies under a hedge</strong> was never alpha. The
  <em>t</em>-stat measured a real pattern; the hedge measured whether that pattern was anything more than the
  market you can buy for free.</p>
</aside>

## What was actually happening

The mechanism, once you see it, is almost obvious. Stocks that gap up on an earnings surprise are
disproportionately **high-beta** names. Over a generally rising market, high-beta names go up *more* than the
market — so they keep "drifting" up after the event. My event filter wasn't detecting a special post-earnings
force; it was quietly selecting a basket of high-beta stocks and then taking credit for the market's tailwind.

<figure>
  <img src="/blog/zero-cost-control-test/mechanism.svg" alt="Stocks that jump on an earnings surprise tend to be high-beta, so they ride the rising market up, which looks like post-earnings drift but is actually just market exposure" loading="lazy" />
  <figcaption>The drift was selection: post-shock names skew high-beta, so they ride the market — and the market got the credit.</figcaption>
</figure>

The earnings event was real. The drift, as a *statistical phenomenon*, was real. But the part I could actually
capture and keep, after neutralizing the market? Zero — or worse. Paying for premium data would have bought me a
sharper measurement of a thing that still wasn't an edge.

<figure>
  <img src="/blog/zero-cost-control-test/decision.svg" alt="Before paying about fifty dollars a month for premium data, run a zero-cost control on data you already have; if it fails the hedge, don't pay because the expected value is negative" loading="lazy" />
  <figcaption>The decision rule — run the free control before the paid upgrade. A failed hedge means negative EV; don't spend.</figcaption>
</figure>

## Decompose before you believe

The general principle is bigger than trading: **before you celebrate a "win", decompose it into the things that
could explain it for free.** In quant terms, that's hedging out beta. Everywhere else, it's controlling for the
boring explanation:

- A latency dashboard improves after a deploy — but did the change help, or did **traffic just drop**? Hold load
  constant before you take the credit.
- A feature "lifts conversion" — but was it the feature, or a **seasonal spike** that hit the test and control
  unevenly? That's [confounding](https://en.wikipedia.org/wiki/Confounding), and it's the same bug as mistaking
  beta for alpha.
- An optimization "doubled throughput" — on a benchmark that happened to fit in cache this time.

The discipline is identical: find the cheapest control that could explain your result away, and run *that* before
you believe the flattering story — and definitely before you spend money on it. A result that can't survive its
own control was never yours to keep.

## References & further reading

- [Alpha](https://en.wikipedia.org/wiki/Alpha_(finance)) and [beta](https://en.wikipedia.org/wiki/Beta_(finance)) — the decomposition at the heart of this post.
- [Capital asset pricing model](https://en.wikipedia.org/wiki/Capital_asset_pricing_model) and [market-neutral](https://en.wikipedia.org/wiki/Market_neutral) investing.
- [Post-earnings-announcement drift](https://en.wikipedia.org/wiki/Post%E2%80%93earnings-announcement_drift) — Bernard & Thomas (1989).
- [Confounding](https://en.wikipedia.org/wiki/Confounding) — the same mistake outside finance.
- [Statistical significance](https://en.wikipedia.org/wiki/Statistical_significance) vs effect size — why a big *t* is not a big edge.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — where this signal got its capstone.
- Companion posts: [seven strategies, no edge](/blog/no-trading-edge-seven-strategies), [pre-registration for backtests](/blog/pre-registration-backtests), and [survivorship bias](/blog/survivorship-bias-backtest).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The t-statistic and hedged results here
are from real, dated, pre-registered backtests. The sanitized source lives in the [case study](/trinitrade) and
the [public repository](https://github.com/mizolutions/trinitrade).*
