---
title: "Los datos malos no rompen tu backtest — te mienten"
description: 'Gotchas de datos en barras diarias de vendor: por qué los feeds gratis tienen huecos, por qué los precios sin ajustar fingen crashes del 95%, por qué incluso los ajustados se saltan los spin-offs, y el guard de integridad de una línea que lo atrapa todo.'
pubDate: 2026-08-11
lang: 'es'
draft: true
tags: ['quant', 'data-quality', 'backtesting', 'data-engineering', 'finance']
---

El problema de datos más peligroso no es el que lanza una excepción. Es el que pasa directo por tu pipeline, corre
un backtest limpio, y te entrega una respuesta preciosa, segura y **completamente equivocada**. En finanzas
sobre todo, los datos malos no rompen — mienten. Y mienten de formas que se ven exactamente como las señales que
estás cazando.

Construyendo el pipeline de datos de [Trinitrade](/es/trinitrade), me topé con todas. Aquí van los gotchas de
barras diarias que envenenan en silencio un backtest, y el guard barato que los atrapa.

<figure>
  <img src="/blog/vendor-daily-bars-gotchas/silent-failure.svg" alt="Una barra mala por un hueco, split o spin-off pasa por el pipeline sin error, el backtest corre bien, y produce un resultado precioso pero equivocado" loading="lazy" />
  <figcaption>El modo de fallo silencioso — sin error, sin crash, solo una respuesta segura y equivocada.</figcaption>
</figure>

## Gotcha 1: los feeds gratis tienen huecos

La primera trampa es el dato más barato. Una fuente gratis popular para acciones de EE. UU. es IEX, pero IEX es un
*único exchange* — solo ve las operaciones que pasan en IEX, que es una pequeña rebanada del volumen total. Corre
un backtest sobre barras gratis de IEX y puedes encontrar **huecos de años**, incluyendo tramos alrededor de 2020
donde el dato que más necesitas simplemente no está.

El arreglo es usar el **SIP** (la cinta consolidada / [Securities Information Processor](https://en.wikipedia.org/wiki/Securities_information_processor)),
que agrega todos los exchanges. Es la diferencia entre "qué se operó en un venue" y "qué pasó de verdad en el
mercado". Si tu vendor ofrece SIP, paga la diferencia (normalmente pequeña); un backtest sobre un feed con huecos
no es conservador, solo está equivocado en una dirección desconocida.

## Gotcha 2: los precios sin ajustar fingen crashes gigantes

La segunda trampa es el **ajuste de precios.** Cuando una empresa hace un split — digamos 20-por-1 — el precio
crudo se divide entre 20 de un día para otro. Si jalas barras **sin ajustar** ("raw"), eso aparece como un
**retorno de −95% en un día**: un crash que nunca ocurrió.

<figure>
  <img src="/blog/vendor-daily-bars-gotchas/split-artifact.svg" alt="Un split 20-por-1 hace que los precios crudos caigan cerca del 95 por ciento en un día, pareciendo un crash, mientras adjustment=all reescala la historia en una serie continua con retornos correctos" loading="lazy" />
  <figcaption>Un split en precios crudos parece un crash del −95%; los precios ajustados mantienen la serie continua.</figcaption>
</figure>

Cualquier cálculo de momentum, volatilidad o drawdown que vea ese −95% reaccionará a una catástrofe que solo fue
un evento contable. El arreglo es pedir barras **ajustadas por split y dividendo** (`adjustment=all` en la API de
Alpaca, "adjusted close" en otros). Esto reescala toda la historia para que los retornos sean continuos a través
del split.

## Gotcha 3: ni los precios ajustados arreglan los spin-offs

Aquí va el que te agarra *después* de que crees haber resuelto los ajustes. `adjustment=all` maneja splits y
dividendos — pero **no** maneja correctamente los **spin-offs**, donde una empresa entrega a los accionistas
acciones de un negocio recién separado. El precio del padre cae por el valor de la pieza escindida, y la mayoría
de los feeds ajustados renderizan eso como un gran retorno negativo de un día que no fue una pérdida en absoluto.

<figure>
  <img src="/blog/vendor-daily-bars-gotchas/spinoff-artifact.svg" alt="adjustment=all arregla splits y dividendos pero no spin-offs; un spin-off puede mostrar un retorno de menos 71 por ciento en un día, como RTX en 2020, que envenena las estadísticas de momentum, volatilidad y drawdown" loading="lazy" />
  <figcaption>Los spin-offs se cuelan incluso por los feeds ajustados — una sola barra puede leer −71%, envenenando cada estadística aguas abajo.</figcaption>
</figure>

Un ejemplo real: en 2020, Raytheon/United Technologies (RTX) escindió Carrier y Otis, y un feed ajustado puede
mostrar cerca de un **retorno de −71% en un día** para esa fecha. Aliméntalo a una estrategia y ve el apocalipsis.
El evento fue plomería corporativa real; el "retorno" de −71% es puro artefacto.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Los datos financieros malos son peligrosos precisamente porque sus artefactos <strong>parecen señales</strong>:
  un split parece un crash, un spin-off parece un colapso. Tu estrategia no puede distinguir un −71% real de uno
  falso — así que <em>tú</em> tienes que hacerlo, antes de que el dato le llegue.</p>
</aside>

## El guard: marca cualquier movimiento imposible de un día

No puedes auditar a mano miles de nombres a lo largo de una década. Así que añadí un **guard de integridad** barato
en la ingesta: **marca cualquier retorno de un día por debajo de −50% como probable artefacto de split/spin-off.**
Un movimiento genuino de −50% en un día en un large-cap es astronómicamente raro; un artefacto de una acción
corporativa es común. El guard pone en cuarentena la barra sospechosa para revisión en vez de dejarla corromper en
silencio el research.

<figure>
  <img src="/blog/vendor-daily-bars-gotchas/integrity-guard.svg" alt="Cada barra diaria se chequea: si el retorno de un día está por debajo de menos 50 por ciento se marca como probable artefacto de split o spin-off y se pone en cuarentena para revisión, si no pasa al pipeline" loading="lazy" />
  <figcaption>El guard de integridad — un umbral barato atrapa los artefactos antes de que lleguen al research.</figcaption>
</figure>

Y uno más, que conecta con el [sesgo de supervivencia](/es/blog/sesgo-supervivencia-backtest): la **membresía de
índice point-in-time, sin sesgo de supervivencia, suele ser dato de pago** (CRSP, Compustat, Norgate, Bloomberg).
La lista gratis de "constituyentes de hoy" es una trampa de calidad de datos por sí misma — codifica el futuro en
tu universo en silencio.

## La versión de ingeniería: valida en la frontera

Nada de esto es específico de finanzas. Es la lección universal de la ingeniería de datos: **nunca confíes en
datos que cruzan la frontera de un sistema.** Los artefactos solo usan disfraces distintos:

- Un **feed upstream malo** (huecos, duplicados, deriva de zona horaria) produce un agregado de aspecto limpio que
  está calladamente equivocado — la misma forma que los huecos de IEX.
- Un **desajuste de unidad o codificación** (centavos vs dólares, UTC vs local, un centinela perdido como `-999`)
  es el gemelo de ingeniería del pico de split sin ajustar.
- El arreglo es el mismo: un **contrato de datos** — checks de rango, de frescura, de schema, aserciones de "este
  valor es físicamente imposible" — que falla ruidosamente en la ingesta en vez de en silencio en el dashboard.

El guard de −50% es solo una aserción que codifica conocimiento de dominio: *esto no puede pasar de verdad, así que
si lo veo, los datos están mal, no el mundo.* Todo pipeline robusto se construye con aserciones así. Basura que
entra no tiene por qué significar basura que sale — pero solo si algo está revisando la basura en la puerta.

## Referencias y para profundizar

- [Securities information processor](https://en.wikipedia.org/wiki/Securities_information_processor) (el SIP / cinta consolidada) vs feeds de un solo venue.
- [Split de acciones](https://es.wikipedia.org/wiki/Split_(acciones)), [escisión corporativa (spin-off)](https://es.wikipedia.org/wiki/Escisi%C3%B3n_(empresa)) y [precio de cierre ajustado](https://en.wikipedia.org/wiki/Adjusted_closing_price).
- [Calidad de datos](https://es.wikipedia.org/wiki/Calidad_de_datos) y [garbage in, garbage out](https://es.wikipedia.org/wiki/GIGO).
- [Sesgo de supervivencia](https://es.wikipedia.org/wiki/Sesgo_de_supervivencia) — la trampa de la membresía point-in-time.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — donde vive este pipeline (y su guard).
- Posts compañeros: [sesgo de supervivencia](/es/blog/sesgo-supervivencia-backtest), [pre-registro](/es/blog/pre-registro-backtests), y [siete estrategias, sin edge](/es/blog/sin-edge-siete-estrategias).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Los gotchas de datos aquí son
reales: me los topé y me protegí de ellos. El código sanitizado vive en el [caso de estudio](/es/trinitrade) y el
[repositorio público](https://github.com/mizolutions/trinitrade).*
