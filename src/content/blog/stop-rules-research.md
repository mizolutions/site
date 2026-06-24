---
title: 'Stop-rules: why concluding a research program is a success'
description: 'The hardest part of a research program is not a model — it is writing the sentence "we stop now." A pre-committed stop-rule is what keeps pre-registered work from quietly becoming p-hacking.'
pubDate: 2026-07-28
lang: 'en'
draft: true
tags: ['quant', 'research', 'engineering-discipline', 'statistics', 'decision-making']
---

The hardest thing I wrote during a months-long research program wasn't a model or an evaluator. It was one
sentence: **"The program concludes. Passive SPY is the honest benchmark."** Choosing to stop — with no edge found,
after building all the infrastructure to find one — is the discipline almost nobody talks about, and it's the one
that makes every other result trustworthy.

I [pre-registered every hypothesis](/blog/pre-registration-backtests) before running it. But pre-registration
alone isn't enough, because the temptation to cheat doesn't live inside a single test. It lives at the **program
level** — in the decision of how many tests to run, and when to stop.

## Pre-registration without a stop-rule is still p-hacking

Imagine I pre-register each hypothesis perfectly — universe, rule, criteria, all frozen in git before the run.
Clean. Now I run hypothesis #1: NO-GO. #2: NO-GO. #3, #4, #5… and I just keep opening new ones until one finally
clears the bar. Then I publish *that* one.

Every individual test was honest. The **program** was not. Running pre-registered hypotheses indefinitely until
one passes by luck is just the [multiple comparisons problem](https://en.wikipedia.org/wiki/Multiple_comparisons_problem)
with extra paperwork. It's the [Texas sharpshooter fallacy](https://en.wikipedia.org/wiki/Texas_sharpshooter_fallacy):
fire enough shots and you can always draw a target around a cluster afterward.

<figure>
  <img src="/blog/stop-rules-research/loop-vs-stoprule.svg" alt="Without a stop-rule, you keep opening new pre-registered hypotheses until one passes by luck and declare an edge; with a pre-committed stop-rule, you fix the attempt budget before starting and conclude when it is spent" loading="lazy" />
  <figcaption>The difference is the budget — fixed before you start, not discovered when the chart finally smiles.</figcaption>
</figure>

## The fix: commit to a budget before you start

A stop-rule is an attempt budget you fix **before running anything** — and then honor. Mine had two levels:

- **Per mechanism class:** at most two shots (the second only if the first was inconclusive, never a re-tune),
  judged against the same frozen criteria.
- **Program-level:** if the first several mechanism classes all came back NO-GO, the program pauses and I write a
  capstone decision — rather than spawning class after class hoping for a lucky draw.

<figure>
  <img src="/blog/stop-rules-research/structure.svg" alt="Before the program, freeze the budget; per mechanism class allow two shots against the same criteria; a program rule says several NO-GO classes triggers a pause and a capstone decision" loading="lazy" />
  <figcaption>The structure — a budget per class, and a program-level rule that turns a string of NO-GOs into a deliberate conclusion.</figcaption>
</figure>

That's exactly how it played out. Across two tracks, seven mechanism families came back NO-GO, the program-level
stop-rule fired, and I concluded with a written capstone decision. I did **not** open an eighth family. The
honest move and the pre-committed move were the same move — which is the whole point of committing in advance.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>A stop-rule moves the decision to quit from the <strong>end</strong> (when you're emotionally invested and the
  data is in front of you) to the <strong>beginning</strong> (when you're still honest). You're not deciding
  whether to stop — you already decided. You're just <em>honoring</em> it.</p>
</aside>

## Why the bar has to account for the number of tries

There's a statistical reason the budget matters. Run one test at p &lt; 0.05 and a false positive is unlikely.
Run twenty and you expect *about one* to look "significant" purely by chance. So there are only two honest
responses to running many trials: **raise the bar** (correct your threshold for the number of comparisons), or
**cap the trials** (a stop-rule). Do neither, and "I found something across 30 backtests" means almost nothing.

<figure>
  <img src="/blog/stop-rules-research/rising-bar.svg" alt="One trial at p below 0.05 means something; twenty trials give about one significant result by chance; the two honest fixes are to raise the bar or cap the trials" loading="lazy" />
  <figcaption>More tries, more flukes. You either raise the bar or cap the tries — a stop-rule is the cap.</figcaption>
</figure>

## The real enemy is sunk cost

The reason stop-rules are hard has nothing to do with statistics. It's that by the time you've built the data
pipeline, the evaluator, the whole apparatus, *quitting feels like waste.* The [sunk-cost fallacy](https://en.wikipedia.org/wiki/Sunk_cost)
whispers: you've come this far, just one more hypothesis. That whisper is exactly how a disciplined program turns
into a slow march toward a manufactured result.

<figure>
  <img src="/blog/stop-rules-research/sunk-cost.svg" alt="After building all the infrastructure, the sunk-cost pull says just one more hypothesis; emotion leads to a manufactured GO, while honoring the pre-commitment leads to a trustworthy NO-GO" loading="lazy" />
  <figcaption>Sunk cost pulls you toward 'one more try.' The pre-commitment is what overrides it.</figcaption>
</figure>

Pre-committing to the stop-rule is how you beat your future, invested self. And the payoff is that the **negative
result becomes an asset.** A clean, well-documented NO-GO isn't a wasted program — it's reusable knowledge: it
tells me (and anyone reading the decision record) exactly what was tried, how, and why it didn't work, so nobody
re-runs the same dead end. Concluding with a dated capstone is a deliverable, not a defeat.

## The same courage in engineering

If you've run an engineering spike, you already know stop-rules — or you've been burned by their absence:

- **Time-boxing a spike** with kill-criteria ("we investigate this for one week; if it doesn't clear the bar, we
  drop it") is a stop-rule against sunk-cost engineering.
- **Declaring a project done — or dead** — instead of letting it limp along consuming attention forever.
- Saying **"this approach isn't working"** in a design review, out loud, when everyone (including you) has poured
  effort into it.

The skill is identical across both worlds: decide your exit condition *before* you're emotionally committed, write
it down, and then have the discipline to honor it when the moment comes. Knowing when to stop — and being able to
prove you stopped for a principled reason, not a whim — is a senior skill. A clean negative, concluded on purpose,
is a success of method.

## References & further reading

- [The multiple comparisons problem](https://en.wikipedia.org/wiki/Multiple_comparisons_problem) — why running more tests demands a higher bar.
- [Texas sharpshooter fallacy](https://en.wikipedia.org/wiki/Texas_sharpshooter_fallacy) — drawing the target after firing.
- [Sunk-cost fallacy](https://en.wikipedia.org/wiki/Sunk_cost) — the real reason stop-rules are hard.
- [Pre-registration](https://en.wikipedia.org/wiki/Preregistration_(science)) — the discipline a stop-rule completes.
- [Publication bias](https://en.wikipedia.org/wiki/Publication_bias) — why reporting negatives matters.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — where the program concluded.
- Companion posts: [seven strategies, no edge](/blog/no-trading-edge-seven-strategies), [pre-registration](/blog/pre-registration-backtests), [survivorship bias](/blog/survivorship-bias-backtest), and [the $0 control test](/blog/zero-cost-control-test).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The stop-rule and capstone described here
were real, dated decision records. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
