---
title: "Health checks que no mienten: liveness, readiness y la regla de un segundo"
description: 'Un solo endpoint /health es la herramienta equivocada. Por qué confundir liveness y readiness causa tormentas de reinicios y enruta tráfico al vacío — y por qué cada check de dependencia necesita un timeout de 1 segundo.'
pubDate: 2026-09-29
lang: 'es'
draft: true
tags: ['sre', 'observability', 'reliability', 'cloud', 'fastapi']
---

Un health check que miente es peor que no tener health check. Un check en verde que en secreto prueba lo
equivocado le dirá alegremente a tu orquestador "todo bien" mientras las peticiones fallan — o peor, matará una
instancia perfectamente sana porque una dependencia parpadeó un segundo. Aprendí a tomarme en serio los health
endpoints construyendo [Trinitrade](/es/trinitrade), donde una respuesta equivocada tiene un costo en dólares.
Aquí va el diseño que no miente.

## Un solo endpoint `/health` es la herramienta equivocada

El error más común es un solo `/health` que "chequea todo" — el proceso, la base de datos, el cache, el bróker —
y devuelve un único sí/no combinado. Se siente exhaustivo. En realidad son dos preguntas completamente distintas
metidas a la fuerza en una respuesta:

- **Liveness:** *¿Está vivo este proceso?* Si no, la acción correcta es **reiniciarlo**.
- **Readiness:** *¿Puede este proceso servir una petición ahora mismo?* Si no, la acción correcta es **dejar de
  enrutar tráfico** hacia él (pero dejarlo corriendo).

<figure>
  <img src="/blog/health-checks-that-dont-lie/two-questions.svg" alt="Liveness pregunta si el proceso está vivo y su consumidor reinicia ante el fallo; readiness pregunta si puede servir una petición ahora y su consumidor deja de enrutar tráfico ante el fallo" loading="lazy" />
  <figcaption>Dos preguntas distintas con dos consumidores distintos y dos remedios distintos — reiniciar vs. dejar de enrutar.</figcaption>
</figure>

Esos remedios son opuestos. Confundirlos significa que una señal impulsa dos acciones contradictorias, y obtienes
la equivocada en el peor momento.

## Por qué confundirlos causa una tormenta de reinicios

Digamos que tu único `/health` chequea la base de datos, y la plataforma de contenedores lo usa como probe de
**liveness** (el que decide si reiniciar). Ahora la base de datos parpadea unos segundos — un failover, un hipo de
red breve. El `/health` de cada instancia se pone rojo. La plataforma concluye que los procesos están muertos y
**los reinicia todos** — aunque cada proceso estaba perfectamente vivo y se habría recuperado en cuanto la base de
datos volviera.

<figure>
  <img src="/blog/health-checks-that-dont-lie/restart-storm.svg" alt="Un único endpoint de health que chequea la base de datos se usa como probe de liveness; cuando la base de datos parpadea, todas las instancias reportan no-sanas, la plataforma reinicia procesos sanos, causando una tormenta de reinicios" loading="lazy" />
  <figcaption>La tormenta de reinicios — un parpadeo de dependencia se vuelve un reinicio de toda la flota, convirtiendo un hipo de 5 segundos en una caída.</figcaption>
</figure>

Tomaste un parpadeo transitorio de dependencia y lo amplificaste en una caída autoinfligida. Liveness debió decir
"el proceso está bien" (porque lo estaba) y dejar que readiness sacara las instancias de rotación en silencio
hasta que la base de datos volviera.

## La división: liveness superficial, readiness profundo

Así que los separé, siempre:

- **`/health/live`** — sin dependencias. Devuelve `200 {"status": "alive"}` si el proceso corre y puede ejecutar
  código. Nada más. Esto es lo que el contenedor y el balanceador usan para decidir *reiniciar o no*.
- **`/health/ready`** — el check profundo: base de datos, cache, bróker, workers críticos. Esto decide *enrutar
  tráfico o no*. Su resultado se cachea unos segundos para que una ráfaga de probes no machaque tus dependencias.

<figure>
  <img src="/blog/health-checks-that-dont-lie/readiness-flow.svg" alt="El endpoint de readiness chequea base de datos, cache y bróker, cada uno envuelto en un timeout de un segundo, con el resultado combinado cacheado por cinco segundos, devolviendo ready o not-ready" loading="lazy" />
  <figcaption>Readiness — un check profundo de cada dependencia, cada uno con time-box, con el resultado cacheado para que los probes sigan baratos.</figcaption>
</figure>

## La regla de un segundo: un probe nunca debe esperar

Aquí va el detalle que separa un health check robusto de uno peligroso: **cada check de dependencia dentro de
readiness recibe su propio timeout — un segundo es un buen default.** El trabajo de un probe es un *sí/no rápido*,
no "esperar pacientemente a que la base de datos se recupere." Si dejas que un check de dependencia bloquee sin
tope, entonces bajo carga — cuando más necesitas una señal clara — tu probe se cuelga, el probe de la plataforma
da timeout, y la ambigüedad se propaga.

<figure>
  <img src="/blog/health-checks-that-dont-lie/one-second-rule.svg" alt="Cada check de dependencia se envuelve en un timeout de un segundo para que el probe devuelva un sí o no rápido; una espera sin tope colgaría el probe bajo carga y se propagaría" loading="lazy" />
  <figcaption>La regla de un segundo — acota cada check de dependencia para que el probe responda rápido, incluso cuando una dependencia está lenta.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Un health probe responde una pregunta para que un sistema automatizado tome una acción. Haz la pregunta
  <strong>equivocada</strong> (checks profundos en el probe de liveness) y la automatización hace lo equivocado —
  reiniciar instancias sanas. Un probe que puede <em>colgarse</em> no responde nada; acota cada espera, o tu
  sí/no rápido se vuelve un quizás lento.</p>
</aside>

## Los detalles aburridos que te salvan

Algunas prácticas que resultaron importar más de lo que parecen:

- **Mantén un alias retrocompatible cuando renombres rutas.** Mover la ruta de health del balanceador es un cambio
  rolling *y* rompe en silencio cualquier monitor de uptime externo apuntado a la vieja. Aliasear `/health/live` a
  la vieja `/health` no cuesta nada y evita ambos.
- **Valida dos veces: tests unitarios y un `curl` post-deploy.** Los mocks pasan; los caches y timeouts reales
  igual pueden tropezar. Tras el deploy, pega a cada variante y mira el status code *y* el tiempo de respuesta.
- **Ejercita la ruta profunda bajo carga.** Si tu test de carga solo pega al probe superficial, dejarás de notar
  cuando readiness regresione. Añade `/health/ready` a la mezcla con un umbral generoso para que se pruebe pero no
  gatee.

## La lección general: un probe es una pregunta, así que haz la correcta

Nada de esto es específico de un framework. Un health endpoint es una interfaz entre tu servicio y una decisión
automatizada — reiniciar, enrutar, paginar. La disciplina es **emparejar la pregunta con la acción**: liveness
impulsa reinicios, así que debe ser superficial y nunca fallar por una dependencia; readiness impulsa enrutado,
así que chequea dependencias pero nunca bloquea. Y en todas partes donde un probe toca el mundo exterior, **acota
la espera** — porque la única vez que una dependencia está lenta es exactamente cuando necesitas una respuesta
instantánea.

## Referencias y para profundizar

- [Health check](https://en.wikipedia.org/wiki/Health_check) y los [probes de liveness y readiness](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) de Kubernetes.
- [Timeouts](https://en.wikipedia.org/wiki/Timeout_(computing)) y [fallo en cascada](https://en.wikipedia.org/wiki/Cascading_failure) — por qué las esperas sin tope son peligrosas.
- [Balanceo de carga](https://es.wikipedia.org/wiki/Balance_de_carga) y los health checks de los target groups.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el sistema que estos probes protegen.
- Relacionado: [que no me paginen a las 3am por un sistema apagado](/es/blog/que-no-me-paginen-a-las-3am) *(en la misma serie SRE)*.
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Sus health probes separados y
los timeouts de dependencia de 1 segundo son reales. El código sanitizado vive en el [caso de estudio](/es/trinitrade)
y el [repositorio público](https://github.com/mizolutions/trinitrade).*
