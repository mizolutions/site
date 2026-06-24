---
title: "La alerta que se disparó pero nunca llegó"
description: 'Tu alarma hizo su trabajo a la perfección — y aun así nunca te enteraste, porque la notificación murió de camino a tu teléfono. Que la alarma se dispare y que la alerta llegue son dos problemas de fiabilidad distintos.'
pubDate: 2026-10-13
lang: 'es'
draft: true
tags: ['sre', 'observabilidad', 'alertas', 'fiabilidad', 'aws']
---

Hay un modo de fallo particularmente cruel en monitoreo: la alarma se dispara, correctamente, exactamente como se
diseñó — y aun así no te enteras, porque la *notificación* nunca llega hasta ti. La condición se detectó. El aviso
se envió. Y en algún punto entre "la alarma se disparó" y "el teléfono de un humano vibra", se desvaneció en
silencio. En [Trinitrade](/es/trinitrade) esto me enseñó a tratar el camino que *entrega* una alerta como un
problema de fiabilidad de primera clase, separado de la alarma en sí.

## "La alarma se disparó" no es el final de la historia

La mayoría se detiene mentalmente en "tengo una alarma para eso". Pero que una alarma se dispare y que una alerta
*llegue* son dos eventos distintos, separados por un pequeño sistema distribuido. En mi caso, el camino era así: una
alarma de CloudWatch publica en un tópico SNS, que dispara una Lambda de fan-out, que llama a Telegram y Discord
para alcanzarme de verdad.

<figure>
  <img src="/blog/the-alert-that-never-arrived/delivery-chain.svg" alt="Una alarma publica en SNS, que dispara una Lambda de fan-out, que llama a Telegram y Discord; cada salto de la cadena es algo distinto que puede fallar" loading="lazy" />
  <figcaption>La cadena de entrega — cada salto entre "alarma disparada" y "teléfono vibra" es un componente distinto que puede fallar.</figcaption>
</figure>

Son cuatro saltos, y **cada uno puede fallar de forma independiente a que la alarma sea correcta.** La alarma es la
parte fácil. Llevar su mensaje hasta un humano es un problema de entrega con sus propios modos de fallo.

## Todas las formas en que una alerta muere en silencio

Ninguna toca la alarma; todas se comen la notificación:

- La **Lambda de fan-out lanza una excepción** — un mal despliegue, un timeout, un caso límite no manejado — y el
  evento se descarta.
- Un **tercero está caído o limitando la tasa.** Telegram o Discord tiene una caída, o has enviado demasiados
  mensajes y empiezan a rechazarlos.
- Una **credencial caducó** — un token de bot se rotó, un webhook se revocó — y la llamada falla con un 401 que
  nadie vigila.
- Un **destino desapareció** — el chat se borró, el canal se archivó, la URL del webhook quedó obsoleta.

<figure>
  <img src="/blog/the-alert-that-never-arrived/silent-drop.svg" alt="La alarma se dispara correctamente, pero un salto fallido de la cadena de entrega como un error de Lambda o un tercero limitado hace que el humano nunca se entere" loading="lazy" />
  <figcaption>La caída silenciosa — la alarma es correcta, un salto aguas abajo falla, y la alerta se evapora sin que nadie lo sepa.</figcaption>
</figure>

La crueldad es que este fallo es **invisible por construcción.** El sistema que debía avisarte de que algo va mal
es justo el sistema que está roto — así que no puede avisarte de que está roto. Te enteras por la vía lenta: notando
el problema que la alerta debía haber cazado, horas después.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Que la alarma se dispare y que la alerta llegue son <strong>dos problemas de fiabilidad distintos</strong>. Una
  alarma perfecta tras un camino de entrega roto no vale absolutamente nada. El notificador no es fontanería que
  puedas ignorar — es un sistema crítico que, cuando falla, falla <em>en silencio</em>.</p>
</aside>

## La solución: tratar el notificador como un sistema crítico

Una vez aceptas que el camino de entrega puede fallar por sí solo, lo proteges como cualquier cosa crítica:

- **Canales redundantes.** Haz fan-out a más de un destino (Telegram *y* Discord, más email) para que una sola
  caída de un tercero no te deje a ciegas.
- **Una cola de mensajes muertos (DLQ).** Cuando la entrega falla, el mensaje aterriza en algún sitio durable en vez
  de desvanecerse, para que puedas ver y reproducir lo que no llegó.
- **Monitorea el notificador en sí.** Pon alarmas sobre los errores y throttles de la Lambda de fan-out — el
  vigilante necesita un vigilante.

<figure>
  <img src="/blog/the-alert-that-never-arrived/the-fix.svg" alt="Canales de entrega redundantes, una cola de mensajes muertos para los fallidos y monitoreo de los errores propios de la Lambda notificadora hacen resiliente el camino de entrega" loading="lazy" />
  <figcaption>Endurece el camino de entrega — redundancia, una DLQ y alarmas sobre los errores propios del notificador.</figcaption>
</figure>

## ¿Quién vigila al vigilante? Un heartbeat

La redundancia y las DLQ ayudan, pero comparten un punto ciego: todas asumen que *algo* nota el fallo. La versión
más profunda de este problema es el silencio — un camino de entrega que lleva muerto una semana, y no lo sabes porque
*ninguna alerta ha necesitado dispararse.* No puedes distinguir "todo sano" de "el sistema de alertas está roto" solo
por ausencia.

La respuesta es un **heartbeat** (latido): una señal diminuta e independiente que fluye por *todo* el camino de
alertas según una agenda y demuestra que funciona de extremo a extremo. Si el heartbeat deja de llegar, el camino de
alertas está caído — detectado por un mecanismo separado y tonto-de-simple que no depende de aquello que comprueba.

<figure>
  <img src="/blog/the-alert-that-never-arrived/heartbeat.svg" alt="Un heartbeat agendado fluye por todo el camino de alertas de extremo a extremo; si deja de llegar, una comprobación separada y simple concluye que el sistema de alertas está roto" loading="lazy" />
  <figcaption>El heartbeat — una señal periódica por todo el camino, para que el silencio se vuelva una señal detectable en vez de un punto ciego.</figcaption>
</figure>

## La lección general: monitorea lo que monitorea

Este es el problema del meta-monitoreo, y aparece en cuanto tu sistema de alertas tiene más de un salto:

- El **busca sin batería** es la versión analógica del mismo bug.
- Un **único canal de notificación** es un punto único de fallo para *todas* las alertas que tienes.
- La **ausencia de alertas es ambigua** — significa "todo sano" *o* "el sistema de alertas está muerto", y solo un
  heartbeat los distingue.

El cambio mental es dejar de pensar en las alertas como la red de seguridad y empezar a verlas como otro sistema de
producción — uno con la peculiaridad de que cuando falla, falla en silencio, y todo su trabajo era ser ruidoso.
Construye el camino que entrega alertas con la misma paranoia con la que construirías el camino que ejecuta una
orden. Y luego construye una cosa pequeña más cuyo único trabajo sea demostrar que ese camino sigue vivo.

## Referencias y lecturas adicionales

- [Amazon SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html) fan-out y [colas de mensajes muertos](https://es.wikipedia.org/wiki/Cola_de_mensajes_no_entregados).
- [Heartbeat (informática)](https://en.wikipedia.org/wiki/Heartbeat_(computing)) — demostrar que un camino está vivo.
- [Punto único de fallo](https://es.wikipedia.org/wiki/Punto_%C3%BAnico_de_fallo) — por qué un solo canal de notificación es arriesgado.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — la arquitectura de alarma y fan-out detrás de esto.
- Relacionado: [que no me paginen a las 3am](/es/blog/que-no-me-paginen-a-las-3am) y [health checks que no mienten](/es/blog/health-checks-que-no-mienten) *(misma serie SRE)*.
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Su fan-out multi-canal y su
heartbeat son reales. El código fuente saneado vive en el [caso de estudio](/es/trinitrade) y en el
[repositorio público](https://github.com/mizolutions/trinitrade).*
