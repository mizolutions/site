---
title: "Trampas de las alarmas de CloudWatch que aprendí a las malas"
description: 'Una alarma que se dispara para siempre, un stream de métrica silenciosamente vacío, una expresión SEARCH rechazada y un detector mensual imposible de construir. Cinco trampas de las alarmas de CloudWatch y cómo evitar cada una.'
pubDate: 2026-11-03
lang: 'es'
draft: true
tags: ['sre', 'observabilidad', 'cloudwatch', 'aws', 'alertas']
---

Las alarmas de CloudWatch parecen simples: eliges una métrica, eliges un umbral, te paginan. Pero esa superficie
simple esconde un conjunto de trampas que cada una me costó tiempo real de depuración en
[Trinitrade](/es/trinitrade) — alarmas que se disparaban para siempre, streams silenciosamente vacíos, expresiones
rechazadas al desplegar y un detector que era sencillamente imposible de construir tal como lo diseñé. Aquí van
cinco que no volveré a cometer.

## Trampa 1: una lista de dimensiones vacía no es "cualquier dimensión"

El primer instinto, cuando quieres una alarma que se dispare "si esta métrica cruza el umbral para *cualquier* valor
de una dimensión", es dejar la lista de dimensiones vacía. Eso **no** es lo que significa una lista de dimensiones
vacía. Una alarma sin dimensiones apunta al **stream agregado del namespace** — un stream aparte que está vacío a
menos que publiques explícitamente un datapoint sin dimensiones en él.

<figure>
  <img src="/blog/cloudwatch-alarm-pitfalls/empty-dimensions.svg" alt="Una alarma con lista de dimensiones vacía lee el stream agregado del namespace, que sigue vacío a menos que el código publique explícitamente un datapoint sin dimensiones, no 'cualquier dimensión'" loading="lazy" />
  <figcaption>Una lista de dimensiones vacía lee el stream agregado — que sigue vacío a menos que dual-emitas un datapoint sin dimensiones.</figcaption>
</figure>

La solución es **dual-emitir** desde tu código: publica la métrica una vez con sus dimensiones (para dashboards
por-cosa) y una vez sin dimensiones (para que la alarma agregada la lea). El stream sin dimensiones no se llena solo.

## Trampa 2: "tratar lo ausente como brecha" sobre un stream vacío paga al minuto uno

Esta se compone con la primera. Si creas una alarma con `TreatMissingData = breaching` apuntada a un stream que
nunca ha recibido un datapoint, la alarma va a **ALARM al minuto uno y se queda ahí para siempre** — no hay datos,
los datos ausentes se tratan como brecha, así que está en brecha. La despliegas y paga de inmediato por una
condición que no es real.

<figure>
  <img src="/blog/cloudwatch-alarm-pitfalls/treat-missing-breaching.svg" alt="Una alarma con tratar-ausente-como-brecha apuntada a un stream de métrica nunca publicado va a ALARM de inmediato y se queda ahí, porque los datos ausentes se tratan como brecha" loading="lazy" />
  <figcaption>Tratar-ausente-como-brecha sobre un stream vacío — ALARM falsa instantánea y permanente, porque la ausencia se lee como brecha.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>"0 datapoints" casi nunca significa "la alarma está rota" — normalmente significa que la alarma lee el
  <strong>stream equivocado</strong>, o que el productor nunca publicó. Valida siempre una alarma nueva emitiendo a
  propósito una métrica de sonda tras desplegar. <em>No confíes en una alarma que no has visto transicionar con
  datos reales.</em></p>
</aside>

## Trampa 3: las alarmas de métrica no soportan expresiones SEARCH

Cuando quieres "alarma si *cualquier* dimensión activa rompe", la herramienta de aspecto elegante es una expresión
`SEARCH`. Funciona en dashboards. Funciona en alarmas compuestas. **No** funciona en una alarma de métrica plana —
el despliegue falla con `SEARCH is not supported on Metric Alarms`. Y `cdk synth` no lo caza; es un rechazo del lado
del servicio que solo ves al crear.

<figure>
  <img src="/blog/cloudwatch-alarm-pitfalls/search-not-supported.svg" alt="Una expresión SEARCH funciona en dashboards y alarmas compuestas pero la rechazan las alarmas de métrica plana al desplegar, no la caza la síntesis de plantilla" loading="lazy" />
  <figcaption>SEARCH funciona en dashboards y alarmas compuestas, pero una alarma de métrica la rechaza — y solo al desplegar, no en synth.</figcaption>
</figure>

El apaño es el mismo truco de dual-emit de la trampa 1: emite un datapoint dimensionado *y* uno agregado sin
dimensiones, y alarma sobre el agregado. Reemplazas una expresión ingeniosa por una aburrida métrica extra, y de
hecho funciona.

## Trampa 4: el período de la alarma debe ser al menos la cadencia del productor

Si una métrica se produce una vez al día — digamos un batch nocturno que emite una métrica de éxito en una agenda
`cron` — una alarma con una ventana de evaluación de 30 minutos parpadeará a ALARM durante las ~23 horas al día en
que no existe un datapoint fresco. El **período de la alarma tiene que ser al menos tan largo como el intervalo
entre datapoints**, con margen. Para un productor de una-vez-por-día-hábil, eso significa una ventana de más de 24
horas, no de 30 minutos.

<figure>
  <img src="/blog/cloudwatch-alarm-pitfalls/period-vs-cadence.svg" alt="Un productor de una vez al día con una ventana de alarma de 30 minutos parpadea a ALARM la mayor parte del día; el período debe ser al menos la cadencia del productor más margen" loading="lazy" />
  <figcaption>Período vs cadencia — una ventana corta sobre un productor lento parpadea; dimensiona el período al intervalo de producción más margen.</figcaption>
</figure>

Una sorpresa relacionada: las alarmas de período largo se reevalúan solo en los límites de período, no cada minuto.
Tras arreglar un productor roto, una alarma de varias horas puede quedarse en su estado viejo hasta que el bucket
actual se complete — así que no esperes que una alarma stale se limpie en el instante en que arreglas lo que vigila.

## Trampa 5: un detector mensual es imposible como una sola alarma de métrica

Esta es la que se ve bien en dry-run y luego hace rollback en el primer despliegue real. CloudWatch tiene un límite
duro: para alarmas con un período de una hora o más, **`EvaluationPeriods × Period` no puede exceder una semana**.
Así que un detector stale de "ninguna ejecución exitosa en 35 días" — una sola alarma con período de 35 días — falla
al crear con `Metrics cannot be checked across more than a week`. La síntesis de plantilla no lo caza; es un límite
del lado del servicio.

Un detector stale de cadencia mensual sencillamente no puede ser una sola alarma de métrica. Lo rediseñas — una
pequeña función agendada que consulta la edad de la última ejecución y emite una métrica diaria de "edad", y luego
alarmas sobre *esa* — en vez de intentar ensanchar la ventana más allá de lo que el servicio permite.

## El hilo que atraviesa las cinco

Cada una de estas es la misma lección de fondo: **una alarma es un pequeño programa con bordes afilados, y un
despliegue verde no es una alarma que funciona.** Que la plantilla sintetice, que el stack despliegue, incluso que la
alarma exista — nada de eso prueba que se disparará correctamente con datos reales. Lo único que lo prueba es verla
transicionar: emite una sonda, rómpela a propósito, arréglala y confirma que se limpia. Trata cada alarma nueva como
no verificada hasta que la hayas visto ponerse roja y verde con datos que produjiste tú mismo.

## Referencias y lecturas adicionales

- [Alarmas de CloudWatch y datos ausentes](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html#alarms-and-missing-data) — la semántica de `treatMissingData`.
- [Usar metric math](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/using-metric-math.html) y [alarmas compuestas](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Create_Composite_Alarm.html) — donde encaja SEARCH.
- [Publicar métricas personalizadas](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/publishingMetrics.html) — dimensiones y el patrón dual-emit.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — la topología de alarmas de donde salieron estas lecciones.
- Relacionado: [SLOs para un sistema que solo tú operas](/es/blog/slos-para-sistema-solo-operador) y [que no me paginen a las 3am](/es/blog/que-no-me-paginen-a-las-3am) *(misma serie SRE)*.
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Cada trampa aquí es una que
realmente pisé y arreglé. El código fuente saneado vive en el [caso de estudio](/es/trinitrade) y en el
[repositorio público](https://github.com/mizolutions/trinitrade).*
