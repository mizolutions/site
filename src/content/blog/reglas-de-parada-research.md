---
title: 'Stop-rules: por qué concluir un programa de research es un éxito'
description: 'La parte más difícil de un programa de research no es un modelo — es escribir la frase "paramos ahora". Una stop-rule pre-comprometida es lo que impide que el trabajo pre-registrado se vuelva p-hacking en silencio.'
pubDate: 2026-07-28
lang: 'es'
draft: true
tags: ['quant', 'research', 'engineering-discipline', 'statistics', 'decision-making']
---

Lo más difícil que escribí durante un programa de research de meses no fue un modelo ni un evaluador. Fue una
frase: **"El programa concluye. SPY pasivo es el benchmark honesto."** Elegir parar — sin edge encontrado, tras
construir toda la infraestructura para encontrarlo — es la disciplina de la que casi nadie habla, y es la que hace
confiable todo otro resultado.

[Pre-registré cada hipótesis](/es/blog/pre-registro-backtests) antes de correrla. Pero el pre-registro solo no
basta, porque la tentación de hacer trampa no vive dentro de un solo test. Vive a nivel de **programa** — en la
decisión de cuántos tests correr, y cuándo parar.

## Pre-registro sin stop-rule sigue siendo p-hacking

Imagina que pre-registro cada hipótesis a la perfección — universo, regla, criterios, todo congelado en git antes
del run. Limpio. Ahora corro la hipótesis #1: NO-GO. #2: NO-GO. #3, #4, #5… y simplemente sigo abriendo nuevas
hasta que una por fin pasa la barra. Entonces publico *esa*.

Cada test individual fue honesto. El **programa** no. Correr hipótesis pre-registradas indefinidamente hasta que
una pase por suerte es solo el [problema de las comparaciones múltiples](https://es.wikipedia.org/wiki/Comparaciones_m%C3%BAltiples)
con papeleo extra. Es la [falacia del francotirador de Texas](https://es.wikipedia.org/wiki/Falacia_del_francotirador_de_Texas):
dispara suficientes tiros y siempre podrás dibujar la diana alrededor de un grupo después.

<figure>
  <img src="/blog/stop-rules-research/loop-vs-stoprule.svg" alt="Sin stop-rule, sigues abriendo nuevas hipótesis pre-registradas hasta que una pasa por suerte y declaras un edge; con una stop-rule pre-comprometida, fijas el presupuesto de intentos antes de empezar y concluyes cuando se agota" loading="lazy" />
  <figcaption>La diferencia es el presupuesto — fijado antes de empezar, no descubierto cuando el gráfico por fin sonríe.</figcaption>
</figure>

## La solución: comprometerse a un presupuesto antes de empezar

Una stop-rule es un presupuesto de intentos que fijas **antes de correr nada** — y luego honras. La mía tenía dos
niveles:

- **Por clase de mecanismo:** a lo sumo dos tiros (el segundo solo si el primero fue inconcluso, nunca un
  re-tune), juzgados contra los mismos criterios congelados.
- **A nivel de programa:** si las primeras clases de mecanismo volvían todas NO-GO, el programa se pausa y escribo
  una decisión capstone — en vez de engendrar clase tras clase esperando un golpe de suerte.

<figure>
  <img src="/blog/stop-rules-research/structure.svg" alt="Antes del programa, congela el presupuesto; por clase de mecanismo permite dos tiros contra los mismos criterios; una regla de programa dice que varias clases NO-GO disparan una pausa y una decisión capstone" loading="lazy" />
  <figcaption>La estructura — un presupuesto por clase, y una regla a nivel de programa que convierte una racha de NO-GO en una conclusión deliberada.</figcaption>
</figure>

Así fue exactamente como ocurrió. A lo largo de dos pistas, siete familias de mecanismo volvieron NO-GO, la
stop-rule de programa se disparó, y concluí con una decisión capstone escrita. **No** abrí una octava familia. El
movimiento honesto y el movimiento pre-comprometido fueron el mismo — que es el punto entero de comprometerse por
adelantado.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Una stop-rule mueve la decisión de abandonar del <strong>final</strong> (cuando estás emocionalmente
  involucrado y los datos están frente a ti) al <strong>principio</strong> (cuando aún eres honesto). No estás
  decidiendo si parar — ya lo decidiste. Solo lo estás <em>honrando</em>.</p>
</aside>

## Por qué la barra tiene que contar el número de intentos

Hay una razón estadística para que el presupuesto importe. Corre un test a p &lt; 0.05 y un falso positivo es
improbable. Corre veinte y esperas que *cerca de uno* parezca "significativo" puramente por azar. Así que solo hay
dos respuestas honestas a correr muchos intentos: **subir la barra** (corrige tu umbral por el número de
comparaciones), o **limitar los intentos** (una stop-rule). No hagas ninguna, y "encontré algo en 30 backtests" no
significa casi nada.

<figure>
  <img src="/blog/stop-rules-research/rising-bar.svg" alt="Un intento a p menor que 0.05 significa algo; veinte intentos dan cerca de un resultado significativo por azar; los dos arreglos honestos son subir la barra o limitar los intentos" loading="lazy" />
  <figcaption>Más intentos, más golpes de suerte. O subes la barra o limitas los intentos — una stop-rule es el límite.</figcaption>
</figure>

## El enemigo real es el costo hundido

La razón por la que las stop-rules son difíciles no tiene nada que ver con estadística. Es que para cuando ya
construiste el pipeline de datos, el evaluador, todo el aparato, *abandonar se siente como desperdicio.* La
[falacia del costo hundido](https://es.wikipedia.org/wiki/Falacia_del_costo_hundido) susurra: ya llegaste hasta
aquí, solo una hipótesis más. Ese susurro es exactamente cómo un programa disciplinado se convierte en una marcha
lenta hacia un resultado manufacturado.

<figure>
  <img src="/blog/stop-rules-research/sunk-cost.svg" alt="Tras construir toda la infraestructura, el tirón del costo hundido dice solo una hipótesis más; la emoción lleva a un GO manufacturado, mientras honrar el pre-compromiso lleva a un NO-GO confiable" loading="lazy" />
  <figcaption>El costo hundido te tira hacia 'un intento más.' El pre-compromiso es lo que lo anula.</figcaption>
</figure>

Pre-comprometerte a la stop-rule es como le ganas a tu yo futuro e involucrado. Y la recompensa es que el
**resultado negativo se vuelve un activo.** Un NO-GO limpio y bien documentado no es un programa desperdiciado —
es conocimiento reutilizable: me dice (y a cualquiera que lea la decisión) exactamente qué se probó, cómo, y por
qué no funcionó, para que nadie re-corra el mismo callejón sin salida. Concluir con un capstone fechado es un
entregable, no una derrota.

## El mismo coraje en ingeniería

Si has corrido un spike de ingeniería, ya conoces las stop-rules — o te ha quemado su ausencia:

- **Ponerle time-box a un spike** con criterios de muerte ("investigamos esto una semana; si no pasa la barra, lo
  soltamos") es una stop-rule contra la ingeniería de costo hundido.
- **Declarar un proyecto terminado — o muerto** — en vez de dejarlo cojear consumiendo atención para siempre.
- Decir **"este enfoque no está funcionando"** en un design review, en voz alta, cuando todos (tú incluido) han
  invertido esfuerzo en él.

La habilidad es idéntica en ambos mundos: decide tu condición de salida *antes* de estar emocionalmente
comprometido, escríbela, y luego ten la disciplina de honrarla cuando llegue el momento. Saber cuándo parar — y
poder demostrar que paraste por una razón de principio, no por capricho — es una habilidad senior. Un negativo
limpio, concluido a propósito, es un éxito de método.

## Referencias y para profundizar

- [El problema de las comparaciones múltiples](https://es.wikipedia.org/wiki/Comparaciones_m%C3%BAltiples) — por qué correr más tests exige una barra más alta.
- [Falacia del francotirador de Texas](https://es.wikipedia.org/wiki/Falacia_del_francotirador_de_Texas) — dibujar la diana después de disparar.
- [Falacia del costo hundido](https://es.wikipedia.org/wiki/Falacia_del_costo_hundido) — la razón real por la que las stop-rules son difíciles.
- [Pre-registro](https://en.wikipedia.org/wiki/Preregistration_(science)) — la disciplina que completa una stop-rule.
- [Sesgo de publicación](https://es.wikipedia.org/wiki/Sesgo_de_publicaci%C3%B3n) — por qué importa reportar los negativos.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — donde el programa concluyó.
- Posts compañeros: [siete estrategias, sin edge](/es/blog/sin-edge-siete-estrategias), [pre-registro](/es/blog/pre-registro-backtests), [sesgo de supervivencia](/es/blog/sesgo-supervivencia-backtest), y [el test de control de $0](/es/blog/test-de-control-gratis).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. La stop-rule y el capstone
descritos aquí fueron decisiones reales y fechadas. El código sanitizado vive en el [caso de estudio](/es/trinitrade)
y el [repositorio público](https://github.com/mizolutions/trinitrade).*
