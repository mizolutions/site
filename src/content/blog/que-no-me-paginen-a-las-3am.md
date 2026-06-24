---
title: "Que no me paginen a las 3 a.m. por un sistema apagado a propósito"
description: 'La forma más rápida de que on-call ignore las alertas es paginarlo por no-problemas. Cómo las alarmas compuestas y el gating fuera-de-horario evitan que un sistema apagado a propósito grite "que viene el lobo" cada noche.'
pubDate: 2026-10-06
lang: 'es'
draft: true
tags: ['sre', 'observability', 'alerting', 'cloud', 'aws']
---

Hay una forma confiable de destruir un sistema de alertas: paginar a un humano por cosas que no son problemas.
Hazlo lo suficiente y silenciará el canal, y entonces la *única* alerta que importaba pasa sin leerse. En
[Trinitrade](/es/trinitrade), mi mayor fuente de pages falsos no era un servicio inestable — era el sistema
estando **apagado a propósito** y una alarma insistiendo en que eso era una emergencia.

## El setup: un sistema que se supone debe estar apagado

Para mantener el coste casi en cero, Trinitrade se apaga por completo fuera de horario de mercado — noches y fines
de semana, la base de datos se detiene y el servicio se escala a cero. Esa es la mayor palanca de coste para un
sistema que solo necesita correr de lunes a viernes.

También es un campo minado para alarmas ingenuas. ¿"El conteo de tasks corriendo es cero"? Cada noche. ¿"Sin
peticiones en la última hora"? Cada noche. ¿"Sin build exitoso recientemente"? Cada fin de semana. Cada una de
estas alarmas es *técnicamente correcta* y *completamente inútil* — el sistema está sano; solo duerme, exactamente
como se diseñó.

<figure>
  <img src="/blog/dont-page-me-at-3am/false-page.svg" alt="Una alarma ingenua que vigila el conteo de tasks corriendo se dispara cada noche porque el sistema se escala a cero por diseño, produciendo un page por un no-problema" loading="lazy" />
  <figcaption>El page falso — una alarma ingenua de "task count = 0" se dispara cada noche en un sistema apagado por diseño.</figcaption>
</figure>

## El costo real: la fatiga de alertas

Un page falso no es gratis, aunque nada se haya roto. Cada vez que una alarma grita "que viene el lobo," te enseña
un poco más que *esta alarma no significa nada.* Tras una semana de pages nocturnos, tu cerebro aprendió a
descartarlo de un vistazo — y ese reflejo no se apaga educadamente la noche en que es un fallo real.

<figure>
  <img src="/blog/dont-page-me-at-3am/alert-fatigue.svg" alt="Una alarma que se dispara cada noche entrena a on-call para silenciarla, así que cuando ocurre un fallo real el page se ignora junto con todos los falsos" loading="lazy" />
  <figcaption>Fatiga de alertas — grita "que viene el lobo" cada noche y te entrenas para ignorar la noche en que el lobo es real.</figcaption>
</figure>

Una alarma que se dispara cuando nada está mal es peor que ninguna alarma, porque erosiona activamente tu
confianza en las que sí importan.

## Arreglo 1: alarmas compuestas — exige que dos cosas sean verdad

El error central es alarmar sobre un *síntoma* sin chequear el *contexto.* "El conteo de tasks es cero" solo es un
problema si el sistema **se supone que debe estar corriendo.** Así que en vez de paginar sobre el síntoma crudo,
lo combino con una condición que captura la intención: una **alarma compuesta** que se dispara solo cuando el
síntoma es malo **y** el sistema debería estar encendido.

<figure>
  <img src="/blog/dont-page-me-at-3am/composite-alarm.svg" alt="Una alarma compuesta pagina solo cuando el síntoma es malo Y el sistema debería estar corriendo; si el sistema está apagado intencionalmente, la compuesta se queda callada" loading="lazy" />
  <figcaption>La alarma compuesta — paginar solo cuando el síntoma es malo Y el sistema se supone que está arriba.</figcaption>
</figure>

Ahora "task count cero a las 3 a.m." resuelve a "esperado, quédate callada," mientras "task count cero a las 11
a.m. de un martes" resuelve a "eso está mal, págame." Mismo síntoma, significado opuesto, decidido por el
contexto.

## Arreglo 2: gatea el paginado, no deshabilites la alarma

El atajo tentador es simplemente *deshabilitar* la alarma de noche. No lo hagas. Si la deshabilitas, también te
ciegas a problemas fuera-de-horario que *sí* te importan (un backup que debería correr a las 2 a.m., un job
agendado que falló). El movimiento correcto es **gatear el paginado por la ventana ON** — la alarma sigue
evaluando, pero el enrutado hacia un humano se suprime cuando el sistema está apagado a propósito.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>El trabajo de una alarma es dispararse cuando algo está <strong>mal</strong>, no cuando algo es
  <em>distinto</em>. "Apagado" no está mal si lo apagaste a propósito. Codifica la <em>intención</em> — la ventana
  ON — en la alarma, para que la misma métrica se lea como "esperado" o "emergencia" según si el sistema debería
  estar corriendo.</p>
</aside>

<figure>
  <img src="/blog/dont-page-me-at-3am/off-hours-gating.svg" alt="Durante la ventana ON un síntoma malo pagina a un humano, mientras durante la ventana OFF el mismo síntoma es esperado y el page se suprime, pero la alarma sigue evaluando" loading="lazy" />
  <figcaption>Gating fuera-de-horario — suprime el page cuando el sistema está apagado a propósito, pero sigue evaluando para que los fallos reales fuera-de-horario igual salgan a flote.</figcaption>
</figure>

## La lección general: alarma sobre lo que está mal, no sobre lo que es distinto

Esta es una instancia de la regla más vieja del buen alerting: **cada page debe ser accionable.** Si la respuesta
a una alerta es "sí, eso es esperado, descártalo," la alerta está mal calibrada — está midiendo un *estado*, no un
*problema*. La disciplina es empujar la *intención* a la alarma:

- Alarma sobre el **síntoma que daña a los usuarios** (o, aquí, que significa que el sistema no puede operar), no
  sobre la métrica cruda.
- Codifica los **estados esperados** — ventanas de mantenimiento, schedules de scale-to-zero, downtime planeado —
  para que la alarma sepa la diferencia entre "apagado" y "roto."
- Sigue evaluando durante esas ventanas; solo **gatea a quién se despierta.**

Proteger la atención de un humano es una preocupación de confiabilidad, no un lujo. Un ingeniero on-call que
confía en cada page es más rápido y más calmado que uno que aprendió a dudar de ellos. La forma más barata de
ganar esa confianza es nunca gastarla en un page de las 3 a.m. sobre un sistema que está exactamente donde lo
dejaste: apagado.

## Referencias y para profundizar

- [Fatiga de alarmas](https://en.wikipedia.org/wiki/Alarm_fatigue) — el costo humano de gritar "que viene el lobo."
- [Alarmas compuestas de Amazon CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Create_Composite_Alarm.html) — combinar condiciones.
- El libro SRE de Google sobre [alerting práctico](https://sre.google/sre-book/practical-alerting/) — cada page debe ser accionable.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el scheduler de coste y el diseño de alarmas detrás de esto.
- Relacionado: [health checks que no mienten](/es/blog/health-checks-que-no-mienten) y [la alerta que se disparó pero nunca llegó](/es/blog/la-alerta-que-nunca-llego) *(misma serie SRE)*.
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Sus alarmas compuestas y
gateadas fuera-de-horario son reales. El código sanitizado vive en el [caso de estudio](/es/trinitrade) y el
[repositorio público](https://github.com/mizolutions/trinitrade).*
