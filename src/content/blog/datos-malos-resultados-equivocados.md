---
title: "Los datos malos producen resultados seguros-pero-equivocados en silencio"
description: 'Los datos de mercado malos rara vez rompen nada. Hacen algo peor: alimentan tu backtest con un número creíble que está completamente equivocado. Un día de split parece una caída del 95%, un spin-off una del 71% — y tu estrategia aprende de basura. Aquí va el guard de integridad que lo caza.'
pubDate: 2026-12-15
lang: 'es'
draft: true
tags: ['data', 'calidad-datos', 'backtesting', 'research', 'integridad']
---

Los bugs de datos más aterradores no lanzan excepciones. Una división por cero rompe ruidosamente y la arreglas.
Pero una serie de precios con una falsa caída de un día del 95% no rompe nada — fluye silenciosamente a tu backtest,
tu estrategia "reacciona" a una catástrofe que nunca ocurrió, y sale un resultado seguro, plausible y completamente
equivocado. En [Trinitrade](/es/trinitrade), defenderse de la corrupción silenciosa de datos resultó más importante
que casi cualquier decisión de modelado, porque basura entra no da error — produce basura *creíble* a la salida.

## El modo de fallo: seguro y equivocado

La mayoría de los bugs de ingeniería son ruidosos. Los bugs de calidad de datos son lo contrario: el pipeline corre
en verde, los números parecen razonables, y la conclusión es falsa. Un backtest alimentado con precios corruptos
reportará alegremente un ratio de Sharpe, un drawdown, una curva de equity — todo internamente consistente, todo
derivado de datos que no reflejan la realidad. No puedes notarlo mirando la salida; el trabajo entero de la salida es
parecer creíble.

<figure>
  <img src="/blog/bad-data-confident-wrong/garbage-in-garbage-out.svg" alt="Datos de precios corruptos fluyen por un pipeline verde a un backtest que produce un resultado seguro, plausible pero completamente equivocado, sin error lanzado en ningún sitio" loading="lazy" />
  <figcaption>El modo de fallo — los datos malos no rompen; producen un resultado seguro, creíble y equivocado sin error en ningún sitio.</figcaption>
</figure>

## De dónde viene la corrupción: las acciones corporativas

La fuente clásica no es un error de tecleo del proveedor — es la diferencia entre precios *crudos* y *ajustados*
alrededor de las acciones corporativas. Cuando una acción hace un split 20-por-1, su precio crudo cae ~95% de la
noche a la mañana mientras nada ocurrió económicamente. Si haces backtest con precios crudos, ese split parece una
caída apocalíptica de un solo día. El arreglo es usar precios totalmente ajustados (ajustados por split *y*
dividendo), que retropropagan el ajuste para que la serie sea continua.

<figure>
  <img src="/blog/bad-data-confident-wrong/split-artifact.svg" alt="En un split 20-por-1 el precio crudo cae cerca de un 95 por ciento de la noche a la mañana, pareciendo una caída; los precios totalmente ajustados quitan el artefacto y mantienen la serie continua" loading="lazy" />
  <figcaption>El artefacto de split — los precios crudos muestran una falsa caída del 95% el día del split; el ajuste completo lo quita.</figcaption>
</figure>

Así que usas datos ajustados y estás a salvo — salvo que no del todo.

## El artefacto que el ajuste no arregla

Aquí está la trampa que me mordió. El ajuste completo maneja los splits y dividendos, pero **no** maneja limpiamente
los **spin-offs**. Cuando una empresa escinde una división, parte de su valor se va por la puerta, y la serie
ajustada aún puede mostrar una caída grande de un día con apariencia real que en realidad es una reestructuración
corporativa, no un movimiento de mercado. Un caso conocido aparece como una "pérdida" de un solo día de ~71% que
ninguna cantidad de ajuste estándar quita. Así que incluso con el modo de ajuste correcto, una barra con apariencia
corrupta aún puede colarse.

<figure>
  <img src="/blog/bad-data-confident-wrong/spinoff-artifact.svg" alt="Un spin-off produce una caída grande de un día de alrededor del 71 por ciento que el ajuste completo por split y dividendo no quita, así que una barra con apariencia corrupta aún se cuela" loading="lazy" />
  <figcaption>El artefacto que el ajuste se pierde — un spin-off muestra una caída de un día de ~71% que el ajuste estándar deja dentro.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>No puedes confiar en que la fuente de datos esté limpia, ni siquiera con los ajustes correctos. La defensa es un
  <strong>guard de integridad</strong> barato y burdo: marca cualquier movimiento de un día tan extremo que casi con
  seguridad es un artefacto de datos — un retorno de un día peor que −50% — como <em>un error de datos a investigar,
  no un evento real a operar.</em> Un número casi-imposible es un bug hasta que se demuestre lo contrario.</p>
</aside>

## El guard: marca lo imposible

El guard es deliberadamente simple. Una acción real, individual y líquida esencialmente nunca cae más de un 50% en un
día; un movimiento tan grande es abrumadoramente más probable que sea un artefacto de datos — un split no ajustado,
un spin-off, un fallo del proveedor — que un evento de mercado genuino. Así que el pipeline marca cualquier retorno
de un día por debajo de ese umbral y se niega a alimentarlo silenciosamente a la investigación. Es un detector de
humo, no un cuerpo de bomberos: no arregla los datos, impide que los datos envenenen silenciosamente tus
conclusiones.

<figure>
  <img src="/blog/bad-data-confident-wrong/integrity-guard.svg" alt="Un guard de integridad comprueba cada retorno de un día; cualquier cosa peor que menos 50 por ciento se marca como artefacto de datos probable a investigar en vez de fluir al backtest" loading="lazy" />
  <figcaption>El guard de integridad — cualquier retorno de un día por debajo de −50% se marca como artefacto probable, no se alimenta a la investigación.</figcaption>
</figure>

Hay guards relacionados que vale tener: prefiere un feed de datos consolidado sobre uno gratis con huecos de varios
años, y trata cualquier discontinuidad inexplicable como sospechosa. Pero el guard de −50% de un día es la
comprobación individual de mayor valor, porque caza exactamente la clase de artefacto que se disfraza de catástrofe
operable.

## La lección: valida en la frontera, porque el silencio es el peligro

El principio general es que los bugs más peligrosos son los que no se anuncian. Una caída se arregla; un número
seguro-pero-equivocado se *actúa*. En cualquier sitio donde los datos entren a tu sistema desde fuera — un proveedor
de mercado, una subida de archivo, una API de terceros — deberías validarlos en la frontera contra lo que es
físicamente plausible, porque una vez dentro, cada cómputo aguas abajo los tratará como verdad y los vestirá con un
resultado creíble. Las comprobaciones de cordura baratas y burdas en el borde valen mucho más que el modelado
sofisticado encima de datos que nunca verificaste.

## Referencias y lecturas adicionales

- [Split de acciones](https://es.wikipedia.org/wiki/Split_(burs%C3%A1til)) y [precio de cierre ajustado](https://en.wikipedia.org/wiki/Adjusted_closing_price) — por qué los precios crudos mienten alrededor de las acciones corporativas.
- [Escisión corporativa (spin-off)](https://es.wikipedia.org/wiki/Escisi%C3%B3n_(econom%C3%ADa)) — el artefacto que el ajuste no arregla.
- [Garbage in, garbage out](https://es.wikipedia.org/wiki/Garbage_in,_garbage_out) — el principio subyacente.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el pipeline de research y sus guards de integridad de datos.
- Relacionado: [gotchas de los datos de mercado diarios](/es/blog/gotchas-datos-de-mercado) y [por qué hypertables de TimescaleDB para datos de mercado](/es/blog/timescaledb-hypertables-datos-mercado).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. El guard de integridad de −50%
descrito aquí es real y cazó artefactos reales en datos reales de proveedor. El código fuente saneado vive en el
[caso de estudio](/es/trinitrade) y en el [repositorio público](https://github.com/mizolutions/trinitrade).*
