---
title: "Idempotent order submission without a distributed lock"
description: 'Submitting the same order twice means a double position and real money lost. The textbook answer is a distributed lock across replicas. The simpler answer, for a single-user system, is to run one replica on purpose — and let an in-process lock do the job.'
pubDate: 2026-12-29
lang: 'en'
draft: true
tags: ['data', 'concurrency', 'architecture', 'reliability', 'design']
---

There's one operation in a trading system you absolutely cannot get wrong: submitting an order. If the same signal
somehow produces two orders, you've opened a double position and lost real money to a software bug. Making order
submission **idempotent** — the same intent producing exactly one order, no matter how many times it's triggered —
is non-negotiable. On [Trinitrade](/trinitrade), I solved it not with the textbook distributed lock, but by
choosing, deliberately, to run a single replica.

## The hazard: one signal, two orders

The danger is concrete. A strategy emits a signal; something causes the submit path to run twice — a retry, a
duplicate event, two concurrent code paths. Without protection, you get two orders for one decision: double the
intended size, double the risk, an immediate and real financial loss. This isn't a cosmetic bug; it's the kind that
shows up on a brokerage statement.

<figure>
  <img src="/blog/idempotent-order-submission/the-hazard.svg" alt="One trading signal triggers the submit path twice, producing two orders, a double position, and a real financial loss" loading="lazy" />
  <figcaption>The hazard — one signal, two submits, a double position, and real money lost.</figcaption>
</figure>

## The textbook answer, and its cost

The standard high-availability instinct is to run several replicas of the application behind a load balancer, so if
one dies the others carry on. But the moment you have multiple replicas, two of them can try to submit the same
order at the same time, and an in-process lock can't help — each process has its own. Now you need a **distributed
lock** (typically backed by something like Redis) to serialize submission across all replicas. That's a real,
working pattern — but it adds an external dependency, a new failure surface, and a pile of edge cases around what
happens when the lock store itself is unreachable.

<figure>
  <img src="/blog/idempotent-order-submission/distributed-lock.svg" alt="Multiple replicas behind a load balancer require a distributed lock backed by an external store to serialize order submission, adding a dependency and a new failure surface" loading="lazy" />
  <figcaption>The textbook answer — N replicas need a distributed lock and an external store, with all the failure modes that brings.</figcaption>
</figure>

## The deliberate choice: one replica

Here's the design decision that made everything simpler: **run a single replica on purpose.** With exactly one
process handling submissions, you don't need a distributed lock at all — an in-process lock serializes everything,
because there's only one process to serialize. The whole class of "two replicas race on the same order" problem
disappears by construction.

This is a genuine trade-off, made consciously. You give up the availability you'd get from N replicas. But for a
single-user system that's already scaled to zero on nights and weekends, that availability was never worth much —
and the correctness story you gain in exchange is dramatically simpler. The right architecture isn't the one with
the most nines; it's the one whose failure modes you can actually reason about.

<figure>
  <img src="/blog/idempotent-order-submission/single-replica.svg" alt="Running a single replica means an in-process lock is sufficient to serialize order submission, eliminating the need for a distributed lock and its external dependency" loading="lazy" />
  <figcaption>The deliberate choice — one replica makes an in-process lock sufficient, and the whole distributed-lock problem vanishes.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>You don't always need a distributed lock — sometimes you need to <strong>not have a distributed system</strong>.
  Choosing a single replica on purpose is a legitimate architectural decision that trades availability you don't need
  for correctness you can't compromise on. <em>The simplest concurrency bug to fix is the one you designed out of
  existence.</em></p>
</aside>

## Belt and suspenders: the lock, the key, and a safe fallback

Within the single process, the critical section is "check whether this order was already submitted, then submit" —
the same read-modify-write shape that needs serializing. An in-process lock wraps it so only one submission runs at a
time. Two more things make it robust:

- An **idempotency key** sent to the broker (a unique client-side order id) means that even if a request is retried
  at the network level, the broker itself recognizes the duplicate and won't open a second position.
- A **fail-safe fallback**: the code is written so that if you *ever* do introduce a distributed lock for a future
  multi-replica world, and that lock store is unreachable, it falls back to the in-process lock rather than blocking
  all trading. Degrading to "still correct on one replica" beats "refuse every order because the lock store
  blinked."

<figure>
  <img src="/blog/idempotent-order-submission/belt-and-suspenders.svg" alt="An in-process lock serializes the check-then-submit section, an idempotency key makes the broker reject duplicates, and a fallback keeps trading correct on one replica if a distributed lock store is unreachable" loading="lazy" />
  <figcaption>Belt and suspenders — in-process lock, broker idempotency key, and a fallback that stays correct on one replica.</figcaption>
</figure>

## The lesson: scale is a choice, not a default

The reflex to reach for replicas and distributed coordination is so ingrained that running one process can feel like
cutting a corner. It isn't — it's recognizing that distributed systems are expensive in complexity, and that
complexity is only worth paying for when you actually need what it buys. For a solo-operated system where a brief
restart gap is acceptable and the workload is one user's, a single replica with an in-process lock is not a
limitation; it's the design that lets you be *certain* you'll never submit an order twice. Match the architecture to
the real requirement, and sometimes the most robust answer is also the smallest one.

## References & further reading

- [Idempotence](https://en.wikipedia.org/wiki/Idempotence) and [idempotency keys](https://stripe.com/docs/api/idempotent_requests) for safe retries.
- [Distributed locks](https://redis.io/docs/latest/develop/use/patterns/distributed-locks/) — what you avoid by not distributing.
- [Single point of failure](https://en.wikipedia.org/wiki/Single_point_of_failure) — the trade-off you accept, made explicit.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the order-submission path and its locking design.
- Related: [tamper-evident audit logs with a hash-chain](/blog/audit-hash-chain) and [never deploy a stateful service off-hours](/blog/never-deploy-stateful-off-hours).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The single-replica design and the
in-process submission lock described here are real. The sanitized source lives in the [case study](/trinitrade) and
the [public repository](https://github.com/mizolutions/trinitrade).*
