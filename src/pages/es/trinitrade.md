---
layout: ../../layouts/CaseLayout.astro
lang: es
kicker: Caso de estudio
title: Trinitrade — operar un sistema de trading en vivo como un problema de confiabilidad
description: >-
  Una plataforma de trading algorítmico de grado producción que diseñé, construí
  y operé de extremo a extremo como operador único — correcta, observable,
  auditable y barata de operar. El titular no es la ganancia; es la disciplina
  de ingeniería, incluyendo demostrar que no había edge y parar con honestidad.
backLabel: ← Inicio
---

**Rol:** único arquitecto, constructor y operador (SRE / DevOps / research cuantitativo).

**Stack:** AWS · ECS Fargate · RDS/TimescaleDB · CDK (IaC) · GitHub Actions + OIDC + CodeBuild · Grafana · CloudWatch · Alpaca API · Python 3.12 / FastAPI.

<p>
  <a href="https://github.com/mizolutions/trinitrade">Código en GitHub →</a>
</p>

<nav class="toc" aria-label="Contenido">

**Contenido**

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura e infraestructura](#2-decisiones-de-arquitectura-e-infraestructura)
3. [Pipeline de datos y almacenamiento](#3-pipeline-de-datos-y-almacenamiento)
4. [Observabilidad y SRE (la ruta del dinero)](#4-observabilidad-monitoreo-y-sre)
5. [Evolución y resiliencia](#5-evolución-y-resiliencia-incidentes-reales-arreglos-reales)
6. [El resultado honesto: sin edge](#6-la-parte-que-la-mayoría-de-portfolios-esconde-demostré-que-no-había-edge--y-paré)

</nav>

## 1. Resumen ejecutivo

**Trinitrade es una plataforma de trading algorítmico de grado producción que diseñé, construí y operé de extremo a extremo** — desde la ingesta de datos de mercado hasta la ejecución de órdenes en vivo con capital real — como operador único.

Lo interesante **no** es que gane dinero (no lo hace, y puedo demostrar que fui riguroso al respecto — ver §6). Lo interesante es que es un **problema de confiabilidad real, resuelto como lo haría un SRE senior**: un sistema financiero que debe ser **correcto, observable, auditable y barato de operar**, manejado de forma segura por una sola persona, con cada decisión registrada en un Architecture Decision Record (ADR).

**El reto central nunca fue la latencia** (es un sistema de **baja frecuencia**, señales diarias, no HFT). Los retos reales fueron:

1. **Seguridad** — toca dinero real, así que un bug no puede ser solo un test fallido; debe estar *contenido* por diseño.
2. **Disciplina de coste** — operar infra cloud 24/7 contra una base de capital minúscula invierte la economía, así que el coste es una restricción de ingeniería de primera clase.
3. **Honestidad intelectual** — probar (o refutar) un *edge* de trading sin engañarte a ti mismo es *más difícil* que construir la plataforma, y es la parte que la mayoría finge.

## 2. Decisiones de arquitectura e infraestructura

Todo es **Infraestructura como Código** (AWS CDK, Python) — **19 stacks de CloudFormation**, cero click-ops. La plataforma entera se puede destruir y recrear desde el repositorio.

<figure>
  <img src="/trinitrade/diagrams/a1-aws-topology.svg" alt="Diagrama de topología AWS: clientes a Route53 a Application Load Balancer a tarea ECS Fargate a RDS TimescaleDB, con CloudWatch, Grafana, un scheduler de apagado automático en EventBridge y una ruta de despliegue GitHub OIDC a CodeBuild" loading="lazy" />
  <figcaption>Topología AWS — una sola cuenta, 100% IaC. Route53 → ALB → Fargate → TimescaleDB, con el scheduler de apagado automático y la ruta CI/CD sin llaves anotados.</figcaption>
</figure>

| Decisión | Qué elegí | Por qué |
|---|---|---|
| **Cómputo** | ECS **Fargate**, réplica única, base on-demand + Spot | Contenedores serverless = sin servidores que parchear. Réplica única porque el envío de órdenes debe ser **idempotente y sin duplicados** sin un lock distribuido; la mezcla Spot-con-base-on-demand mantiene el coste bajo garantizando colocación en horario de mercado. |
| **Ejecución** | API de Alpaca (bróker) | API REST/streaming limpia, paridad paper + live, acciones fraccionarias — permite a un operador solo validar *toda* la ruta del dinero de forma segura. |
| **Región** | `us-east-1` | Coste y disponibilidad de servicios (no latencia — esto no es HFT). Documentado honestamente como tal. |
| **Modelo de despliegue** | Declarativo: el switch live/paper, el número de réplicas y los feature flags son todos **contexto de CDK**, nunca fuera de banda | Aprendido a la mala: un cambio runtime fuera de banda lo revierte en silencio el siguiente `cdk deploy`. Hacer *todo* declarativo eliminó una clase entera de incidentes "¿por qué cambió producción?". |
| **Apagado automático por coste** | Un scheduler escala el servicio a cero noches/fines de semana (mercado cerrado) y detiene la base de datos | La mayor palanca de coste. El sistema está **ON solo Lun–Vie en horario de mercado**; fuera de horario cuesta casi nada. |

<figure>
  <img src="/trinitrade/diagrams/a2-network.svg" alt="Diagrama de red: Internet Gateway a un ALB en subred pública, luego a una tarea Fargate en subred privada, luego a RDS en subred privada, con security groups de mínimo privilegio en cada salto" loading="lazy" />
  <figcaption>Red — security groups de mínimo privilegio: nada llega a la tarea salvo el ALB; nada llega a la base de datos salvo la tarea.</figcaption>
</figure>

<figure>
  <img src="/trinitrade/diagrams/a5-cost-auto-stop.svg" alt="Diagrama de estados del scheduler de apagado automático: OFF a ON en el despertar Lun-Vie, ON a OFF a las 22:00 ET, y OFF en bucle noches y fines de semana a coste casi cero" loading="lazy" />
  <figcaption>Apagado automático — la palanca de coste #1, expresada como una máquina de estados en un scheduler de EventBridge.</figcaption>
</figure>

<p class="repo-refs">En GitHub: <a href="https://github.com/mizolutions/trinitrade/blob/main/infra/stacks/compute_stack.py"><code>compute_stack.py</code></a> · <a href="https://github.com/mizolutions/trinitrade/blob/main/infra/stacks/network_stack.py"><code>network_stack.py</code></a> · <a href="https://github.com/mizolutions/trinitrade/blob/main/infra/stacks/scheduler_stack.py"><code>scheduler_stack.py</code></a> · <a href="https://github.com/mizolutions/trinitrade/tree/main/infra/stacks">los 9 stacks</a></p>

<figure>
  <img src="/trinitrade/05-infra-compute.jpg" alt="Dashboard de infraestructura en Grafana mostrando el cómputo de ECS Fargate: CPU, memoria y número de tareas corriendo en el tiempo" loading="lazy" />
  <figcaption>Dashboard de infraestructura — cómputo ECS Fargate (CPU / memoria / tareas corriendo). Se ve el patrón ON-solo-en-horario-de-mercado.</figcaption>
</figure>

## 3. Pipeline de datos y almacenamiento

Los datos de mercado son series temporales por naturaleza, así que el almacén es **TimescaleDB** (una extensión de PostgreSQL) sobre RDS.

**Por qué TimescaleDB frente a las alternativas:**

- vs **DynamoDB**: necesito *consultas por rango de tiempo* + agregaciones (barras OHLCV, ventanas móviles) — eso es territorio relacional/SQL, no clave-valor.
- vs **RDS Postgres plano**: las **hypertables** de TimescaleDB auto-particionan por tiempo y dan agregados continuos, así las barras diarias/intradía siguen rápidas a medida que crece el dataset, sin sharding manual.
- Los datasets de research llegaron a **~2.600 barras diarias por nombre sobre un panel survivorship-free de 736 nombres del S&P 500 (2016–2026)** — suficiente para que un scan ingenuo doliera; las hypertables lo mantuvieron aburrido (que es el objetivo).

La ruta de ingesta tiene una **guardia de integridad** (p. ej. marca cualquier retorno de un día < −50% como probable artefacto de split/spin-off) — porque en finanzas, *los datos malos producen en silencio resultados seguros-pero-equivocados*.

<p class="repo-refs">En GitHub: <a href="https://github.com/mizolutions/trinitrade/blob/main/alembic/versions/4ddf9d8d41ca_setup_timescaledb_hypertable_and_.py"><code>migración hypertable</code></a> · <a href="https://github.com/mizolutions/trinitrade/blob/main/src/market_data/service.py"><code>market_data/service.py</code></a> · <a href="https://github.com/mizolutions/trinitrade/blob/main/src/market_data/providers/alpaca_provider.py"><code>alpaca_provider.py</code></a></p>

<figure>
  <img src="/trinitrade/10-market-data.jpg" alt="Dashboard de datos de mercado en Grafana mostrando la frescura de la ingesta y el conteo de barras por símbolo" loading="lazy" />
  <figcaption>Pipeline de datos de mercado — frescura de ingesta y cobertura por símbolo.</figcaption>
</figure>

## 4. Observabilidad, monitoreo y SRE

Aquí es donde el sistema se gana la etiqueta de "grado producción".

**La ruta del dinero** — cada señal cruza los checks de riesgo antes de poder tocar al bróker, y cada fill se escribe en un log de auditoría a prueba de manipulación:

<figure>
  <img src="/trinitrade/diagrams/a3-money-path.svg" alt="Diagrama de secuencia de la ruta del dinero: señal de estrategia a checks del risk manager, a envío de orden idempotente, a fill de Alpaca, a actualización de posición y P&L, a una fila de auditoría enlazada por hash" loading="lazy" />
  <figcaption>La ruta del dinero — estrategia → checks de riesgo → envío idempotente → fill → posición/P&amp;L → fila de auditoría enlazada por hash.</figcaption>
</figure>

- **Grafana: 11 dashboards** que abarcan infraestructura (CPU/memoria/tareas-corriendo), la ruta del dinero (envío de órdenes, fills, reconciliación) y SLOs.
- **SLOs + alarmas**: alarmas de latencia/5xx/heartbeat en CloudWatch, con **alarmas compuestas gateadas por fuera-de-horario** para que el sistema no me despierte a las 3am por estar apagado a propósito.
- **Fan-out de alertas multicanal**: un Lambda reparte las alarmas a Telegram/Discord — y trato esa ruta de entrega como su *propia* superficie de fallo (que la alarma dispare y que la notificación llegue son dos problemas de confiabilidad distintos).
- **Health endpoints separados por propósito**: una sonda de liveness sin dependencias (sí/no rápido para el balanceador) y una sonda de readiness profunda (DB + cache + bróker, cada una con timeout de 1 segundo para que una sonda nunca se cuelgue).
- **Cadena de auditoría con hash criptográfico**: cada fila del trade-log está enlazada por hash a la anterior, así el historial es **a prueba de manipulación** — una propiedad de grado compliance, con un verificador agendado que re-chequea la cadena y alarma si hay divergencia.

<figure>
  <img src="/trinitrade/diagrams/a7-observability.svg" alt="Diagrama de fan-out de observabilidad: app a métricas y logs de CloudWatch, a alarmas y Grafana, luego alarmas compuestas gateadas por fuera-de-horario a SNS a un Lambda de reparto a Telegram y Discord" loading="lazy" />
  <figcaption>Fan-out de observabilidad — las alarmas y la entrega de la notificación se tratan como dos superficies de fallo distintas.</figcaption>
</figure>

<figure>
  <img src="/trinitrade/diagrams/a6-audit-chain.svg" alt="Diagrama de hash-chain: fila génesis, luego el hash de cada fila calculado desde sus datos más el hash previo, con un verificador agendado que recalcula la cadena y alarma ante divergencia" loading="lazy" />
  <figcaption>Cadena de auditoría a prueba de manipulación — cada fila se enlaza por hash a la anterior; un verificador agendado alarma ante cualquier divergencia.</figcaption>
</figure>

<p class="repo-refs">En GitHub: <a href="https://github.com/mizolutions/trinitrade/blob/main/src/risk/risk_manager.py"><code>risk_manager.py</code></a> · <a href="https://github.com/mizolutions/trinitrade/blob/main/src/orders/order_manager.py"><code>order_manager.py</code></a> · <a href="https://github.com/mizolutions/trinitrade/blob/main/src/risk/submit_lock.py"><code>submit_lock.py</code></a> · <a href="https://github.com/mizolutions/trinitrade/blob/main/src/audit/audit_service.py"><code>audit_service.py</code></a> · <a href="https://github.com/mizolutions/trinitrade/blob/main/src/main.py"><code>main.py</code> (sonda de salud)</a></p>

<figure>
  <img src="/trinitrade/02-incident-overview.jpg" alt="Dashboard de incident-overview en Grafana: un muro de mosaicos tipo semáforo con el estado de cada subsistema" loading="lazy" />
  <figcaption>Incident overview — un solo muro semáforo: verde significa que toda la ruta del dinero está sana de un vistazo.</figcaption>
</figure>

<figure>
  <img src="/trinitrade/03-slo.jpg" alt="Dashboard de SLO en Grafana mostrando objetivos de nivel de servicio y presupuestos de error" loading="lazy" />
  <figcaption>Dashboard de SLO — objetivos y presupuestos de error, la base de un alerting accionable (no ruidoso).</figcaption>
</figure>

<figure>
  <img src="/trinitrade/09-healthchecks.jpg" alt="Dashboard de Grafana mostrando los resultados de los health-checks de liveness y readiness en el tiempo" loading="lazy" />
  <figcaption>Health checks — sondas separadas de liveness/readiness, cada dependencia con timeout de 1 segundo.</figcaption>
</figure>

## 5. Evolución y resiliencia (incidentes reales, arreglos reales)

Algunas lecciones de confiabilidad representativas (todas documentadas como ADRs/worklogs):

- **La reversión silenciosa paper→live.** Un `cdk deploy` revirtió una vez el modo del bróker fuera de banda porque el switch vivía fuera de CloudFormation. Arreglo: hice el modo **contexto declarativo de CDK** + un secret durable. *Lección: todo lo que no esté en IaC va a derivar.*
- **La trampa del deploy fuera de horario.** Desplegar un service stack con la base de datos detenida (fuera de horario) dispara el circuit-breaker de despliegue a `UPDATE_ROLLBACK`. Arreglo: una regla dura — **nunca desplegar un service stack con estado fuera de su ventana ON** — codificada en el runbook.
- **Un bug de concurrencia en la cadena de auditoría.** Escritores concurrentes producían divergencias de hash-chain; arreglado con un advisory lock de Postgres que serializa la cadena. *Lección: "append-only + hash-linked" igual necesita un lock.*
- **Portabilidad de shell en CI.** Un bashism `${PIPESTATUS[0]}` fallaba en silencio cada build bajo `/bin/sh` (dash), enmascarando el resultado real. Arreglo: `bash -c 'set -o pipefail; …'` explícito. *Lección: CI corre en el shell en que corre, no en el que asumes.*

<figure>
  <img src="/trinitrade/diagrams/a4-cicd-oidc.svg" alt="Diagrama CI/CD: git push a main dispara GitHub Actions, que intercambia un token OIDC de corta vida por un rol IAM, corre CodeBuild en un runner self-hosted y despliega la app, la imagen y los dashboards — sin llaves AWS estáticas" loading="lazy" />
  <figcaption>CI/CD sin llaves — GitHub Actions asume un rol IAM vía tokens OIDC de corta vida; no hay llaves AWS de larga vida en CI.</figcaption>
</figure>

<p class="repo-refs">En GitHub: <a href="https://github.com/mizolutions/trinitrade/blob/main/docker/Dockerfile"><code>Dockerfile</code> (multi-stage, non-root)</a> · <a href="https://github.com/mizolutions/trinitrade/blob/main/docker/entrypoint.sh"><code>entrypoint.sh</code></a></p>

El coste se redujo por ingeniería de forma continua: el pipeline de CI se consolidó (11 → 7 jobs), se eliminó una capa de cache sin uso, y una **auditoría completa con AWS Cost Explorer** guió un plan estructurado de reducción de coste — tratando la factura mensual como un SLO en sí mismo.

<figure>
  <img src="/trinitrade/04-aws-cost.jpg" alt="Dashboard de coste AWS en Grafana: gasto del mes a la fecha, pronóstico de fin de mes y gasto desglosado por servicio" loading="lazy" />
  <figcaption>Dashboard de coste — gasto MTD, pronóstico de fin de mes y gasto por servicio. La línea dominante es CI (CodeBuild), no el runtime: prueba de que el apagado automático mantiene ECS/RDS bajos.</figcaption>
</figure>

## 6. La parte que la mayoría de portfolios esconde: demostré que no había edge — y paré

Esta es la sección de la que estoy más orgulloso, y la que más debería importarle a un panel de contratación.

<figure>
  <img src="/trinitrade/diagrams/a8-research-funnel.svg" alt="Embudo de disciplina de research: pre-registrar una hipótesis en git, correr el backtest una vez, chequear criterios pre-fijados, NO-GO documentado como ADR si no controles de sesgo, luego validación forward; una stop-rule concluye el programa tras 7/7 NO-GO" loading="lazy" />
  <figcaption>La disciplina de research — pre-registrar, correr una vez, controlar sesgo, y una stop-rule pre-comprometida. Las 7/7 familias fueron NO-GO, así que concluí con honestidad.</figcaption>
</figure>

Corrí un **programa de research pre-registrado y consciente de las comparaciones múltiples** para encontrar un *edge* de trading genuino:

- **7 familias de estrategia distintas** en dos programas (tendencia, vol-targeting, dual-momentum, momentum transversal, momentum cross-asset de series temporales, reversión a la media/pairs, y event-driven/PEAD).
- **Disciplina:** cada hipótesis se *congelaba en un commit de git antes de correr* (para que las reglas no se movieran tras ver los resultados), con criterios de aceptación pre-declarados y una **stop-rule** (un presupuesto fijo de intentos — no corres hipótesis hasta que una gane por suerte).
- **Controles de sesgo:** datos point-in-time survivorship-free, guardias anti-look-ahead, y tests explícitos que distinguen una señal real de un espejismo estadístico.

**El resultado: las 7 familias fueron NO-GO** frente a simplemente mantener el mercado (SPY pasivo). Una parecía prometedora — una señal de drift post-earnings con altísima significancia estadística (*t* ≈ 5.7) — hasta que un **test de control de $0** mostró que el "edge" era solo beta de mercado disfrazado, no alpha cosechable. Así que **concluí el programa con una decisión capstone y paré**, en vez de sobreajustar un perdedor hasta una falsa victoria.

> Por qué esto importa para un rol SRE/Lead: la misma disciplina que me impide hacer p-hacking en un backtest es la que me impide desplegar un cambio "probablemente está bien" a producción. **Medir con honestidad y parar según la evidencia es la habilidad senior.** Un negativo limpio y bien documentado es un *éxito* de método.

---

*Las decisiones del proyecto están documentadas como **Architecture Decision Records** (27 de ellas) — incluyendo la decisión de parar. El código sanitizado, los stacks de infraestructura, [todos los diagramas de arquitectura](https://github.com/mizolutions/trinitrade/blob/main/docs/architecture-diagrams.md), y más evidencia viven en el [repositorio público](https://github.com/mizolutions/trinitrade).*
