---
title: "The SQLAlchemy enum bug that wasn't"
description: 'I was sure I had found a Postgres enum case-mismatch bug: raw SQL returned uppercase names, my ORM filters used lowercase values. I almost shipped a fix. The bug was an artifact of how I was investigating it — a lesson in debugging at the wrong layer.'
pubDate: 2027-01-05
lang: 'en'
draft: true
tags: ['data', 'sqlalchemy', 'postgres', 'debugging', 'orm']
---

This is a story about a bug I was certain I'd found, built a reproduction for, and was one commit away from "fixing"
— before realizing it didn't exist. The bug was entirely an artifact of *how I was looking at it*. On
[Trinitrade](/trinitrade), it cost me an hour and taught me a debugging rule I now apply everywhere: reproduce at the
same layer your actual code runs, or you're investigating a different system than the one with the alleged bug.

## The apparent smoking gun

The setup: an enum column storing order status, defined so that the enum's *values* are lowercase (`"filled"`) while
its *member names* are uppercase (`FILLED`). My application code filtered with lowercase values — `status ==
"filled"`. To verify what was actually in the database, I dropped to a raw SQL query, and it came back uppercase:
`FILLED`. Lowercase in my code, uppercase in the database. That looked exactly like a case-mismatch bug waiting to
silently drop rows.

<figure>
  <img src="/blog/sqlalchemy-enum-bug-that-wasnt/apparent-bug.svg" alt="Application code filters an enum column with a lowercase value while a raw SQL probe returns the stored value in uppercase, appearing to be a case-mismatch bug" loading="lazy" />
  <figcaption>The apparent smoking gun — lowercase in the code, uppercase from a raw SQL probe, looking like a mismatch.</figcaption>
</figure>

I had a hypothesis, a reproduction, and a fix forming in my head. Everything pointed to a real bug — except it wasn't
one.

## What the ORM enum mapping actually does

Here's the part I'd misunderstood. When you map an enum column through the ORM, the mapping is smarter than a plain
string comparison. It **coerces transparently**: you can filter with the lowercase value, the uppercase name, or the
enum member itself, and all three resolve to the same rows. The ORM knows the column is an enum and translates
whatever you give it into the right underlying representation before the query runs. The lowercase-vs-uppercase
distinction I was worried about simply doesn't survive contact with the ORM layer — it handles the translation for
you.

<figure>
  <img src="/blog/sqlalchemy-enum-bug-that-wasnt/orm-coercion.svg" alt="The ORM enum mapping accepts the lowercase value, the uppercase member name, or the enum member, and coerces all three to the same query, returning identical rows" loading="lazy" />
  <figcaption>What the ORM actually does — value, name, or member all coerce to the same query and return identical rows.</figcaption>
</figure>

## The real bug: I was probing at the wrong layer

So why did the raw SQL show uppercase? Because raw SQL *bypasses the ORM entirely.* A `text()` query, or a direct
driver call, talks to the database without the enum mapping in the path — so it returns the stored representation as
the database holds it, which happens to be the uppercase member name. My raw-SQL "verification" was answering a
*different question* than my application code asks. The code goes through the ORM and gets coercion; my probe went
around the ORM and got the raw storage. Comparing the two and concluding "mismatch" was comparing apples to a
translation of apples.

<figure>
  <img src="/blog/sqlalchemy-enum-bug-that-wasnt/wrong-layer.svg" alt="Application queries pass through the ORM and get enum coercion, while a raw SQL probe bypasses the ORM and sees raw storage, so the two answer different questions" loading="lazy" />
  <figcaption>The real issue — the app goes through the ORM and gets coercion; the raw probe bypasses it, so the two see different things.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>Before filing a bug, reproduce it <strong>at the same layer your code actually runs.</strong> A raw-SQL probe
  and an ORM query are two different systems; a discrepancy between them is often the abstraction doing its job, not
  a defect. I almost shipped a "fix" for a bug that was really my investigation method. <em>Debug the path your code
  takes, not a shortcut around it.</em></p>
</aside>

## The cheap test that ended it

What dissolved the whole thing was one experiment: run the *same* filter through the ORM with the lowercase value,
the uppercase name, and the enum member, and count the rows each returns. They were identical. There was no row loss,
no silent mismatch — the coercion worked exactly as designed. The "bug" existed only in the gap between my raw-SQL
probe and my application's actual query path. Five minutes of probing at the right layer saved a wasted pull request
fixing nothing.

<figure>
  <img src="/blog/sqlalchemy-enum-bug-that-wasnt/cheap-test.svg" alt="Running the same filter through the ORM with value, name, and member returns identical row counts, proving the coercion works and there is no bug" loading="lazy" />
  <figcaption>The cheap test — identical row counts across value, name, and member through the ORM proved there was no bug.</figcaption>
</figure>

## The lesson: match your reproduction to your runtime

The broad lesson outlives the specifics of any one ORM. When you suspect a bug, the reproduction you build has to
exercise the *same stack* your real code uses. Drop a layer — query the database directly when your app uses an ORM,
hit the service directly when your app goes through a gateway, call the function when your app goes through a queue —
and you may "discover" a discrepancy that's just the layer you skipped doing exactly what it's supposed to do. Some
of the most convincing bugs are the ones your debugging method invented. Reproduce on the real path first; then,
if it still reproduces, you have something worth fixing.

## References & further reading

- [SQLAlchemy Enum type](https://docs.sqlalchemy.org/en/20/core/type_basics.html#sqlalchemy.types.Enum) — how the mapping coerces.
- [PostgreSQL enumerated types](https://www.postgresql.org/docs/current/datatype-enum.html) — what's stored underneath.
- [Leaky abstraction](https://en.wikipedia.org/wiki/Leaky_abstraction) — and why probing below one misleads.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the data layer where this almost-bug lived.
- Related: [async SQLAlchemy with asyncpg](/blog/async-sqlalchemy-asyncpg-pitfalls) and [why TimescaleDB hypertables for market data](/blog/timescaledb-hypertables-market-data).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. This almost-PR really happened; the enum
coercion behaved exactly as designed. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
