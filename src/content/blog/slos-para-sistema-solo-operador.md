---
title: "SLOs para un sistema que solo tú operas"
description: 'Los objetivos de nivel de servicio no son solo ceremonia empresarial. Incluso para un sistema con exactamente un operador y un usuario, un puñado de objetivos medibles convierte el "parece que va bien" en una herramienta de decisión para desplegar, alertar e invertir.'
pubDate: 2026-10-27
lang: 'es'
draft: true
tags: ['sre', 'observabilidad', 'slo', 'fiabilidad', 'aws']
---

"SLOs" suena a algo que una organización grande con guardia rotativa y un equipo de fiabilidad inventa para rendirse
cuentas. Así que cuando operas un sistema en solitario — un ingeniero, un usuario, tú en ambos extremos — es
tentador saltárselos. En [Trinitrade](/es/trinitrade) los escribí igualmente, y resultaron ser uno de los documentos
de mayor apalancamiento de todo el proyecto: no un contrato de cumplimiento, sino una **herramienta de decisión**.

## Para qué sirve de verdad un SLO (cuando eres el único)

Un objetivo de nivel de servicio es solo una definición medible de "el sistema está sano". Para un operador solo,
esa definición hace tres trabajos concretos:

- **Decide si un cambio puede salir.** "¿Esto regresa la latencia p95 más allá del objetivo?" es una pregunta de
  sí/no solo si has escrito el objetivo.
- **Calibra tus alarmas.** Los umbrales deben relacionarse con el objetivo, no salir de la nada.
- **Justifica la inversión.** "¿Merece la pena construir alta disponibilidad?" solo se responde contra un objetivo
  de disponibilidad declarado.

<figure>
  <img src="/blog/slos-solo-operator/slo-decision-tool.svg" alt="Un SLO alimenta tres decisiones: si un cambio puede salir, cómo calibrar las alarmas y si invertir en alta disponibilidad" loading="lazy" />
  <figcaption>Un SLO es una herramienta de decisión — controla los despliegues, calibra las alarmas y justifica (o no) la inversión.</figcaption>
</figure>

Sin estos objetivos operas por intuición: "parece bastante rápido", "parece que está arriba". La intuición no
sobrevive a un incidente a las 2 a.m. ni a un momento de "¿debería desplegar esto?". Un número sí.

## La anatomía de un SLO

Cada uno de los míos es un registro pequeño y completo. No basta con decir "la latencia debería ser baja"; el SLO
solo es útil si lleva todo lo que necesitas para actuar sobre él:

- **La métrica fuente** — qué se mide exactamente y dónde (p. ej. el tiempo de respuesta del balanceador para
  endpoints de lectura).
- **El objetivo** — un número duro con una ventana (p95 < 300 ms en 5 minutos).
- **El valor observado** — lo que el sistema realmente hace hoy, medido bajo carga, para que conozcas tu margen.
- **La alarma** — qué alerta vigila esto, y a qué umbral.
- **El plan de acción** — la lista ordenada que ejecutas *cuando* hay brecha, escrita con calma de antemano.

<figure>
  <img src="/blog/slos-solo-operator/slo-anatomy.svg" alt="Cada SLO lleva cinco partes: métrica fuente, objetivo con ventana, valor observado, alarma asociada y un plan de acción escrito para cuando hay brecha" loading="lazy" />
  <figcaption>La anatomía de un SLO — cinco partes, para que una brecha se convierta en una lista en vez de un pánico.</figcaption>
</figure>

Esa última parte es la que la gente se salta, y es la más valiosa a las 2 a.m.: una lista pre-escrita de "si la
latencia rompe, revisa CPU, luego el pool de conexiones, luego los despliegues recientes" significa que estás
ejecutando un plan, no improvisando bajo estrés.

## El truco: el umbral de tu alarma *no* es tu SLO

Esto es lo más útil que aprendí escribiéndolos. El instinto natural es alarmar en el objetivo del SLO — si el
objetivo es p95 < 300 ms, alarma a 300 ms. Eso te da un busca chillón y ruidoso, porque los sistemas reales rozan
sus objetivos constantemente bajo el jitter normal (pausas de GC, un blip de la base de datos, un evento de
autoescalado).

En cambio, **fija el umbral de la alarma deliberadamente por encima del objetivo del SLO.** Mi objetivo de latencia
de lectura es p95 < 300 ms; la alarma se dispara a 1000 ms. La alarma significa "el SLO se ha violado *con margen* —
esto es real, despierta". Para el SLO en tiempo real miras el dashboard, no el correo.

<figure>
  <img src="/blog/slos-solo-operator/slo-vs-alarm.svg" alt="La línea base sana está muy por debajo del objetivo del SLO; el umbral de la alarma se fija por encima del objetivo para que solo se dispare en una brecha real y sostenida, mientras el dashboard sigue el SLO en tiempo real" loading="lazy" />
  <figcaption>Tres líneas distintas — base, objetivo del SLO y un umbral de alarma más alto — para que el busca se dispare en brechas reales y el dashboard siga el SLO.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>El umbral de la alarma y el objetivo del SLO son <strong>números distintos a propósito</strong>. El SLO es lo
  que prometes; la alarma es la línea pasada la cual una brecha es innegable. Igualarlos convierte cada pizca de
  jitter normal en un aviso. <em>Vigila el SLO en un dashboard; pagina solo a un margen pasado el objetivo.</em></p>
</aside>

## Elige objetivos desde tu línea base, no desde tus deseos

Un objetivo sacado del aire es inútil — demasiado ajustado y rompes constantemente, demasiado holgado y nunca te
protege. La forma honesta es medir el sistema bajo carga primero, y luego fijar el objetivo como un múltiplo de la
línea base. El mío salió de una campaña de carga deliberada: la p95 de lectura observada fue 53 ms, así que un
objetivo de 300 ms da unas seis veces de margen — lo bastante ajustado para cazar una regresión real, lo bastante
holgado para ignorar el ruido normal.

Esto también te da un **presupuesto de error**: si tu objetivo de disponibilidad es 99.5%, te has permitido
explícitamente una pequeña cantidad de caída al mes. Ese presupuesto es permiso — es cómo decides que *puedes* tomar
una ventana de mantenimiento o desplegar un cambio arriesgado, porque has cuantificado cuánta falta de fiabilidad
puedes permitirte.

<figure>
  <img src="/blog/slos-solo-operator/error-budget.svg" alt="Un objetivo de disponibilidad del 99.5 por ciento define un presupuesto de error de caída permitida al mes, que se gasta en ventanas de mantenimiento y despliegues arriesgados" loading="lazy" />
  <figcaption>El presupuesto de error — un objetivo por debajo del 100% es una característica, no un fallo; es la caída que tienes permiso de gastar.</figcaption>
</figure>

## La lección: escribe el número, aunque tu audiencia sea de uno

La objeción a los SLOs para un sistema solo es "ya sabré si va lento". No lo sabrás, de forma fiable — no bajo
estrés, no al decidir si desplegar, no meses después cuando hayas olvidado cómo se sentía lo "normal". Escribir una
docena de objetivos medibles, cada uno con su métrica, su margen, su alarma y su plan de acción, convierte un montón
de intuición en algo sobre lo que puedes razonar, calibrar y entregar a una versión futura de ti mismo que ha
olvidado todo el contexto. Eso vale la pena incluso cuando la única persona a la que rindes cuentas eres tú.

## Referencias y lecturas adicionales

- El [libro de SRE de Google sobre SLOs](https://sre.google/sre-book/service-level-objectives/) y los [presupuestos de error](https://sre.google/workbook/error-budget-policy/) — el tratamiento canónico.
- [Latencia por percentiles](https://es.wikipedia.org/wiki/Percentil) — por qué p95/p99, no promedios.
- [Alarmas de Amazon CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html) — donde viven los umbrales.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el documento de SLOs y la campaña de carga detrás de esto.
- Relacionado: [un muro de incidentes tipo semáforo en Grafana](/es/blog/muro-de-incidentes-grafana-coste-cero) y [health checks que no mienten](/es/blog/health-checks-que-no-mienten) *(misma serie SRE)*.
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Los SLOs y la campaña de carga
que los calibró son reales. El código fuente saneado vive en el [caso de estudio](/es/trinitrade) y en el
[repositorio público](https://github.com/mizolutions/trinitrade).*
