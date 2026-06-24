---
title: "A 'Control Tower' for solo operators"
description: 'A solo operator wears every hat at once — and quietly neglects whole domains while firefighting the loudest one. A lightweight governance layer, a single traffic-light board across all your domains, fixes that without becoming bureaucracy.'
pubDate: 2027-01-26
lang: 'en'
draft: true
tags: ['leadership', 'process', 'governance', 'solo', 'operations']
---

When you run a system alone, you are simultaneously the engineer, the SRE, the security team, the finance
department, and the product owner. The failure mode isn't that you can't do any one of those jobs — it's that you do
whichever one is *loudest* on a given day and silently neglect the rest. On [Trinitrade](/trinitrade) I built a
lightweight "Control Tower" to fix exactly that: a governance layer that forces me to look at every domain regularly,
without turning into the bureaucracy that governance usually implies.

## The many-hats problem

The danger of solo operation is invisible neglect. With seven domains to mind — trading, risk, infrastructure,
security, finance, compliance, product — attention naturally flows to whatever is on fire or whatever is most fun.
The other domains don't complain; they just quietly drift out of date until one of them fails in a way you didn't
see coming, because you hadn't looked at it in weeks.

<figure>
  <img src="/blog/control-tower-solo-operators/many-hats.svg" alt="One person responsible for seven domains tends to work on the loudest one each day while the others silently drift out of date and accumulate hidden risk" loading="lazy" />
  <figcaption>The many-hats problem — attention flows to the loudest domain, and the quiet ones drift until they fail.</figcaption>
</figure>

## The Control Tower: one board, every domain

The fix is a single dashboard document with a **traffic-light status per domain** — green, yellow, red — plus the
day's top few priorities. It's not a project management suite; it's one page you look at every working session. The
discipline is simply that *every* domain has a colored light, so a domain you've been ignoring shows up as a stale
green or a creeping yellow, and the neglect becomes visible instead of silent.

<figure>
  <img src="/blog/control-tower-solo-operators/traffic-light-board.svg" alt="A single board shows a green, yellow, or red traffic light for each of the seven domains plus the top three priorities for the day, making neglected domains visible" loading="lazy" />
  <figcaption>The Control Tower — a traffic light per domain plus the day's top priorities, on one page you actually read.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>For a solo operator, governance isn't about coordinating people — it's a <strong>forcing function to look at
  every domain</strong>, not just the loud one. A traffic-light board across all your hats turns invisible neglect
  into a visible yellow light. <em>You can't firefight a domain you forgot you owned; the board reminds you that you
  own it.</em></p>
</aside>

## A place for everything

The Control Tower works because it doesn't try to be everything. It's the top-level status view, and it delegates the
detail to a few focused artifacts, each with one job: a **decision log** for choices (immutable ADRs), a **RAID log**
for risks, assumptions, issues, and decisions in flight, and a **roadmap** that mirrors what's happening now, next,
and later. The board tells you *where* to look; the artifact tells you *what's there*.

<figure>
  <img src="/blog/control-tower-solo-operators/artifacts.svg" alt="The Control Tower dashboard delegates detail to focused artifacts: a decision log for ADRs, a RAID log for risks, and a roadmap for now-next-later, each with a single job" loading="lazy" />
  <figcaption>A place for everything — the board on top, with a decision log, a RAID log, and a roadmap each doing one job.</figcaption>
</figure>

The rule that keeps this from collapsing into a wiki swamp is separation: decisions live in the decision log, risks
in the RAID log, status on the board. When everything has a home, nothing accumulates in a giant undifferentiated
document that you stop reading.

## Rules that keep it light

Governance becomes bureaucracy when the rules outnumber the value. So the Control Tower runs on a tiny set of rules,
each of which earns its place by preventing a specific solo-operator failure:

- **A work-in-progress limit** — only so many things "active" at once — because a solo operator who starts ten things
  finishes none.
- **One item in progress at a time**, so context-switching doesn't shred your focus.
- **Every item tagged with a domain**, so you can see at a glance whether you're neglecting a whole area.
- **Observable done-criteria** before starting, so "done" isn't a feeling.
- **Framework changes only at a scheduled review**, never in the heat of the moment, so you don't thrash the process
  itself every time something goes wrong.

<figure>
  <img src="/blog/control-tower-solo-operators/light-rules.svg" alt="A small set of operating rules: a WIP limit, one item in progress, a mandatory domain tag, observable done-criteria, and framework changes only at scheduled reviews" loading="lazy" />
  <figcaption>Rules that stay light — each one prevents a specific solo failure, and there are few enough to actually follow.</figcaption>
</figure>

## The honest payoff: it told me to stop

The most valuable thing the Control Tower ever did was deliver bad news clearly. By forcing an honest status across
every domain, it surfaced an uncomfortable truth: the engineering was excellent while the core objective wasn't
working. A board that's willing to show a red light in the domain that matters most is what let me make a clear-eyed
decision to conclude the project on the engineering's terms, rather than drifting on because the parts that *were*
green felt like progress. Governance that can only report success isn't governance; it's decoration.

## The lesson: structure is a gift you give your future attention

The instinct is that process slows a solo operator down. The opposite is true: without a lightweight structure, your
attention is captured by whatever shouts loudest, and the quiet, important things rot. A single status board, a few
focused logs, and a handful of rules cost almost nothing to maintain and buy you the one thing a solo operator can't
otherwise have — a guarantee that you'll regularly look at *every* part of the system, not just the part that's
currently on fire. The smallest team still needs to be reminded what it's responsible for.

## References & further reading

- [RAID log](https://en.wikipedia.org/wiki/RAID_log) — risks, assumptions, issues, dependencies.
- [Work in progress limits](https://en.wikipedia.org/wiki/Kanban_(development)#Work_in_progress_limits) from Kanban.
- [Management dashboard](https://en.wikipedia.org/wiki/Dashboard_(business)) — the single-pane status idea.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the Control Tower and the decision to conclude.
- Related: [ADRs for a team of one](/blog/adrs-team-of-one) and [building (and concluding) a project in public](/blog/building-concluding-in-public).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The Control Tower described here is real and
is what surfaced the honest status that led to concluding the project. The sanitized source lives in the
[case study](/trinitrade) and the [public repository](https://github.com/mizolutions/trinitrade).*
