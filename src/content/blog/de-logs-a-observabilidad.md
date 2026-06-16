---
title: 'De guardar logs a tener observabilidad de verdad'
description: 'Cómo instrumentar un sistema de trading algorítmico crítico convierte la sopa de logs en preguntas que sí puedes responder en producción.'
pubDate: 2026-06-16
lang: 'es'
draft: false
tags: ['observabilidad', 'sre', 'cloud', 'trading']
---

Todos los equipos dicen que tienen observabilidad. La mayoría tiene logs. No son
lo mismo — y la brecha entre ambos es justo donde nacen los incidentes de las
3 a.m.

Aprendí la diferencia instrumentando **Trinitrade**, un sistema de trading
algorítmico en vivo donde una señal perdida o un fallo silencioso tienen un
costo en dólares, medido en tiempo real. Así pasamos de _guardar logs_ a poder
_hacer preguntas nuevas sobre producción sin desplegar código_.

## 1. La trampa de los logs-como-observabilidad

`logger.info("orden enviada")` _parece_ observabilidad. No lo es. Los logs
responden preguntas que ya sabías hacer. La observabilidad real es la propiedad
que te deja responder las preguntas que **no** anticipaste — cuando el sistema
ya está en producción y se está portando mal.

El encuadre clásico son tres pilares: **logs** (eventos discretos), **métricas**
(números agregables en el tiempo) y **trazas** (el camino causal de una sola
petición). Un montón de `print` enviados a CloudWatch es un pilar, a medio
construir. Te dirá _que_ algo pasó; no te dirá _con qué frecuencia_, _qué tan
lento_, ni _por qué esta orden en concreto_.

## 2. Instrumentar el camino crítico

En un sistema de trading el camino crítico es el ciclo de vida de la orden:
`señal → control de riesgo → envío al broker → fill → conciliación`.
Instrumentamos cada salto con **eventos estructurados**, no texto libre:

- `order_submit_latency_ms` — el número detrás de cada SLO de latencia.
- `slippage_bps` — medido por fill, con alerta por encima de 30 bps.
- ratio fill / reject — indicador adelantado de problemas de broker o estrategia.
- `risk_rejections_total` — el Risk Manager frenando órdenes anómalas.
- discrepancias de conciliación — que deben ser **0**, siempre.

La regla: todo número que pondrías en una alerta tiene que ser una métrica de
primera clase, y cada línea de log es JSON estructurado con un conjunto de claves
estable. La **disciplina de cardinalidad** importa — una etiqueta `symbol` está
bien; una etiqueta `order_id` te revienta la factura de métricas. Aplica RED
(Rate, Errors, Duration) al endpoint de envío y USE (Utilization, Saturation,
Errors) a la tarea de Fargate, y tienes una primera versión completa.

## 3. De métricas a SLOs y alertas accionables

Las métricas son inertes hasta que tienen un objetivo. Definimos **SLOs**:
latencia p95 de envío bajo un presupuesto fijo, discrepancias de conciliación
iguales a cero, ratio señal-a-envío por encima de un umbral. Cada SLO recibe un
error budget — y, la parte que casi todos saltan, **toda alerta debe ser
accionable y mapear a un runbook**. Si un page se dispara y el runbook es "busca
hasta encontrarlo", eso no es una alerta, es una interrupción.

Matamos más alarmas de las que añadimos. Una alarma de CloudWatch sobre una
métrica nunca publicada con `treatMissingData: breaching` te paginará para
siempre sin razón; una alarma de período largo evaluada en fronteras de bucket
se _quedará_ en rojo mucho después de que arregles la causa. **La higiene de
alertas es trabajo de observabilidad.**

## 4. Cerrar el ciclo — trazas y post-mortems

El último pilar es el tracing. Cuando una orden se porta mal, no quieres hacer
grep en cinco servicios — quieres la línea de tiempo causal de _esa_ orden a
través de las tareas de Fargate y el bus de eventos. El tracing distribuido
convierte "algo estuvo lento" en "la llamada al broker de esta orden tardó 1.8s
a las 21:30:04".

La instrumentación es también lo que hace que un post-mortem sea **sin culpas y
útil**: reconstruyes lo que pasó con datos, no con memoria. Y ese es el punto de
fondo — la observabilidad es lo que te deja operar un sistema que no puedes
pausar. Un sistema de trading no se detiene para que conectes un debugger.
Producción tampoco.

Si estás mirando un muro de logs sin poder responder "¿está sano?" — esa brecha
es el trabajo. Cerrarla es la mayor parte del oficio.
