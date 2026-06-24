# 📝 Blog plan — editorial calendar (mizolutions.com/blog)

> **Purpose:** mine the Trinitrade project for the maximum number of high-quality, honest, deep-dive
> articles, write them ahead of time as drafts, and publish on a steady weekly cadence.
> **Owner:** Misael (single operator). **Created:** 2026-06-23.
> **Tracked in:** [CONTROL_TOWER.md](CONTROL_TOWER.md) (Content/Blog row).

---

## 1. Parameters (decided 2026-06-23)

| Parameter | Decision |
|---|---|
| **Language** | **Bilingual EN + ES** for every post (write both before marking `ready`). |
| **Audience** | Mixed: hiring managers (Lead SRE/DevOps brand) · engineers/peers (build-in-public) · potential consultancy clients. |
| **Depth** | **Deep-dive, 1500–2500 words** each, with diagrams/code where it helps. |
| **Volume (this batch)** | **~30+ candidates** mined below. |
| **Cadence** | **Weekly** (1 post live per week). ~30 posts ≈ 7 months of runway. |
| **Mechanic** | Write all as `draft: true`; publish by flipping `draft: false` + setting `pubDate` to the release day. Production build excludes drafts; preview (`npm run dev`) shows them. |

## 2. Voice & conventions (match the existing post)

- **First person, opinionated, practical.** Lead with a concrete pain ("3 a.m. incidents"), not theory.
- **Anchored in Trinitrade** — every claim is real and traceable to an ADR/worklog. No invented metrics.
- **Honesty is the brand:** write candidly about failures, footguns, and the negative research result. That is
  the differentiator, not a weakness.
- **No secrets / no P&L:** never publish AWS account IDs, ARNs, keys, balances, or returns claims (site ADR-002).
  Reuse the already-sanitized public repo `github.com/mizolutions/trinitrade` for code links.
- **SEO:** each post targets 1–2 **long-tail** keywords (we will NOT chase head terms like "devops"/"sre").
  Fill `description` (155–160 chars, keyword-bearing) and 3–5 `tags`. Link internally to `/trinitrade` and 1–2 sibling posts.
- **Files:** EN in `src/content/blog/<slug>.md`, ES in `src/content/blog/<slug>-es.md` (or `de-...` style already used).
  Frontmatter: `title, description, pubDate, lang, tags, draft`.
- **Visuals & template:** every post follows [BLOG_POST_TEMPLATE.md](BLOG_POST_TEMPLATE.md) — the reusable skeleton +
  visual blocks (diagrams, callouts, tables, references). Diagrams = Mermaid rendered to **static dark SVGs** via
  `scripts/render-mermaid.sh` into `public/blog/<slug>/`; styled by `.prose` (figure/img/table/`.callout`) in
  `global.css`. Density rule: as many diagrams as genuinely help + one key-insight callout per post.

## 3. Status legend

`idea` → `outline` → `draft-EN` → `draft-ES` → `ready` (both langs done, `draft:true`) → `published` (`draft:false`)

---

## 4. Candidate backlog (clusters)

> 33 candidates. Each maps to real source material in the trading-system repo (private) — ADRs, worklogs,
> design docs, and the distilled "lessons" notes. IDs are stable; status updated as we go.

### Cluster A — SRE & Observability
| ID | Working title (EN) | Hook / angle | Source | Status |
|---|---|---|---|---|
| A0 | From storing logs to real observability | logs ≠ observability; questions you can answer in prod | observability worklogs | ✅ **published** |
| A1 | Health checks that don't lie: liveness vs readiness (and the 1-second rule) | every probe needs its own timeout or it hangs the fleet | health-endpoint design; `src/main.py` | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| A2 | Don't page me at 3 a.m. for a system that's off | composite alarms + off-hours gating to kill false pages | ADR-008; cloudwatch-alarm notes | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| A3 | The alert that fired but never arrived | notification fan-out as its own failure surface | ADR-009; SNS_NOTIFICATIONS_ARCHITECTURE | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| A4 | A traffic-light incident wall in Grafana, for $0 | single-pane triage with no new instrumentation | grafana worklogs; MONITORING_ARCHITECTURE | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| A5 | SLOs for a system only you operate | error budgets without a team | SLO.md | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| A6 | CloudWatch alarm pitfalls I learned the hard way | dimensions, SEARCH, period limits, bootstrap false-pages | cloudwatch-alarm notes | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |

### Cluster B — FinOps / cloud cost
| ID | Working title (EN) | Hook / angle | Source | Status |
|---|---|---|---|---|
| B1 | Scaling a trading system to zero on nights and weekends | the cost-auto-stop scheduler is the #1 lever | `scheduler_stack.py`; ADR | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| B2 | Your monthly cloud bill is an SLO | treat cost as a first-class reliability metric | cost-scorecard; Cost Explorer audit | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| B3 | Fargate Spot + an on-demand base: the trade-off as code | cheap but always-placed during market hours | `compute_stack.py`; fargate-spot notes | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| B4 | When CI is your biggest cloud bill | the runner that quietly became line item #1 | ci-cascade + codebuild notes | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |

### Cluster C — IaC & deployment war stories
| ID | Working title (EN) | Hook / angle | Source | Status |
|---|---|---|---|---|
| C1 | Anything not in IaC will drift: the silent paper→live revert | a deploy reverted prod out-of-band; fix = declarative | ADR-013; live worklog | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| C2 | Never deploy a stateful service off-hours | the deployment circuit-breaker rollback trap | fargate-spot notes; worklog | **draft+visuals ✅ (EN+ES, 3 diagramas + callout + refs, en review)** |
| C3 | CodeBuild runs in dash, not bash | the `${PIPESTATUS[0]}` bug that hid every result | codebuild-buildspec notes | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| C4 | Killing static AWS keys: keyless CI with GitHub OIDC | short-lived tokens, no secrets in CI | deploy workflow; security | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| C5 | Cascade debt: when one red pipeline hides eight layers | reactivating a long-red job surfaces debt one step at a time | ci-pipeline-cascade notes | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| C6 | AWS CLI & CloudFormation footguns | empty AWS_PROFILE, ASCII-only descriptions, file:// executor | aws-cli-and-cfn notes | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |

### Cluster D — Data & correctness
| ID | Working title (EN) | Hook / angle | Source | Status |
|---|---|---|---|---|
| D1 | Why TimescaleDB hypertables for market data | vs DynamoDB, vs plain Postgres | ADR-002; DATABASE.md | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| D2 | Bad data silently produces confident-but-wrong results | the −50%/day integrity guard | integrity guard; research notes | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| D3 | Tamper-evident audit logs with a hash-chain | append-only still needs a lock (concurrency bug + fix) | AUDIT_TRAIL; audit worklog | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| D4 | Idempotent order submission without a distributed lock | single replica as a deliberate design choice | asyncio-lock notes; `submit_lock.py` | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| D5 | The SQLAlchemy enum bug that wasn't | Postgres enum case coercion, debunked | sqlalchemy-enum notes | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| D6 | Async SQLAlchemy with asyncpg: patterns and pitfalls | what bites under FastAPI + pytest-asyncio | ADR-003 | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |

### Cluster E — The honest quant-research saga ⭐ (signature series)
| ID | Working title (EN) | Hook / angle | Source | Status |
|---|---|---|---|---|
| E1 | I tried to find a trading edge and failed 7 times — and that's the point | overview/capstone of the program | ADR-026/027; case study §6 | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| E2 | Pre-registration for backtests: how to not fool yourself | freeze the hypothesis in git before you run it | research-discipline notes; charter | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + code + refs, en review)** |
| E3 | Survivorship bias is sneakier than you think | the GO that became a NO-GO on point-in-time data | ADR-018/021 | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| E4 | The $0 control test: when a t=5.7 'edge' is just beta | market-neutral diagnostic kills a fragile signal | ADR-025/026 | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| E5 | Stop-rules: concluding a research program is a success of method | multiple-comparisons discipline, pre-committed budget | ADR-019/026 | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| E6 | A bias-confirmation toolkit for thin backtest "wins" | equal-weight control · look-ahead ablation · bootstrap | research-discipline notes | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| E7 | Data gotchas in vendor daily bars | SIP vs IEX, adjustment=all, spin-off artifacts | research notes; MD-CA-1 | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |

### Cluster F — Engineering discipline / meta (Lead-level signals)
| ID | Working title (EN) | Hook / angle | Source | Status |
|---|---|---|---|---|
| F1 | Architecture Decision Records for a team of one | lightweight ADRs that actually pay off | docs/adr | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| F2 | A 'Control Tower' for solo operators | governance without bureaucracy | control-tower docs | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |
| F3 | Testing pitfalls that only bite in CI | settings singletons, module-level locks, random-order flakes | asyncio-lock + singleton notes | **draft+visuals ✅ (EN+ES, 5 diagramas + callout + refs, en review)** |
| F4 | Building (and concluding) a project in public, honestly | the whole arc, including the decision to stop | full project arc | **draft+visuals ✅ (EN+ES, 4 diagramas + callout + refs, en review)** |

---

## 5. Proposed publish order (weekly)

> Interleaves clusters so the blog reads varied, front-loads the strongest differentiators and broad-appeal
> pieces, and keeps the signature research series (E) as a recurring monthly anchor. Dates are slots, not commitments.

| Wk | ID | Title | Cluster |
|---|---|---|---|
| 0 | A0 | From storing logs to real observability | A *(already live)* |
| 1 | E1 | I tried to find a trading edge and failed 7 times | E ⭐ |
| 2 | C1 | Anything not in IaC will drift | C |
| 3 | A1 | Health checks that don't lie | A |
| 4 | B1 | Scaling a trading system to zero | B |
| 5 | E2 | Pre-registration for backtests | E ⭐ |
| 6 | C3 | CodeBuild runs in dash, not bash | C |
| 7 | D1 | Why TimescaleDB hypertables for market data | D |
| 8 | A2 | Don't page me at 3 a.m. for a system that's off | A |
| 9 | E3 | Survivorship bias is sneakier than you think | E ⭐ |
| 10 | C4 | Killing static AWS keys: keyless CI with OIDC | C |
| 11 | B2 | Your monthly cloud bill is an SLO | B |
| 12 | D3 | Tamper-evident audit logs with a hash-chain | D |
| 13 | E4 | The $0 control test: when a t=5.7 'edge' is just beta | E ⭐ |
| 14 | A3 | The alert that fired but never arrived | A |
| 15 | F1 | Architecture Decision Records for a team of one | F |
| 16 | C2 | Never deploy a stateful service off-hours | C |
| 17 | E5 | Stop-rules as a success of method | E ⭐ |
| 18 | B3 | Fargate Spot + an on-demand base | B |
| 19 | D4 | Idempotent order submission without a distributed lock | D |
| 20 | A4 | A traffic-light incident wall in Grafana, for $0 | A |
| 21 | E6 | A bias-confirmation toolkit for thin backtest wins | E ⭐ |
| 22 | C5 | Cascade debt: one red pipeline, eight layers | C |
| 23 | F3 | Testing pitfalls that only bite in CI | F |
| 24 | D2 | Bad data silently produces confident-but-wrong results | D |
| 25 | E7 | Data gotchas in vendor daily bars | E ⭐ |
| 26 | A5 | SLOs for a system only you operate | A |
| 27 | B4 | When CI is your biggest cloud bill | B |
| 28 | C6 | AWS CLI & CloudFormation footguns | C |
| 29 | D5 | The SQLAlchemy enum bug that wasn't | D |
| 30 | F2 | A 'Control Tower' for solo operators | F |
| 31 | A6 | CloudWatch alarm pitfalls I learned the hard way | A |
| 32 | D6 | Async SQLAlchemy with asyncpg | D |
| 33 | F4 | Building (and concluding) a project in public, honestly | F |

---

## 6. Workflow (per article)

1. **Outline** (bullets + key claims + source refs + target keywords) — quick review/approve.
2. **Draft EN** (1500–2500w, `draft: true`).
3. **Draft ES** (translate/adapt, `draft: true`).
4. Mark **`ready`** in this doc once both langs pass `astro check` + a read-through.
5. On publish day: flip `draft: false` + set `pubDate`, push → Vercel. Update status to `published` here.

**Batching:** write 2–4 articles per work session (usually one cluster at a time so research context is loaded),
keeping a buffer of several `ready` posts ahead of the weekly cadence.

## 7. Notes / open questions to revisit

- Optional: add an **Open Graph image** per post (S-04) for better link previews.
- Optional: a **/blog** landing tweak to group by cluster/tag once volume grows.
- Revisit keyword targets after Search Console starts returning impressions (see which long-tails actually land).
