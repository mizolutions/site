---
title: "Why TimescaleDB hypertables for market data"
description: 'Market data is time-series, but it also has to JOIN cleanly to orders, positions, and strategies. The choice between plain Postgres, a NoSQL store, and TimescaleDB comes down to one question: do you want one database or two?'
pubDate: 2026-12-08
lang: 'en'
draft: true
tags: ['data', 'database', 'timescaledb', 'postgres', 'architecture']
---

Storing market data looks like a solved problem until you actually have to query it next to everything else. The
bars themselves are pure time-series — append-heavy, time-ordered, always queried by a time range for a symbol — but
the moment you want to ask "what was the price when this order filled?" you need that time-series data to JOIN
cleanly against your relational tables. On [Trinitrade](/trinitrade), that single requirement decided the whole
storage architecture, and the answer was TimescaleDB.

## The shape of the data

Market data has a very specific shape. Each row is an OHLCV bar — open, high, low, close, volume — stamped with a
time and a symbol. You write a lot of them, continuously, in time order. And you almost never read a single row; you
read *ranges* — "every bar for this symbol over this window" — often downsampled to a coarser interval for a chart
or a backtest.

<figure>
  <img src="/blog/timescaledb-hypertables-market-data/data-shape.svg" alt="Market data as a stream of OHLCV bars stamped by time and symbol, written append-heavy in time order and read as time ranges per symbol, often downsampled" loading="lazy" />
  <figcaption>The shape of market data — append-heavy OHLCV bars, read as time ranges per symbol, often downsampled.</figcaption>
</figure>

That shape screams "time-series database." But there's a catch the shape alone doesn't capture: this data doesn't
live in isolation. It has to relate to orders, positions, signals, and strategies — all of which are ordinary
relational data.

## Three options, one deciding question

I weighed three storage choices, and they line up along a single axis: how well they handle time-series *and* how
well they relate to the rest of the system.

- **Plain PostgreSQL** relates perfectly to everything — it *is* the relational store — but a single ever-growing
  bars table degrades over time; you'd be hand-rolling partitioning to keep inserts and range scans fast.
- **A NoSQL store** scales time-series writes beautifully, but you lose SQL JOINs and full transactional
  consistency. Answering "the price when this order filled" means joining two stores in application code, and
  time-range scans become awkward.
- **TimescaleDB** is a PostgreSQL *extension*: relational tables behave exactly like Postgres, while time-series
  tables get automatic partitioning and downsampling. One engine, both workloads.

<figure>
  <img src="/blog/timescaledb-hypertables-market-data/three-options.svg" alt="Plain Postgres relates well but degrades on large time-series; NoSQL scales time-series but loses JOINs and ACID; TimescaleDB does both as a Postgres extension" loading="lazy" />
  <figcaption>Three options on one axis — the deciding question is whether you want one database or two systems to operate.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>The decision wasn't "which database is fastest at time-series." It was <strong>"do I want one database or
  two?"</strong> TimescaleDB lets a solo-operated system keep time-series bars and relational orders in the same
  engine, with native JOINs and full ACID — no second store to run, back up, and reconcile. <em>Operational
  simplicity won over raw specialization.</em></p>
</aside>

## What a hypertable actually buys you

The core feature is the **hypertable**. To your queries it looks like one ordinary table, but underneath,
TimescaleDB automatically partitions it into time-based **chunks**. New data lands in the current chunk; queries for
a time range only touch the chunks that overlap it. You get the performance of partitioning without hand-writing and
maintaining the partition scheme yourself — the thing that makes plain Postgres painful at scale just happens for
you.

<figure>
  <img src="/blog/timescaledb-hypertables-market-data/hypertable-chunks.svg" alt="A hypertable looks like one table but is automatically split into time-based chunks; a range query only scans the chunks overlapping the requested window" loading="lazy" />
  <figcaption>A hypertable — one logical table, automatically split into time chunks, so a range query scans only the relevant ones.</figcaption>
</figure>

## Continuous aggregates: downsampling for free

The second feature that earns its place is **continuous aggregates**. Most reads of market data aren't of raw
ticks — they're of 5-minute, hourly, or daily bars for a chart or a backtest. A continuous aggregate pre-computes
those rollups and keeps them refreshed automatically as new raw data arrives. Instead of re-aggregating millions of
rows on every chart load, you read a small, already-summarized table.

<figure>
  <img src="/blog/timescaledb-hypertables-market-data/continuous-aggregates.svg" alt="Raw market-data bars feed continuous aggregates that auto-compute 5-minute, hourly, and daily rollups, so downsampled reads hit a small pre-summarized table" loading="lazy" />
  <figcaption>Continuous aggregates — raw bars auto-roll into 5m / 1h / 1d summaries, so downsampled reads are cheap.</figcaption>
</figure>

And because it's all still PostgreSQL, you query every one of these with standard SQL. There's no second query
language to learn, no Flux or custom dialect — the same JOINs, the same window functions, the same tools.

## The lesson: pick storage for the whole workload, not one table

It's tempting to choose a database for the hardest single table — here, the high-volume bars — and then bolt the
rest of the system around it. That optimizes one query at the cost of every cross-cutting query and a second system
to operate. The better question is what serves the *whole* workload: I had time-series data that absolutely had to
relate to relational data, operated by one person who didn't want to run two stores. TimescaleDB answered that
exactly — Postgres where I needed relational, hypertables where I needed time-series, one engine to back up and
reason about.

## References & further reading

- [TimescaleDB hypertables](https://docs.timescale.com/use-timescale/latest/hypertables/) and [continuous aggregates](https://docs.timescale.com/use-timescale/latest/continuous-aggregates/).
- [PostgreSQL table partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html) — what you'd hand-roll without it.
- [Time series database](https://en.wikipedia.org/wiki/Time_series_database) — the general category and its trade-offs.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the database architecture and the ADR behind this choice.
- Related: [bad data silently produces confident-but-wrong results](/blog/bad-data-confident-wrong) and [async SQLAlchemy with asyncpg](/blog/async-sqlalchemy-asyncpg-pitfalls).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The TimescaleDB architecture described here
is real. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
