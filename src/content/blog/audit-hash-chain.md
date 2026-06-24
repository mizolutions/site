---
title: "Tamper-evident audit logs with a hash-chain (append-only still needs a lock)"
description: 'A hash-chain makes an audit log tamper-evident: change one past row and every row after it breaks. But the chaining quietly turns each "append" into a read-modify-write — so an append-only table can still corrupt itself under concurrency without a lock.'
pubDate: 2026-12-22
lang: 'en'
draft: true
tags: ['data', 'audit', 'security', 'concurrency', 'integrity']
---

A trading system has to keep a complete, durable record of every action it takes — for post-trade analysis and for
compliance regimes that demand years of retention. But a log you can quietly edit isn't worth much for compliance.
On [Trinitrade](/trinitrade) I made the audit trail **tamper-evident** with a hash-chain, and in the process learned
a counterintuitive lesson: an append-only table is *not* automatically safe under concurrency. The very mechanism
that makes it tamper-evident is what makes it need a lock.

## Tamper-evident with a hash-chain

The idea is borrowed from how a blockchain links blocks. Every row in the audit log carries a hash computed over its
own contents *plus the hash of the row before it*. The first row chains from a fixed genesis value. Each row's hash
therefore depends on the entire history that precedes it.

<figure>
  <img src="/blog/audit-hash-chain/hash-chain.svg" alt="Each audit row carries a hash computed from its contents plus the previous row's hash, chaining back to a fixed genesis value, so every row depends on all prior history" loading="lazy" />
  <figcaption>The hash-chain — each row's hash folds in the previous row's hash, back to a genesis value.</figcaption>
</figure>

This is the difference between *tamper-proof* and *tamper-evident*, and it matters. You can't physically stop someone
with database access from altering a row — but with a hash-chain, you can guarantee that any alteration is
**detectable**. Change one past row's data and its hash no longer matches; every row after it was computed from the
old hash, so the entire tail of the chain diverges. A nightly verifier walks the chain, recomputes each hash, and
raises an alarm on the first mismatch.

<figure>
  <img src="/blog/audit-hash-chain/tamper-evidence.svg" alt="Editing one past row changes its hash, which breaks every subsequent row's hash, so a verifier walking the chain detects divergence at the tampered row and everything after it" loading="lazy" />
  <figcaption>Tamper-evidence — edit one past row and the whole tail diverges, so a verifier catches it.</figcaption>
</figure>

## The subtle bug: appending is a read-modify-write

Here's where intuition betrays you. "Append-only" sounds inherently safe — you only ever add rows, never modify
them, so what could race? But look at what an append to a hash-chain actually requires: you have to **read** the
previous row's hash, **compute** the new row's hash from it, and **insert**. That's a read-modify-write, and
read-modify-write is the canonical shape of a concurrency bug.

If two events try to append at the same time, both read the same "previous hash," both compute their new hash from
it, and both insert. Now two rows claim the same predecessor — the chain has forked. The verifier will flag it as
divergence, even though no one tampered with anything; the log corrupted *itself* purely from concurrent writes.

<figure>
  <img src="/blog/audit-hash-chain/concurrency-fork.svg" alt="Two concurrent appends both read the same previous hash, both compute their new hash from it, and both insert, producing two rows that claim the same predecessor and forking the chain" loading="lazy" />
  <figcaption>The concurrency bug — two appends read the same previous hash and fork the chain, with no tampering involved.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>"Append-only" does not mean "concurrency-safe." The moment each new row's content <strong>depends on the
  previous row</strong>, appending becomes a read-modify-write, and two writers can fork the chain. The hash-chain
  that makes the log tamper-<em>evident</em> is exactly what makes a plain concurrent append unsafe. <em>Linked
  history needs serialized writes.</em></p>
</aside>

## The fix: serialize the critical section

The fix is to make the read-of-previous-hash and the insert a single serialized critical section, so only one append
is ever in flight at a time. A lock around that section guarantees each appender sees the *committed* previous hash,
not a stale one that another in-flight append is about to supersede. The appends queue up and the chain stays
linear.

<figure>
  <img src="/blog/audit-hash-chain/lock-fix.svg" alt="A lock around the read-previous-hash and insert critical section serializes appends so each one sees the committed previous hash and the chain stays linear" loading="lazy" />
  <figcaption>The fix — a lock makes read-previous-hash-then-insert a serialized critical section, keeping the chain linear.</figcaption>
</figure>

This is the same family of fix as serializing any other order-sensitive critical section: identify the
read-modify-write, wrap it so only one runs at a time. The cost is throughput on that one path, which for an audit
log is a non-issue — correctness of the chain matters far more than how many events per second you can append.

## The lesson: "immutable" and "append-only" are not free passes

It's easy to assume that a write pattern which never updates or deletes is automatically safe from the usual
concurrency hazards. It isn't, the instant later writes depend on earlier ones. Hash-chains, running totals,
monotonic sequence numbers, "insert the next version" patterns — all of them turn an innocent-looking append into a
read-modify-write that needs the same care as an update. When you build something whose correctness depends on order
or on prior state, ask the concurrency question explicitly, even if the table is append-only. The structure that
gives you a nice property — here, tamper-evidence — is often the same structure that introduces a race.

## References & further reading

- [Hash chain](https://en.wikipedia.org/wiki/Hash_chain) and [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) — the tamper-evidence primitives.
- [Read-modify-write](https://en.wikipedia.org/wiki/Read%E2%80%93modify%E2%80%93write) and [race conditions](https://en.wikipedia.org/wiki/Race_condition) — why the append isn't safe.
- [SHA-2](https://en.wikipedia.org/wiki/SHA-2) — the hash function doing the chaining.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the audit service and its chain verifier.
- Related: [idempotent order submission without a distributed lock](/blog/idempotent-order-submission) and [CloudWatch alarm pitfalls](/blog/cloudwatch-alarm-pitfalls).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The hash-chain audit trail and the
concurrency fix described here are real. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
