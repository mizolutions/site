---
title: 'AWS CLI and CloudFormation footguns that cost me an hour each'
description: 'The worst AWS errors are not the loud ones — they are the tiny, specific gotchas: empty is not unset, a field that is ASCII-only, a file:// that resolves on the wrong host, and a clean dry-run that still rolls back.'
pubDate: 2026-09-22
lang: 'en'
draft: true
tags: ['devops', 'aws', 'cloudformation', 'cli', 'incident']
---

The AWS errors that really cost you time aren't the dramatic outages. They're the tiny, hyper-specific gotchas
where a tool does *exactly* what you told it to — just not what you meant — and the fix is a single character or a
single word you'd never think to question. Here are four I hit building [Trinitrade](/trinitrade), each of which
ate an hour, and the one idea that ties them together.

## Footgun 1: empty is not unset

I had a script that sometimes ran with a specific AWS profile and sometimes with none, so it set
`AWS_PROFILE` conditionally. When it should have been "none," it set `AWS_PROFILE=""` — and every command died with:

```
The config profile () could not be found
```

The empty string isn't "no profile." It's a profile **named** `""`, which of course doesn't exist. The AWS CLI
dutifully looked for a profile whose name is the empty string and failed. The fix is to make the variable
*absent*, not empty:

```sh
unset AWS_PROFILE      # correct: fall back to the default credential chain
AWS_PROFILE=""         # wrong: looks for a profile literally named ""
```

<figure>
  <img src="/blog/aws-cli-cloudformation-footguns/empty-vs-unset.svg" alt="Setting AWS_PROFILE to an empty string makes the CLI look for a profile named empty string and fail, while unsetting it falls back to the default credential chain" loading="lazy" />
  <figcaption>Empty is not absent — <code>""</code> is a profile name; only <code>unset</code> means "use the default."</figcaption>
</figure>

## Footgun 2: a field that's secretly ASCII-only

I gave a security group a tidy description with an em dash: `"trading app — prod"`. The CDK synth was clean. The
deploy failed at CREATE with a vague `InvalidRequest`. The cause: `AWS::EC2::SecurityGroup`'s `GroupDescription`
is **ASCII-only**, and `—` (U+2014) isn't ASCII. A single typographic character, copied in from somewhere, broke
the deploy — and nothing upstream warned me, because the template was *syntactically* perfect.

<figure>
  <img src="/blog/aws-cli-cloudformation-footguns/ascii-only.svg" alt="A security group description with an em dash passes cdk synth but fails at create with InvalidRequest because the field is ASCII-only; a plain hyphen works" loading="lazy" />
  <figcaption>The synth was clean; the service rejected a non-ASCII character the template validator never checked.</figcaption>
</figure>

The fix was a plain hyphen. The lesson is bigger: **a field's documented type is not its real constraint set.**

## Footgun 3: `file://` resolves on the machine running the command

I ran an SSM `send-command` with parameters from a file, through a tunneled wrapper that executes AWS calls from a
bastion:

```sh
aws ssm send-command --parameters file://params.json ...
```

It couldn't find `params.json` — even though the file was right there on my laptop. The `file://` reference is
resolved by the **process making the API call**, not by the target instance and not by where I typed the command.
Because the wrapper executed the CLI on a *different* host, `file://` looked for the file *there*, not on my
laptop. The fix was to put the file where the call is actually made.

<figure>
  <img src="/blog/aws-cli-cloudformation-footguns/file-resolves-executor.svg" alt="A file colon slash slash reference in an AWS CLI command is read by the host executing the call, not by the target instance or the machine you typed on, so through a wrapper the file must exist on the wrapper host" loading="lazy" />
  <figcaption><code>file://</code> is read where the call is <em>executed</em> — not where you typed it, not on the target.</figcaption>
</figure>

## Footgun 4: a clean dry-run that still rolls back

The most expensive class: the template that **synthesizes and diffs cleanly, then fails on deploy** — because the
real constraint is a *service-side* limit the template validator doesn't know about. A CloudWatch metric alarm,
for instance, has rules the linter can't see (certain expression types aren't allowed on metric alarms; long
evaluation windows have hard caps). `cdk synth` and `cdk diff` are happy; CloudFormation accepts the template;
then the service rejects it and you watch an `UPDATE_ROLLBACK` undo your change.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>A clean <code>cdk diff</code> or <code>terraform plan</code> validates your template against the tool's model
  of the world — not against the service's real, runtime constraints. <strong>A clean plan is a promise about
  syntax, not about a successful deploy.</strong></p>
</aside>

## The thread: tools validate syntax, services enforce reality

Squint at all four and they're the same bug wearing different costumes:

<figure>
  <img src="/blog/aws-cli-cloudformation-footguns/the-thread.svg" alt="Tools and dry-runs validate syntax while services enforce reality at runtime; the footgun lives in the gap between syntactically valid and actually allowed" loading="lazy" />
  <figcaption>The common shape — the footgun always lives in the gap between "syntactically valid" and "actually allowed."</figcaption>
</figure>

- `AWS_PROFILE=""` — **empty isn't absent.** The CLI honored a value you meant to omit.
- The em dash — **a documented type isn't the real constraint.** ASCII-only lived below the type.
- `file://` — **resolution happens where you didn't look.** "Local" depends on *whose* local.
- The clean-diff rollback — **the validator and the service have different models.** Passing one doesn't pass the
  other.

The unifying lesson is to distrust the layer that only checks *form*. Read the actual error string — AWS's are
usually precise, even when they're terse (`The config profile () could not be found` is, in hindsight, telling you
*exactly* what's wrong). And never let a green dry-run convince you a deploy will succeed: validate against the
service when the constraint lives in the service. The footgun is almost always the gap between "syntactically
valid" and "actually allowed."

## References & further reading

- [AWS CLI configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) and the [credential provider chain](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html) — where `AWS_PROFILE` fits in.
- [ASCII](https://en.wikipedia.org/wiki/ASCII) vs [Unicode](https://en.wikipedia.org/wiki/Unicode) — the em dash that broke a deploy.
- [Null vs. empty](https://en.wikipedia.org/wiki/Null_(SQL)) and the perennial confusion between absent and blank.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the IaC and tooling these came from.
- Related: [anything not in IaC will drift](/blog/anything-not-in-iac-drifts) and [CodeBuild runs in dash, not bash](/blog/codebuild-runs-in-dash-not-bash).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. Every footgun here is one I actually hit.
The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
