---
title: 'El sesgo de supervivencia es más astuto de lo que crees'
description: 'Una estrategia de momentum transversal pasó todos los tests — hasta que la reconstruí con datos sin sesgo de supervivencia y el edge se esfumó. Guía de campo del sesgo que todos "conocen" y aun así los engaña.'
pubDate: 2026-07-14
lang: 'es'
draft: true
tags: ['quant', 'research', 'backtesting', 'statistics', 'data-quality']
---

En la Segunda Guerra Mundial, el ejército de EE. UU. estudió los agujeros de bala en los aviones que volvían del
combate y propuso reforzar las zonas con más daño. El estadístico **Abraham Wald** señaló el error: solo estaban
mirando los aviones que *regresaban*. Las zonas donde los supervivientes **no** tenían agujeros eran exactamente
donde habían sido alcanzados los aviones perdidos. Blindas donde los datos callan, no donde gritan.

Eso es el sesgo de supervivencia, y es el sesgo más silenciosamente peligroso del research cuantitativo — no
porque sea oscuro (todos "lo conocen"), sino porque en un backtest no parece un error. Parece un universo de
acciones limpio y razonable. Tuve una estrategia de momentum que *pasó todos mis criterios pre-registrados* — y
luego vi cómo el edge se evaporaba en cuanto quité ese único sesgo. Aquí va la historia, y cómo no caer.

<figure>
  <img src="/blog/survivorship-bias-backtest/wald-planes.svg" alt="La idea de Wald: los aviones que regresan muestran agujeros en alas y fuselaje; el arreglo ingenuo blinda los agujeros, el correcto blinda donde los supervivientes no tienen agujeros porque esos aviones no regresaron" loading="lazy" />
  <figcaption>Los aviones de Wald — la lección es mirar lo que los supervivientes no pueden contarte.</figcaption>
</figure>

## Qué es en realidad en un backtest

El sesgo de supervivencia en backtesting suele colarse por el **universo** — la lista de nombres sobre la que
pruebas. El movimiento intuitivo es tomar "el S&P 500" o "el S&P 100" y correr tu regla hacia atrás en la
historia. Pero el índice de *hoy* es una lista de ganadores. Córrelo hacia atrás hasta 2016 y has excluido en
silencio a toda empresa que estaba en el índice entonces pero fue eliminada, adquirida o deslistada desde — y has
sobre-incluido al puñado de nombres que crecieron lo suficiente para seguir ahí.

<figure>
  <img src="/blog/survivorship-bias-backtest/membership.svg" alt="El índice de hoy corrido hacia atrás solo contiene nombres que siguen en el índice hoy; la membresía point-in-time también incluye los nombres que después salieron o se deslistaron" loading="lazy" />
  <figcaption>El índice-de-hoy-hacia-atrás descarta en silencio a los que salieron; la membresía point-in-time los conserva.</figcaption>
</figure>

El sesgo no es uniforme — y eso lo hace traicionero. **Favorece específicamente al momentum.** Una estrategia que
compra ganadores recientes está encantada de encontrar un universo pre-cargado con los mayores ganadores de la
década, porque *ya sabías cuáles sobrevivieron*. El backtest parece habilidad. En realidad es retrospectiva,
horneada en la lista de tickers.

## Mi GO que no sobrevivió al contacto con datos honestos

Estaba probando momentum transversal — mantener el tercil superior de nombres por retorno a 12 meses, rebalanceo
mensual. Sobre un universo amplio del **S&P 100 de hoy**, pasó mi barra pre-registrada: un Sharpe cercano a
**0.97 frente a ~0.89 del SPY pasivo.** Cuatro criterios, todos en verde. Durante un día, tuve el único GO de todo
el programa.

No me fié — precisamente porque el momentum es la estrategia que más favorece el sesgo de supervivencia. Así que
hice lo caro: reconstruí el universo **sin sesgo de supervivencia y point-in-time** — la membresía *real* del S&P
500 tal como estaba en cada fecha histórica de rebalanceo, incluyendo los **235 nombres que después salieron o se
deslistaron**. Unos 736 nombres a lo largo de 2016–2026, con los perdedores de vuelta.

Misma regla. Universo honesto. El resultado:

<figure>
  <img src="/blog/survivorship-bias-backtest/the-flip.svg" alt="En el S&P 100 sesgado de hoy, el Sharpe del momentum es cerca de 0.97, por encima del SPY; reconstruido sobre el S&P 500 point-in-time sin sesgo de supervivencia, el Sharpe cae a cerca de 0.67, por debajo del SPY en 0.89, un NO-GO limpio" loading="lazy" />
  <figcaption>El vuelco — quitar el sesgo convirtió un Sharpe de ~0.97 (GO) en ~0.67 (NO-GO), por debajo del SPY pasivo.</figcaption>
</figure>

El Sharpe cayó de ~0.97 a ~**0.67**, ahora *por debajo* del ~0.89 del SPY. El GO se volvió un NO-GO limpio. Nada
de la estrategia cambió — solo la honestidad de los datos.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>El sesgo de supervivencia no añade ruido — añade un viento de cola <strong>direccional</strong> que apunta
  justo a donde tu estrategia quiere ir. Por eso sobrevive a una prueba de olfato: el resultado sesgado parece
  <em>plausible</em>, incluso impresionante.</p>
</aside>

## Demostrar dónde se escondía el "edge"

Un Sharpe más bajo es sugerente, pero yo quería *localizar* el sesgo. Así que corrí una ablación de ganadores ex-
post: rankear cada nombre por su retorno total de **muestra completa** (ex-post), **quitar los ~10
mega-ganadores**, y re-correr la regla de momentum idéntica sobre lo que queda.

<figure>
  <img src="/blog/survivorship-bias-backtest/ablation.svg" alt="Rankear nombres por retorno de muestra completa, quitar los diez ganadores ex-post, re-correr la regla de momentum, y el edge colapsa por debajo del SPY, probando que vivía en unos pocos nombres" loading="lazy" />
  <figcaption>La ablación — quita los diez mayores ganadores ex-post y el 'edge' colapsa, probando que vivía en un puñado de nombres que un universo sesgado sobre-incluye.</figcaption>
</figure>

El edge colapsó. Toda la ventaja aparente había estado viviendo en unos pocos ganadores enormes que un universo
"índice de hoy" te regala gratis. Quita los nombres que solo supiste incluir *porque ganaron*, y no queda nada.
Esa es la firma del sesgo de supervivencia, hecha visible.

Esto coincidió con lo que una descomposición point-in-time separada ya había predicho — que es la parte
reconfortante del research pre-registrado y con muchos controles: el modo de fallo se anunció antes de que
gastara un dólar de capital real en él.

## Por qué la gente se salta esto (y cómo no)

Los datos honestos de membresía point-in-time sin sesgo de supervivencia son genuinamente difíciles de
conseguir. Saber *qué nombres estaban en el índice en una fecha dada de 2017*, con los que salieron, suele ser un
dataset de pago (CRSP, Compustat, Norgate, Bloomberg). El camino gratis — "los constituyentes de hoy" — está ahí
mismo, y sesga en silencio **hacia arriba** todo backtest de momentum o quality. Así que mucha investigación de
aspecto impresionante es impresionante precisamente porque está sesgada.

Algunas reglas que me mantienen honesto:

- **Trata el universo como un parámetro, y congélalo en tu pre-registro** — incluyendo *cómo* obtuviste la
  membresía point-in-time.
- **Si solo puedes conseguir los constituyentes de hoy, lee un "pasa" como sugerente, nunca decisivo** — el sesgo
  apunta en la dirección favorable.
- **Corre la ablación.** Quita los ganadores ex-post y mira si el edge sobrevive. Es barato y brutal.
- **Vuelve a meter a los perdedores.** Cuando encontré los datos de membresía gratis (una lista point-in-time de
  código abierto más precios de deslistados), lo *primero* que hice fue volver a añadir los 235 que salieron. Ese
  único paso volteó el veredicto.

## La versión de ingeniería del mismo error

No necesitas un backtest para cometer este error. Es la misma forma que:

- **Leer métricas solo de los servidores que siguen vivos.** Tu latencia p99 se ve genial porque las instancias
  que se cayeron dejaron de reportar — estás midiendo a los supervivientes.
- **Aprender solo de los clientes que se quedaron.** Los usuarios que se fueron no llenan tu encuesta; los
  contentos sí.
- **Una suite de tests que solo ejercita el happy path.** Está en verde porque nunca pregunta por las peticiones
  que murieron en el camino.

El arreglo siempre es el mismo: ve a buscar los datos que *no regresaron*. Mira los aviones que no volvieron, los
nombres que se deslistaron, las peticiones que dieron timeout, los usuarios que se fueron. La verdad suele
esconderse en el silencio, no en los supervivientes.

## Referencias y para profundizar

- [Sesgo de supervivencia](https://es.wikipedia.org/wiki/Sesgo_de_supervivencia) — el fenómeno general, con los aviones de Wald.
- [Abraham Wald](https://es.wikipedia.org/wiki/Abraham_Wald) y el Statistical Research Group de la WWII.
- [Look-ahead bias](https://en.wikipedia.org/wiki/Look-ahead_bias) y el caso a favor de los datos point-in-time.
- [Momentum en finanzas](https://en.wikipedia.org/wiki/Momentum_(finance)) — Jegadeesh & Titman (1993), la estrategia más favorecida por este sesgo.
- [El ratio de Sharpe](https://es.wikipedia.org/wiki/Ratio_de_Sharpe) — la vara que cayó de ~0.97 a ~0.67.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — donde ocurrió este GO-a-NO-GO.
- Posts compañeros: [siete estrategias, sin edge](/es/blog/sin-edge-siete-estrategias) y [pre-registro de backtests](/es/blog/pre-registro-backtests).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Las cifras de Sharpe aquí son
de backtests reales, fechados y pre-registrados. El código sanitizado vive en el [caso de estudio](/es/trinitrade)
y el [repositorio público](https://github.com/mizolutions/trinitrade).*
