---
title: "A traffic-light incident wall in Grafana, for $0"
description: 'One screen that answers "is anything on fire right now?" at a glance — green, orange, red — built with zero new infrastructure, zero plugins, and zero app instrumentation. Just JSON in git.'
pubDate: 2026-10-20
lang: 'en'
draft: true
tags: ['sre', 'observability', 'grafana', 'cloudwatch', 'aws']
---

When you operate a system solo, the single most valuable dashboard is not the one with forty graphs. It's the one
that answers a single question in under two seconds: **is anything on fire right now?** On [Trinitrade](/trinitrade)
I built exactly that — a traffic-light incident wall where every critical signal is a green, orange, or red tile —
and it cost nothing beyond JSON committed to a repo.

## The goal: single-pane triage

The first thing you do when something feels off is triage: *where* is the problem? Without a triage view you
bounce between ten silo dashboards reading graphs, which is slow and exactly what you don't want during an
incident. The incident wall collapses that into one screen with three layers:

<figure>
  <img src="/blog/incident-wall-grafana-zero-cost/three-layers.svg" alt="An incident overview dashboard with three stacked layers: a stat traffic-light wall, a canvas topology map, and a state-timeline of breach bands" loading="lazy" />
  <figcaption>Three layers — a traffic-light wall for "what," a topology map for "where," and a breach timeline for "since when."</figcaption>
</figure>

1. A **stat traffic-light wall** — one tile per critical signal, colored by its alarm threshold.
2. A **canvas topology map** — the request flow (client → load balancer → app → database / broker), with each node
   and arrow colored by a live metric.
3. A **state-timeline of breach bands** — a row per signal, green when healthy, red when in breach, so you can see
   *when* it started and whether it's flapping.

## The catch: CloudWatch has no "is this alarm firing?" query

The obvious way to build an alarm wall would be to ask the datasource "what's the state of alarm X?" But the
Grafana CloudWatch datasource has exactly **two query modes — Metrics and Logs — and no alarm-state query type at
all.** You cannot read alarm state from it.

So instead of *reading* the alarm, you **replicate** it: each tile queries the same metric the alarm watches, and
its color thresholds are set to the same numbers as the alarm's threshold. The tile turns red under exactly the
condition that fires the page.

<figure>
  <img src="/blog/incident-wall-grafana-zero-cost/replicate-threshold.svg" alt="Because the datasource cannot query alarm state, each tile queries the same metric and applies the same threshold as the real alarm, turning red under the same condition" loading="lazy" />
  <figcaption>No alarm-state query exists, so the tile replicates the alarm — same metric, same threshold, same red condition.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>You don't need a special "alarm dashboard" feature to build an alarm wall. A <strong>stat panel whose
  background color is driven by thresholds matching your real alarms</strong> turns the same metric into a
  traffic light. The screen and the page now agree by construction — <em>same metric, same number.</em></p>
</aside>

## The traffic-light pattern, concretely

The whole effect comes from one panel configuration repeated per signal: a stat panel with
`colorMode: background`, the reducer set to the *last* value, and threshold steps for green / orange / red. Green is
the healthy baseline, orange is a warning band, red is the alarm threshold. The background of the entire tile
becomes the status color, so a wall of these reads like a board of traffic lights — you scan for red.

<figure>
  <img src="/blog/incident-wall-grafana-zero-cost/semaforo.svg" alt="A stat panel with background color mode and three threshold steps turns a single metric value into a green, orange, or red traffic-light tile" loading="lazy" />
  <figcaption>The semáforo (traffic-light) tile — last value plus three thresholds equals an at-a-glance status light.</figcaption>
</figure>

For things that aren't a single number — like "is traffic flowing through the broker?" — the canvas layer earns its
keep: nodes and connection arrows bind their color to a metric field, so the topology *itself* lights up where the
trouble is. And the state-timeline gives you the time dimension the stat tiles lack: a tile only shows *now*, but a
breach band shows you it's been red for twenty minutes, or flapping every few minutes.

## Why it's genuinely $0

This is the part I like most. The whole wall is built from things you already have:

- **No new datasource, plugin, or IAM permission.** It reuses the existing CloudWatch datasource and the metrics
  already being published. (Avoid the temptation of fancy diagram plugins — several are dead on modern Grafana;
  the built-in canvas panel does the job.)
- **No app instrumentation.** Every tile reads a metric that already exists because an alarm already watches it.
- **Dashboards as code.** The dashboard is a JSON file in the repo; the container provisions it automatically on
  deploy. Any new JSON in the folder is picked up with no manual registration.

<figure>
  <img src="/blog/incident-wall-grafana-zero-cost/dashboards-as-code.svg" alt="A dashboard JSON file committed to git is baked into the Grafana container image and auto-provisioned on deploy, with no manual registration step" loading="lazy" />
  <figcaption>Dashboards as code — the wall lives in git, ships with the container, and provisions itself.</figcaption>
</figure>

The result is a dashboard with the same lifecycle as the rest of the system: reviewed in a pull request, versioned,
and reproducible. If I ever rebuild the environment, the incident wall comes back exactly as it was — no clicking
through the Grafana UI to recreate panels from memory.

## The lesson: a triage view is a force multiplier for a solo operator

The forty-graph dashboards still have their place — you go to them *after* the wall tells you which corner of the
system to look at. But the highest-leverage thing you can build, especially when you're the only person on call, is
the screen that turns "something feels wrong" into "the database tile is red" in two seconds. And the best part is
that it asks nothing of you that you haven't already built: if you've got alarms, you've got the metrics and the
thresholds, and a traffic-light wall is just a different rendering of the same truth.

## References & further reading

- [Grafana stat panel](https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/stat/) and [canvas panel](https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/canvas/) docs.
- [Provisioning dashboards as code](https://grafana.com/docs/grafana/latest/administration/provisioning/#dashboards) in Grafana.
- [Amazon CloudWatch concepts](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html) — metrics, namespaces, dimensions.

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade) — the monitoring architecture this wall sits on top of.
- Related: [health checks that don't lie](/blog/health-checks-that-dont-lie) and [don't page me at 3am](/blog/dont-page-me-at-3am) *(same SRE series)*.
- The sanitized [public repository](https://github.com/mizolutions/trinitrade) and [about me](/misael).

---

*Trinitrade is a real, live system I designed, built, and operated solo. The incident wall described here is real,
provisioned from JSON in the repo. The sanitized source lives in the [case study](/trinitrade) and the
[public repository](https://github.com/mizolutions/trinitrade).*
