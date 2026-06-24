---
title: "Architecture Decision Records for a team of one"
description: 'ADRs are pitched as a tool for teams — capture why a decision was made so colleagues understand. But the most valuable colleague an ADR serves is your future self, who will have forgotten every reason. Here is how lightweight ADRs paid off for a solo project.'
pubDate: 2027-01-19
lang: 'en'
draft: true
tags: ['leadership', 'architecture', 'documentation', 'process', 'adr']
---

Architecture Decision Records are usually sold as a team communication tool: write down *why* you made a decision so
that other engineers can understand it later. As a solo developer, that pitch sounds irrelevant — there are no other
engineers. So I almost skipped them. On [Trinitrade](/trinitrade) I'm glad I didn't, because the most important
"other engineer" an ADR serves is the version of you six months from now who has forgotten every reason you ever had.

## The colleague you're actually writing for

The mistake is thinking an ADR is for *other people*. The real audience is **future you** — someone with all your
habits and none of your current context. Future-you will look at a strange-seeming design choice and ask "why on
earth did I do it this way?" Without a record, you re-derive the reasoning from scratch, or worse, "fix" something
that was a deliberate decision and reintroduce the very problem it solved.

<figure>
  <img src="/blog/adrs-team-of-one/future-you.svg" alt="An ADR is written not for a team but for a future version of the same developer who has forgotten the context and asks why a decision was made" loading="lazy" />
  <figcaption>The real audience — not colleagues, but future-you, who has your habits and none of your current context.</figcaption>
</figure>

## What goes in a lightweight ADR

An ADR doesn't need a heavyweight template — heavyweight templates are exactly why people stop writing them. Mine are
short markdown files, numbered sequentially, each capturing four things: the **context** (the forces and constraints
at play), the **decision** (what I chose), the **alternatives** (what I considered and rejected), and the
**consequences** (what this commits me to, good and bad).

<figure>
  <img src="/blog/adrs-team-of-one/anatomy.svg" alt="A lightweight ADR has four parts: context and forces, the decision made, the alternatives considered and rejected, and the consequences it commits to" loading="lazy" />
  <figcaption>The anatomy — context, decision, alternatives, consequences. Short enough that you'll actually write it.</figcaption>
</figure>

The **alternatives** section is the one people skip and the one that pays off most. Recording what you rejected, and
why, stops you from re-litigating the same debate every few months — when future-you wonders "should this be
multi-replica?", the ADR already says "considered it, here's why not," and the conversation is over before it starts.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>An ADR for a solo project isn't bureaucracy — it's a <strong>letter to your future self</strong> who has lost
  all the context. Its highest-value section is the <em>road not taken</em>: writing down the alternatives you
  rejected, and why, means you never re-argue a settled decision or accidentally undo it. <em>The cheapest way to
  keep a decision made is to write down why you made it.</em></p>
</aside>

## The payoff loop

The value shows up exactly when you're confused. You hit a design choice that doesn't make immediate sense, you go
to the decision log, you find the ADR, and the reasoning is right there — context, alternatives, consequences. No
archaeology, no re-derivation, no risk of undoing a deliberate trade-off. The loop is short and it closes every
time you'd otherwise burn an hour reconstructing your own intent.

<figure>
  <img src="/blog/adrs-team-of-one/payoff-loop.svg" alt="When a design choice is confusing, the developer consults the decision log, finds the ADR, reads the reasoning, and avoids re-deriving or undoing the decision" loading="lazy" />
  <figcaption>The payoff loop — confusion leads to the ADR, the ADR has the reasoning, and the question is answered in minutes.</figcaption>
</figure>

There's a second, subtler payoff: the act of *writing* the ADR forces you to think the decision through. More than
once, drafting the alternatives section made me realize my first choice was wrong before I'd built anything. The ADR
isn't just a record of thinking — it's a tool that *produces* better thinking, because vague reasoning can't survive
being written down in full.

## Keep them immutable: supersede, don't edit

The one rule that keeps a decision log trustworthy is that an accepted ADR is **immutable**. When a decision
changes, you don't edit the old record — you write a new ADR that supersedes it and link the two. This preserves the
history of *how* your thinking evolved, which is often as valuable as the current state: you can see not just what
you believe now, but the path that got you there, and why the old reasoning no longer holds.

<figure>
  <img src="/blog/adrs-team-of-one/supersede.svg" alt="When a decision changes, the old ADR is kept immutable and marked superseded by a new ADR, preserving the history of how the thinking evolved" loading="lazy" />
  <figcaption>Supersede, don't edit — keep the old ADR, link a new one, and preserve the evolution of the reasoning.</figcaption>
</figure>

This immutability has another benefit I leaned on heavily: an ADR written at decision time is a timestamped,
a-priori record. When you later evaluate whether a decision worked, you can prove you reasoned it through *before*
the outcome was known — not a hindsight rationalization. A decision log where each entry is fixed in time is a
defense against fooling yourself.

## The lesson: governance scales down, not just up

The reflex is to think process is for big teams and solo work should be all flow, no paperwork. But the lightest
forms of governance — a numbered decision log, one file per choice — pay off at *any* team size, because their real
job isn't coordination between people; it's coordination between you-now and you-later. Writing down why you decided
something, what you rejected, and what it commits you to costs ten minutes and saves you from re-deriving, second-
guessing, and accidentally undoing your own work. The smallest team in the world still benefits from remembering why
it did what it did.

## References & further reading

- [Architecture decision records](https://adr.github.io/) — the format and its variants.
- Michael Nygard's [original ADR post](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — the lightweight template.
- [Architecture decision record](https://en.wikipedia.org/wiki/Architectural_decision) — the broader concept.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the decision log that ran through the whole project.
- Related: [a Control Tower for solo operators](/blog/control-tower-solo-operators) and [pre-registering backtests](/blog/pre-registration-backtests).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. Its decision log of ADRs is real and ran
from the first architecture choice to the decision to conclude the project. The sanitized source lives in the
[case study](/trinitrade) and the [public repository](https://github.com/mizolutions/trinitrade).*
