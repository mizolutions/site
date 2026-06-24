---
title: "Async SQLAlchemy with asyncpg: patterns and pitfalls"
description: 'Async SQLAlchemy runs beautifully in production, where one event loop lives forever. The sharp edges only appear in tests, where FastAPI and pytest spin up loops constantly — and a cache bound to a dead loop hangs forever with no useful trace.'
pubDate: 2027-01-12
lang: 'en'
draft: true
tags: ['data', 'sqlalchemy', 'asyncio', 'fastapi', 'testing']
---

Async SQLAlchemy on top of asyncpg is a joy in production. There's one long-lived event loop, the connection pool
warms up once, and everything hums. Then you write tests, and the same code that's been flawless in production starts
hanging forever in CI with no stack trace. On [Trinitrade](/trinitrade), almost every async-database bug I hit had
the same root: **production runs one event loop, but the test harness runs many** — and async objects quietly bound
to a loop don't survive that.

## Two different concurrency worlds

The key mental model is that production and tests are not the same concurrency environment. In production, a single
event loop is created at startup and runs until shutdown; any async object you cache — an engine, a session factory,
a lock — lives happily on that one loop forever. Under tests, the async test runner often creates a *fresh* loop per
test, and a web framework's test client can spin up ephemeral loops per request. The same cached object is now
reached from loops it was never created on.

<figure>
  <img src="/blog/async-sqlalchemy-asyncpg-pitfalls/two-worlds.svg" alt="Production runs one long-lived event loop so cached async objects are always reused safely, while tests create many ephemeral loops per test and per request" loading="lazy" />
  <figcaption>Two worlds — production's single long-lived loop versus the test harness's many ephemeral loops.</figcaption>
</figure>

This difference is invisible right up until an async primitive is bound to a specific loop. Then it bites.

## The signature bug: a cache bound to a dead loop

Here's the one that cost me the most. A module-level cache of async objects — keyed by some string, created lazily —
works perfectly in production because there's only ever one loop. In tests, the first test creates an object on its
loop and caches it; that loop is then torn down at the end of the test. The next test reaches into the same cache,
gets back an object bound to the now-**dead** loop, and awaits on it. The await never completes, because the future
it's waiting on belongs to a loop that no longer runs. The test just hangs until a timeout kills it, with no useful
traceback pointing at the cause.

<figure>
  <img src="/blog/async-sqlalchemy-asyncpg-pitfalls/dead-loop.svg" alt="A module-level cache returns an async object created on a previous test's event loop that has been torn down, so awaiting on it hangs forever waiting on a future bound to a dead loop" loading="lazy" />
  <figcaption>The signature bug — a cached async object bound to a torn-down loop; awaiting it hangs forever with no trace.</figcaption>
</figure>

The tell-tale symptom is unmistakable once you've seen it: **"passes locally with a single test, hangs in CI in
random order on the second time the same cache key is hit."** That pattern — green alone, deadlocked when something
runs before it — almost always means a module-level object bound to an event loop.

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>Any async primitive cached at module level — an engine, a session factory, a lock — is silently <strong>bound to
  the event loop it was created on.</strong> Production has one loop forever, so the bug never shows; the test
  harness has many loops, so it deadlocks. <em>"Works with one test, hangs in random-order CI" is the fingerprint of
  a loop-bound cache.</em></p>
</aside>

## The fix: key by loop, or create within the loop

The fix is to stop sharing an async object across loops. Either re-key the cache by the identity of the *current*
running loop, so each loop gets its own object, or create the object inside the running loop rather than at import
time. Both make the cache correct in the many-loops world of tests while changing nothing about production, where
there's only one loop and therefore one entry. The principle is: an async object's lifetime must not outlive the
loop it belongs to.

<figure>
  <img src="/blog/async-sqlalchemy-asyncpg-pitfalls/fix-key-by-loop.svg" alt="Re-keying the cache by the current running loop's identity gives each loop its own async object, so production with one loop is unchanged and tests with many loops each get a valid object" loading="lazy" />
  <figcaption>The fix — key the cache by the running loop, so each loop gets its own valid object and production is unchanged.</figcaption>
</figure>

## The other classic: awaiting across the greenlet boundary

The second pitfall is different in shape. Async SQLAlchemy bridges sync and async with a greenlet under the hood, and
that bridge has an edge: if you access a lazily-loaded relationship *after* the session's async context has ended,
there's no greenlet to drive the implicit query, and you get a `MissingGreenlet`-style error instead of data. The
fix is to load what you need *while* the session is open — eager-load the relationships you'll touch, or materialize
the data before the context closes — rather than relying on lazy loading that needs an await you no longer have.

<figure>
  <img src="/blog/async-sqlalchemy-asyncpg-pitfalls/greenlet-boundary.svg" alt="Accessing a lazy relationship after the async session context has closed has no greenlet to run the query and raises an error, fixed by eager-loading inside the session" loading="lazy" />
  <figcaption>The greenlet boundary — lazy loading after the session closes fails; eager-load inside the session instead.</figcaption>
</figure>

A cousin of these is shared mutable state that leaks across tests — a cached singleton mutated by one test and read
by another — producing the same "passes alone, fails in random order" signature. The cure is the same family:
isolate per-loop or per-test, and never let one test's state bleed into the next.

## The lesson: your test harness is a different runtime

The deeper takeaway is that passing in production doesn't validate your async code's assumptions, because production
is the *easiest* concurrency environment your code will ever run in — one loop, long-lived, no churn. The test
harness, with its constant creation and destruction of loops, is far more hostile, and that's a feature: it surfaces
loop-binding bugs that a real incident would otherwise expose at the worst possible time. When async code "works in
prod but hangs in tests," resist the urge to blame the tests. The tests are usually right, and they're telling you
about an assumption your code makes that production just happens not to violate yet.

## References & further reading

- [SQLAlchemy asyncio support](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html) — including the greenlet bridge and eager-loading guidance.
- [asyncio event loop](https://docs.python.org/3/library/asyncio-eventloop.html) and [pytest-asyncio](https://pytest-asyncio.readthedocs.io/) loop scopes.
- [asyncpg](https://magicstack.github.io/asyncpg/current/) — the driver underneath.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the async data layer and the ADR behind it.
- Related: [the SQLAlchemy enum bug that wasn't](/blog/sqlalchemy-enum-bug-that-wasnt) and [idempotent order submission without a distributed lock](/blog/idempotent-order-submission).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The loop-binding and greenlet-boundary bugs
described here are real and surfaced exactly as described under the test harness. The sanitized source lives in the
[case study](/trinitrade) and the [public repository](https://github.com/mizolutions/trinitrade).*
