---
title: 'Anything not in IaC will drift: the deploy that silently reverted production'
description: 'A routine deploy quietly flipped my live trading system back to paper mode — for days — because one setting lived outside Infrastructure as Code. The incident, the root cause, and why "declarative everything" is the only fix.'
pubDate: 2026-08-18
lang: 'en'
draft: true
tags: ['devops', 'iac', 'aws', 'sre', 'incident']
---

The most dangerous deploy isn't the one that fails loudly. It's the one that succeeds — and silently changes
something you never asked it to. I shipped one of those on [Trinitrade](/trinitrade), my live trading system, and
it taught me a law I now treat as non-negotiable: **anything not in Infrastructure as Code will drift.**

Here's the incident, the root cause that makes it so sneaky, and the fix.

## The incident: live, then quietly not

Trinitrade can run against a **paper** broker account (fake money, for testing) or a **live** one (real money). I
had switched it to live using a small operational script — the kind of thing that registers a new task definition
and updates the running service directly. It worked. The system was live.

Days later, I shipped a completely unrelated change: activating a small risk feature flag, deployed through my
normal Infrastructure-as-Code path (`cdk deploy`). The deploy succeeded. Green across the board.

Except it had also, silently, **flipped the broker back to paper mode.** The system had been quietly trading on the
*paper* account — not the live one — and I only noticed days later when I went to verify a deposit and the numbers
didn't line up. No alarm fired. Nothing crashed. The deploy did exactly what it was written to do; the problem was
what it was written to do.

<figure>
  <img src="/blog/anything-not-in-iac-drifts/incident.svg" alt="Sequence: the operator switches the service to live out-of-band, ECS runs live invisibly to CloudFormation, then an unrelated cdk deploy re-asserts the template's paper task definition and silently reverts the service to paper" loading="lazy" />
  <figcaption>The incident — an out-of-band switch to live, silently reverted by the next unrelated deploy.</figcaption>
</figure>

## Root cause: IaC re-asserts the world it knows

Here's the mechanism, and it's the part worth internalizing. An Infrastructure-as-Code tool doesn't deploy your
*intent* — it deploys its *model* of reality, and then forces the world to match. CloudFormation (under CDK) holds
a record of what it believes the task definition should be. When I switched to live **out of band** — with a
script that talked to the service directly, bypassing the template — CloudFormation never found out. Its model
still said "paper."

So when the next `cdk deploy` ran, it did what it's supposed to do: it re-asserted its model onto reality.
"Reality says live? I don't have that on file. Setting it back to paper." The live switch wasn't *overridden by a
conflict* — it was erased by an apply that didn't even know it existed.

<figure>
  <img src="/blog/anything-not-in-iac-drifts/why-dryrun-lied.svg" alt="The dry-run compares the template against the last known IaC state, which was paper because it never learned about the out-of-band live switch, so the diff looks clean while reality gets reverted" loading="lazy" />
  <figcaption>Why the dry-run looked clean — the plan compares against IaC's known state, not the world. It diffed paper-vs-paper.</figcaption>
</figure>

This is the genuinely scary part: **the dry-run lied, and it wasn't a bug.** I did run a `cdk diff` first. It
showed only the feature flag changing, because the diff compares the new template against the *last known IaC
state* — which was "paper." It had no idea the real system was live, so it had nothing to warn me about. A clean
plan is not a promise about reality; it's a promise about the template.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>An out-of-band change isn't a permanent change with a risk attached — it's a <strong>temporary</strong> change
  by definition. The clock starts the moment you make it, and the next <em>apply</em> is the alarm. If a setting
  isn't in IaC, the system's real answer to "what should this be?" is whatever the template says, not what you
  typed into a terminal.</p>
</aside>

## The fix: make everything declarative

The fix wasn't "be more careful with deploys." Careful doesn't scale, and it failed here precisely because the
deploy *looked* safe. The fix was to **delete the out-of-band path entirely** and make the broker mode a
first-class, declarative part of the infrastructure:

- The paper/live mode became **CDK context** — a value in the IaC config, version-controlled, that the template
  reads. Flipping modes is now a code change with a real diff, reviewed and committed.
- It's backed by a **durable secret** and an explicit acknowledgment flag, so going live is a deliberate, recorded
  act — not a script someone ran once and forgot.

<figure>
  <img src="/blog/anything-not-in-iac-drifts/the-fix.svg" alt="Before, the mode was set out-of-band by a script and got reverted by the next deploy; after, the mode is CDK context plus a durable secret and acknowledgment, so it survives every deploy declaratively" loading="lazy" />
  <figcaption>The fix — move the setting from an out-of-band script into the template itself, so every deploy preserves it.</figcaption>
</figure>

Now there is exactly one source of truth. A `cdk deploy` can never silently revert the broker mode, because the
broker mode *is* in the thing being deployed. The whole class of "why did production change?" incidents disappears
— not because I'm more careful, but because there's no longer an out-of-band place for reality to hide.

## The law, and where it bites everyone

<figure>
  <img src="/blog/anything-not-in-iac-drifts/the-law.svg" alt="Any out-of-band change via CLI, console, or script is silently reverted by the next IaC apply, so if it is not in IaC it is temporary; a change made in IaC survives the next apply" loading="lazy" />
  <figcaption>The law — out-of-band changes are temporary; only IaC-tracked state survives the next apply.</figcaption>
</figure>

You don't need a trading system to hit this. The same shape shows up everywhere config can be changed in two
places:

- **A hotfix in the cloud console** that the next Terraform/CDK apply quietly wipes — the classic ClickOps trap.
- **A `kubectl edit`** that the next GitOps reconcile reverts, because Argo CD or Flux treats git as the truth and
  your live edit as drift to be corrected.
- **A manually tuned production setting** that vanishes the next time the pipeline redeploys from the repo.

In every case the rule is the same, and it's actually a *good* rule once you stop fighting it: **the repository is
the source of truth, and anything not in it is, by definition, temporary.** Don't make changes the system will
forget. Make them where the system remembers — and let the silent reverts work *for* you, by guaranteeing that
production always matches the code you can read.

## References & further reading

- [Infrastructure as Code](https://en.wikipedia.org/wiki/Infrastructure_as_code) and [idempotence](https://en.wikipedia.org/wiki/Idempotence) — the model that re-asserts state.
- [GitOps](https://en.wikipedia.org/wiki/DevOps#GitOps) — git as the single source of truth, with automatic drift correction.
- [Immutable infrastructure](https://en.wikipedia.org/wiki/Immutable_infrastructure) — never patch in place; rebuild from the declaration.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the architecture this incident hardened.
- Related research-discipline posts: [pre-registration for backtests](/blog/pre-registration-backtests) and [seven strategies, no edge](/blog/no-trading-edge-seven-strategies).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. This incident — and the declarative fix —
are documented as dated decision records. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
