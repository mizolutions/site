---
title: "Envío idempotente de órdenes sin un lock distribuido"
description: 'Enviar la misma orden dos veces significa una posición doble y dinero real perdido. La respuesta de manual es un lock distribuido entre réplicas. La respuesta más simple, para un sistema de un solo usuario, es correr una réplica a propósito — y dejar que un lock en-proceso haga el trabajo.'
pubDate: 2026-12-29
lang: 'es'
draft: true
tags: ['data', 'concurrencia', 'arquitectura', 'fiabilidad', 'diseño']
---

Hay una operación en un sistema de trading que absolutamente no puedes equivocar: enviar una orden. Si la misma señal
de algún modo produce dos órdenes, has abierto una posición doble y perdido dinero real por un bug de software. Hacer
el envío de órdenes **idempotente** — el mismo intento produciendo exactamente una orden, sin importar cuántas veces
se dispare — es innegociable. En [Trinitrade](/es/trinitrade), lo resolví no con el lock distribuido de manual, sino
eligiendo, deliberadamente, correr una sola réplica.

## El peligro: una señal, dos órdenes

El peligro es concreto. Una estrategia emite una señal; algo hace que el camino de envío corra dos veces — un
reintento, un evento duplicado, dos caminos de código concurrentes. Sin protección, obtienes dos órdenes para una
decisión: el doble del tamaño previsto, el doble del riesgo, una pérdida financiera inmediata y real. Esto no es un
bug cosmético; es del tipo que aparece en un extracto de bróker.

<figure>
  <img src="/blog/idempotent-order-submission/the-hazard.svg" alt="Una señal de trading dispara el camino de envío dos veces, produciendo dos órdenes, una posición doble y una pérdida financiera real" loading="lazy" />
  <figcaption>El peligro — una señal, dos envíos, una posición doble y dinero real perdido.</figcaption>
</figure>

## La respuesta de manual, y su coste

El instinto estándar de alta disponibilidad es correr varias réplicas de la aplicación tras un balanceador, para que
si una muere las demás sigan. Pero en el momento en que tienes varias réplicas, dos de ellas pueden intentar enviar
la misma orden al mismo tiempo, y un lock en-proceso no puede ayudar — cada proceso tiene el suyo. Ahora necesitas un
**lock distribuido** (típicamente respaldado por algo como Redis) para serializar el envío entre todas las réplicas.
Ese es un patrón real y funcional — pero añade una dependencia externa, una nueva superficie de fallo, y un montón de
casos límite sobre qué pasa cuando el propio store del lock es inalcanzable.

<figure>
  <img src="/blog/idempotent-order-submission/distributed-lock.svg" alt="Múltiples réplicas tras un balanceador requieren un lock distribuido respaldado por un store externo para serializar el envío de órdenes, añadiendo una dependencia y una nueva superficie de fallo" loading="lazy" />
  <figcaption>La respuesta de manual — N réplicas necesitan un lock distribuido y un store externo, con todos los modos de fallo que eso trae.</figcaption>
</figure>

## La elección deliberada: una réplica

Aquí está la decisión de diseño que lo hizo todo más simple: **correr una sola réplica a propósito.** Con exactamente
un proceso manejando los envíos, no necesitas un lock distribuido en absoluto — un lock en-proceso serializa todo,
porque solo hay un proceso que serializar. La clase entera de problema de "dos réplicas compiten por la misma orden"
desaparece por construcción.

Este es un trade-off genuino, hecho conscientemente. Renuncias a la disponibilidad que obtendrías de N réplicas. Pero
para un sistema de un solo usuario que ya escala a cero por las noches y fines de semana, esa disponibilidad nunca
valió mucho — y la historia de corrección que ganas a cambio es dramáticamente más simple. La arquitectura correcta
no es la que tiene más nueves; es aquella cuyos modos de fallo de verdad puedes razonar.

<figure>
  <img src="/blog/idempotent-order-submission/single-replica.svg" alt="Correr una sola réplica significa que un lock en-proceso es suficiente para serializar el envío de órdenes, eliminando la necesidad de un lock distribuido y su dependencia externa" loading="lazy" />
  <figcaption>La elección deliberada — una réplica hace suficiente un lock en-proceso, y el problema entero del lock distribuido se desvanece.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>No siempre necesitas un lock distribuido — a veces necesitas <strong>no tener un sistema distribuido</strong>.
  Elegir una sola réplica a propósito es una decisión arquitectónica legítima que cambia disponibilidad que no
  necesitas por corrección con la que no puedes transigir. <em>El bug de concurrencia más simple de arreglar es el
  que diseñaste fuera de la existencia.</em></p>
</aside>

## Cinturón y tirantes: el lock, la clave y un fallback seguro

Dentro del único proceso, la sección crítica es "comprueba si esta orden ya se envió, luego envía" — la misma forma
de read-modify-write que necesita serializarse. Un lock en-proceso la envuelve para que solo un envío corra a la vez.
Dos cosas más la hacen robusta:

- Una **clave de idempotencia** enviada al bróker (un id de orden único del lado del cliente) significa que aunque una
  petición se reintente a nivel de red, el propio bróker reconoce el duplicado y no abrirá una segunda posición.
- Un **fallback a prueba de fallos**: el código está escrito de modo que si *alguna vez* introduces un lock
  distribuido para un futuro mundo multi-réplica, y ese store del lock es inalcanzable, cae de vuelta al lock
  en-proceso en vez de bloquear todo el trading. Degradar a "aún correcto en una réplica" gana a "rechaza cada orden
  porque el store del lock parpadeó".

<figure>
  <img src="/blog/idempotent-order-submission/belt-and-suspenders.svg" alt="Un lock en-proceso serializa la sección comprobar-luego-enviar, una clave de idempotencia hace que el bróker rechace duplicados, y un fallback mantiene el trading correcto en una réplica si un store de lock distribuido es inalcanzable" loading="lazy" />
  <figcaption>Cinturón y tirantes — lock en-proceso, clave de idempotencia en el bróker, y un fallback que se mantiene correcto en una réplica.</figcaption>
</figure>

## La lección: la escala es una elección, no un default

El reflejo de echar mano de réplicas y coordinación distribuida está tan arraigado que correr un proceso puede sentir
como cortar una esquina. No lo es — es reconocer que los sistemas distribuidos son caros en complejidad, y que esa
complejidad solo vale la pena pagarla cuando de verdad necesitas lo que compra. Para un sistema operado en solitario
donde un breve hueco de reinicio es aceptable y la carga es la de un usuario, una sola réplica con un lock en-proceso
no es una limitación; es el diseño que te deja estar *seguro* de que nunca enviarás una orden dos veces. Ajusta la
arquitectura al requisito real, y a veces la respuesta más robusta es también la más pequeña.

## Referencias y lecturas adicionales

- [Idempotencia](https://es.wikipedia.org/wiki/Idempotencia) y [claves de idempotencia](https://stripe.com/docs/api/idempotent_requests) para reintentos seguros.
- [Locks distribuidos](https://redis.io/docs/latest/develop/use/patterns/distributed-locks/) — lo que evitas al no distribuir.
- [Punto único de fallo](https://es.wikipedia.org/wiki/Punto_%C3%BAnico_de_fallo) — el trade-off que aceptas, hecho explícito.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el camino de envío de órdenes y su diseño de locking.
- Relacionado: [logs de auditoría a prueba de manipulación con un hash-chain](/es/blog/auditoria-hash-chain) y [nunca despliegues un servicio con estado fuera de horario](/es/blog/nunca-despliegues-stateful-fuera-de-horario).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. El diseño de réplica única y el
lock de envío en-proceso descritos aquí son reales. El código fuente saneado vive en el
[caso de estudio](/es/trinitrade) y en el [repositorio público](https://github.com/mizolutions/trinitrade).*
