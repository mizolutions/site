---
title: 'Deuda en cascada: cuando un pipeline rojo esconde ocho problemas'
description: 'Un pipeline de CI que lleva semanas en rojo no es un bug — es una pila de bugs escondidos detrás del primero. Por qué fail-fast oculta la deuda aguas abajo, y cómo sacar todo el backlog de una vez en vez de un PR doloroso a la vez.'
pubDate: 2026-09-15
lang: 'es'
draft: true
tags: ['devops', 'ci-cd', 'engineering-discipline', 'technical-debt']
---

Un pipeline de CI que lleva semanas en rojo parece un problema. Casi nunca lo es. Es una **pila** de problemas,
prolijamente escondidos detrás del primero — y en el momento en que arreglas ese primer fallo, el pipeline revela
el siguiente, y el siguiente. Reactivé un job de CI muerto hacía tiempo en [Trinitrade](/es/trinitrade) esperando
un arreglo rápido y en su lugar pelé **ocho capas** de deuda acumulada, un PR a la vez. Aquí va por qué pasa y
cómo evitar la versión lenta.

## Fail-fast esconde todo lo que está aguas abajo

Los pipelines de CI suelen ser **fail-fast**: el primer paso que falla detiene la corrida, y los pasos posteriores
nunca se ejecutan. Ese es el default correcto — ahorra tiempo y da una señal clara. Pero tiene un efecto
secundario que pega fuerte cuando un pipeline lleva roto un tiempo: **si el paso 1 lleva semanas fallando, los
pasos 2 a N tampoco han corrido en semanas** — así que cualquier deuda que se acumuló en ellos es completamente
invisible.

<figure>
  <img src="/blog/ci-cascade-debt/fail-fast-hides.svg" alt="Un pipeline fail-fast se detiene en el primer paso que falla, así que todos los pasos posteriores nunca corren y su deuda acumulada queda invisible" loading="lazy" />
  <figcaption>Fail-fast se detiene en el primer fallo — así que todo lo que está aguas abajo lleva pudriéndose en silencio, sin verse.</figcaption>
</figure>

En mi caso, la causa original fue externa: una caída del runner de CI puso el pipeline en rojo. Mientras estuvo
caído, el desarrollo normal siguió avanzando — código nuevo, dependencias nuevas, tests nuevos — nada de eso
validado nunca, porque el pipeline que habría atrapado la deriva estaba atascado en el paso uno.

## El incidente: ocho capas, descubiertas una a una

Cuando el runner volvió, arreglé el fallo obvio y re-corrí. ¿Verde? No — solo llegó *más lejos* antes de fallar de
nuevo. Cada arreglo revelaba el siguiente problema enterrado:

<figure>
  <img src="/blog/ci-cascade-debt/serial-discovery.svg" alt="Arreglar el primer paso que falla revela el segundo, arreglar ese revela el tercero, y así por una escalera de ocho arreglos separados cada uno requiriendo su propio PR y corrida" loading="lazy" />
  <figcaption>Descubrimiento serial — cada arreglo es un ciclo completo de PR-y-corrida que solo te compra el derecho a ver el siguiente fallo.</figcaption>
</figure>

Un linter en un directorio, luego el mismo linter en otro, luego un formateador, luego una auditoría de
dependencias, luego un paso de instalación faltante, luego errores de *colección* de tests, luego unas regresiones
de tests reales que habían entrado mientras nadie miraba. Ocho arreglos distintos, cada uno en su propio pull
request — y crucialmente, **no podía ver el arreglo #8 hasta haber enviado del #1 al #7,** porque cada paso en
verde era lo único que dejaba correr al siguiente.

Esa es la trampa: no los ocho problemas en sí, sino descubrirlos **en serie**, pagando un ciclo completo de
review-y-corrida por cada capa solo para desbloquear la siguiente.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Un pipeline mucho-tiempo-en-rojo no es "una cosa que arreglar" — es una <strong>profundidad desconocida</strong>
  de deuda. Fail-fast te dice el primer problema y esconde la cuenta. Trata la reactivación como una
  <em>auditoría</em>, no como un arreglo rápido.</p>
</aside>

## El arreglo: saca todo el backlog antes de arreglar nada

La marcha serial es evitable. Antes de abrir el *primer* PR de limpieza, **corre cada paso del pipeline
localmente, en orden, y no te detengas en el primer fallo.** Deja que cada paso falle, anótalo, y pasa al
siguiente. En diez minutos obtienes el backlog entero en vez de descubrirlo a lo largo de ocho viajes redondos.

<figure>
  <img src="/blog/ci-cascade-debt/run-all-locally.svg" alt="Correr cada paso de CI localmente en orden sin detenerse en el primer fallo junta los ocho fallos en un solo backlog que puedes planear y arreglar como un lote" loading="lazy" />
  <figcaption>El arreglo — corre todos los pasos localmente, junta cada fallo, y planea la limpieza como un solo lote en vez de una escalera.</figcaption>
</figure>

Con la lista completa en mano, puedes planear deliberadamente: un PR por *tipo* de arreglo, en un orden sensato,
con un estimado preciso — en vez de decirle a tu reviewer "debería ser el último" por cuarta vez. Conviertes una
excavación abierta en una pieza de trabajo conocida y acotada.

## La lección general: un gate mucho-tiempo-en-rojo es una auditoría, no un bug

Este patrón vive donde sea que un gate fail-fast haya estado evitado o roto un tiempo:

- **Re-activar un check deshabilitado** (una regla de linter, un type checker, un scan de seguridad) que estuvo
  apagado lo suficiente como para que se apilaran las violaciones detrás.
- **Des-saltar una suite de tests en cuarentena** que estuvo `@skip`-eada por meses mientras el código que protege
  derivaba.
- **Arreglar un build que estuvo roto en un branch** al que nadie mergeó en semanas.

<figure>
  <img src="/blog/ci-cascade-debt/audit-not-bug.svg" alt="Un gate mucho-tiempo-en-rojo no es un bug que arreglar sino una profundidad desconocida de deuda, así que la reactivación debe tratarse como una auditoría" loading="lazy" />
  <figcaption>Re-enmarca — un gate mucho-tiempo-en-rojo es profundidad, no un bug. La reactivación es una auditoría.</figcaption>
</figure>

En todos los casos, el instinto de "solo arreglar el único error" es la trampa. El primer movimiento honesto es
**medir la profundidad**: corre todo, ve cada fallo de una vez, y trata la limpieza como el proyecto de varios
pasos que realmente es. Una señal roja que lleva mucho tiempo en rojo no te está hablando de un bug — te está
diciendo que dejó de poder advertirte de todo lo que vino después.

## Referencias y para profundizar

- [Fail-fast](https://en.wikipedia.org/wiki/Fail-fast) — el diseño que da una señal clara y esconde la profundidad.
- [Deuda técnica](https://es.wikipedia.org/wiki/Deuda_t%C3%A9cnica) y la [teoría de las ventanas rotas](https://es.wikipedia.org/wiki/Teor%C3%ADa_de_las_ventanas_rotas) aplicada a un codebase.
- [Integración continua](https://es.wikipedia.org/wiki/Integraci%C3%B3n_continua) — por qué mantener el pipeline verde continuamente es el punto entero.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el pipeline de CI/CD donde pasó esto.
- Relacionado: [CodeBuild corre en dash, no en bash](/es/blog/codebuild-corre-en-dash-no-bash) y [CI sin llaves con OIDC](/es/blog/ci-sin-llaves-con-oidc).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Esta limpieza fue una secuencia
real y fechada de pull requests. El código sanitizado vive en el [caso de estudio](/es/trinitrade) y el
[repositorio público](https://github.com/mizolutions/trinitrade).*
