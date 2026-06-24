---
title: 'Keyless CI: kill your static AWS keys with GitHub OIDC'
description: 'The best cloud credential is the one that does not exist. How I deploy to AWS from CI with zero long-lived keys — using short-lived OIDC tokens — and the one trust-policy line that makes or breaks it.'
pubDate: 2026-09-08
lang: 'en'
draft: true
tags: ['devops', 'security', 'aws', 'ci-cd', 'oidc']
---

A huge share of cloud breaches start the same boring way: a long-lived access key leaks — in a log, a fork, a
committed `.env`, a screenshot — and someone uses it. The most reliable defense isn't rotating keys faster or
guarding them better. It's **not having them at all.**

[Trinitrade](/trinitrade) deploys to AWS from CI with **zero static AWS credentials** anywhere — no access key in
a GitHub secret, no key on a runner, nothing to leak or rotate. It uses short-lived OIDC tokens instead. Here's
how it works and the one line that makes it safe.

## The problem with static keys in CI

The old pattern is to mint an IAM user, generate an access key + secret, and paste them into your CI secrets so
the pipeline can call AWS. It works, and it's a liability the whole time:

- It's **long-lived** — valid until someone remembers to rotate it (nobody remembers).
- It's **copy-pasteable** — a single string that works from anywhere on Earth, no context required.
- It **leaks in boring ways** — printed in a debug log, inherited by a fork, committed by accident, lingering in
  history forever.

<figure>
  <img src="/blog/keyless-ci-with-oidc/before-after.svg" alt="Before, a long-lived AWS access key is stored as a CI secret and can leak; after, there is no stored key and CI uses a short-lived OIDC token exchanged for temporary credentials" loading="lazy" />
  <figcaption>Before and after — from a permanent secret you must guard to a short-lived token there's nothing to store.</figcaption>
</figure>

## The fix: OIDC federation

Instead of *holding* a credential, CI **proves who it is** and gets a temporary one. GitHub Actions can issue a
signed [OpenID Connect](https://en.wikipedia.org/wiki/OpenID_Connect) token describing the running job — which
repo, which branch, which workflow. AWS is taught to **trust GitHub's identity provider**, so it accepts that
token and hands back temporary credentials scoped to a specific IAM role, valid for the length of the job.

<figure>
  <img src="/blog/keyless-ci-with-oidc/handshake.svg" alt="GitHub Actions requests an OIDC token describing the job, calls AWS STS AssumeRoleWithWebIdentity, AWS validates the token against the trusted GitHub provider and the role trust policy, and returns short-lived temporary credentials" loading="lazy" />
  <figcaption>The handshake — GitHub mints a job-scoped token, AWS validates it and returns temporary, auto-expiring credentials.</figcaption>
</figure>

Two pieces make it work:

1. An **IAM OIDC identity provider** registered for GitHub's token issuer (`token.actions.githubusercontent.com`),
   so AWS will validate tokens it signs.
2. An **IAM role** whose trust policy says "GitHub may assume me — *but only* from this repo and branch."

The workflow then calls `AssumeRoleWithWebIdentity` (the official `aws-actions/configure-aws-credentials` action
does this for you), and the rest of the pipeline runs with temporary credentials. No secret was ever stored.

## The one line that makes or breaks it

The security of the whole scheme lives in the role's **trust policy condition** — the `sub` claim that pins
*which* GitHub identity is allowed to assume the role:

```json
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:mizolutions/trinitrade:ref:refs/heads/main"
  }
}
```

That `sub` says: only the `main` branch of *this exact repo* may assume this role. Get it wrong — a wildcard, a
missing repo qualifier — and you've built a door that **any GitHub repository on the internet** can walk through.
A common, dangerous mistake is matching on `repo:*` or forgetting the branch: scope it as tightly as the job
actually needs.

<figure>
  <img src="/blog/keyless-ci-with-oidc/trust-condition.svg" alt="A tightly scoped sub claim restricting to one repo and branch is safe, while a wildcard or missing qualifier lets any GitHub repo assume the role" loading="lazy" />
  <figcaption>The trust condition — pin the exact repo and branch. A wildcard here is a door for the whole internet.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>OIDC doesn't just shorten the credential's life — it <strong>moves the secret out of existence</strong>. There
  is no key to leak, rotate, or find in a log. The thing you protect is no longer a string in a vault; it's a
  <em>trust relationship</em> you can read, scope, and audit.</p>
</aside>

## Why this is strictly better

Once the keys are gone, a whole category of work and worry goes with them:

- **Nothing to leak.** The token is signed, audience-bound, and expires in minutes; it's useless outside the job
  that minted it.
- **Nothing to rotate.** There's no long-lived secret, so there's no rotation schedule to forget.
- **Tightly scoped by construction.** The role grants exactly the permissions the pipeline needs, to exactly one
  repo and branch — [least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) you can see.
- **Auditable.** Every assumption is a CloudTrail event tied to a specific workflow run.

<figure>
  <img src="/blog/keyless-ci-with-oidc/properties.svg" alt="Keyless CI with OIDC gives four properties: nothing to leak because tokens expire in minutes, nothing to rotate, scoped to one repo and branch for least privilege, and auditable in CloudTrail" loading="lazy" />
  <figcaption>What you get for free once the keys are gone — nothing to leak, nothing to rotate, scoped, and auditable.</figcaption>
</figure>

## The general principle: stop storing shared secrets

OIDC for CI is one instance of a broader shift: **replace shared, long-lived secrets with short-lived, identity-based
credentials.** The same idea shows up as workload identity between services, instance/pod roles instead of baked-in
keys, and SSO with short sessions instead of static passwords. Every long-lived secret is a liability you're
choosing to carry; the modern default is to carry as few as possible — ideally zero.

The mental shift is from *"how do I store this key safely?"* to *"why does this key exist at all?"* Most of the
time, with federation, the honest answer is: it doesn't have to.

## References & further reading

- [OpenID Connect](https://en.wikipedia.org/wiki/OpenID_Connect) and [federated identity](https://en.wikipedia.org/wiki/Federated_identity).
- [Configuring OpenID Connect in AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) (GitHub Actions docs).
- [`AssumeRoleWithWebIdentity`](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html) (AWS STS) and the [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege).

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the CI/CD pipeline that uses this.
- Related: [CodeBuild runs in dash, not bash](/blog/codebuild-runs-in-dash-not-bash) and [anything not in IaC will drift](/blog/anything-not-in-iac-drifts).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. It deploys to AWS with no static
credentials. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
