---
title: "El test de control de $0: cuando un 'edge' de t = 5.7 es solo beta"
description: 'Encontré una señal de trading de cinco sigma y la tiré. Un test de control market-neutral gratis mostró que el "edge" era beta de mercado disfrazada — no alpha cosechable. Esta es la descomposición que me salvó de pagar por él.'
pubDate: 2026-07-21
lang: 'es'
draft: true
tags: ['quant', 'research', 'backtesting', 'statistics', 'engineering-discipline']
---

Una vez encontré una señal de trading con un *t*-statistic de cerca de **5.7** — cinco sigma, positiva en diez de
once años — y la borré. No porque la estadística estuviera mal. Estaba bien. La borré porque un test de control
que costó **$0** mostró que el "edge" era algo que ya podía comprar gratis: exposición al mercado. Esta es la
historia de ese test, y de por qué "¿es estadísticamente real?" y "¿es un edge?" son dos preguntas completamente
distintas.

## Una señal real no es lo mismo que un edge cosechable

Aquí está la trampa que hunde a la gente segura y con credenciales: un *t*-statistic alto te dice que un patrón es
poco probable que sea aleatorio. No te dice **nada** sobre si ese patrón es *tuyo para cosechar* después de
costes, después de cobertura, y después de descontar exposiciones que podrías haber obtenido gratis. Un patrón
puede ser sólido y real y aun así ponerte cero dólares en el bolsillo — porque lo que lo mueve es solo **beta**,
el retorno del propio mercado, con un disfraz ingenioso.

El retorno de toda estrategia se descompone en dos partes: la parte explicada por la exposición al mercado
(**beta** — gratis, la obtienes comprando un fondo indexado) y la parte que sobra (**alpha** — la habilidad real).
Si tu "edge" desaparece en cuanto cubres el mercado, nunca tuviste un edge. Tenías una forma apalancada y
complicada de poseer SPY.

<figure>
  <img src="/blog/zero-cost-control-test/decomposition.svg" alt="El retorno de una estrategia se divide en beta de mercado (gratis, disponible vía un índice) y alpha (habilidad que sobrevive la cobertura); cubre la beta y si no queda nada, era beta, no un edge" loading="lazy" />
  <figcaption>Todo retorno es beta + alpha. Cubre la beta; si no sobrevive nada, solo estabas comprando el mercado.</figcaption>
</figure>

## La señal de cinco sigma que parecía la buena

La señal era el [drift post-anuncio de resultados](https://en.wikipedia.org/wiki/Post%E2%80%93earnings-announcement_drift)
(PEAD): las acciones que saltan con una sorpresa de earnings tienden a seguir derivando en la misma dirección
durante semanas después. Es una de las anomalías más documentadas en finanzas, y en mi test pre-registrado
apareció fuerte y clara — los nombres que saltaron derivaron cerca de **+0.71% más** que los nombres no-evento,
con un *t* de Welch de ~**5.7**, positivo en **diez de once años**.

Para el estándar que aplica la mayoría, eso es un slam dunk. Cinco sigma. A producción. Y aquí está el tentador
siguiente paso: los datos gratis de price-proxy que usé eran burdos, así que la mejora obvia era **pagar ~$30–50
al mes por datos premium de earnings** (magnitudes reales de la sorpresa) y construir la versión "real". Estaba a
punto de sacar la cartera.

## El control que no cuesta nada salvo disciplina

Antes de gastar un centavo, corrí el test más barato y brutal que existe: **cubrir el mercado y ver si sobrevive
algo.** Si el drift es alpha real, una construcción market-neutral o con beta cubierta debería seguir ganando
dinero. Si es solo beta — los nombres post-shock resultando ser de beta alta y subiendo con un mercado al alza —
las versiones cubiertas se quedan planas o negativas.

Construí tres versiones cubiertas independientes del mismo book:

<figure>
  <img src="/blog/zero-cost-control-test/three-hedges.svg" alt="El book PEAD long-only con t=5.7 se reconstruye de tres formas — dollar-neutral long/short, ponderado por inversa de la volatilidad, y long-only con beta cubierta — y las tres dan retornos ajustados por riesgo negativos" loading="lazy" />
  <figcaption>Tres coberturas independientes del mismo book — dollar-neutral, inverse-vol y beta-hedged — las tres salieron negativas.</figcaption>
</figure>

**Cada una fue negativa** (retornos ajustados por riesgo alrededor de −1.0). No débil-positiva. No break-even.
Negativa. En el momento en que quité la exposición al mercado, todo el "edge" no solo se esfumó — se invirtió. Esa
es la firma inconfundible de un resultado que era *todo beta*.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Una señal que sobrevive un test de significancia pero <strong>muere bajo una cobertura</strong> nunca fue
  alpha. El <em>t</em>-stat midió un patrón real; la cobertura midió si ese patrón era algo más que el mercado que
  puedes comprar gratis.</p>
</aside>

## Qué estaba pasando en realidad

El mecanismo, una vez que lo ves, es casi obvio. Las acciones que saltan con una sorpresa de earnings son
desproporcionadamente nombres de **beta alta**. En un mercado generalmente al alza, los nombres de beta alta
suben *más* que el mercado — así que siguen "derivando" hacia arriba tras el evento. Mi filtro de evento no
detectaba una fuerza post-earnings especial; estaba seleccionando en silencio una cesta de acciones de beta alta
y luego llevándose el crédito por el viento de cola del mercado.

<figure>
  <img src="/blog/zero-cost-control-test/mechanism.svg" alt="Las acciones que saltan con una sorpresa de earnings tienden a ser de beta alta, así que suben con el mercado al alza, lo que parece drift post-earnings pero es solo exposición al mercado" loading="lazy" />
  <figcaption>El drift era selección: los nombres post-shock se inclinan a beta alta, así que suben con el mercado — y el mercado se llevó el crédito.</figcaption>
</figure>

El evento de earnings era real. El drift, como *fenómeno estadístico*, era real. Pero ¿la parte que podía
capturar y conservar de verdad, tras neutralizar el mercado? Cero — o peor. Pagar por datos premium me habría
comprado una medición más nítida de una cosa que seguía sin ser un edge.

<figure>
  <img src="/blog/zero-cost-control-test/decision.svg" alt="Antes de pagar unos cincuenta dólares al mes por datos premium, corre un control de costo cero sobre datos que ya tienes; si falla la cobertura, no pagues porque el valor esperado es negativo" loading="lazy" />
  <figcaption>La regla de decisión — corre el control gratis antes de la mejora de pago. Una cobertura fallida = EV negativo; no gastes.</figcaption>
</figure>

## Descompón antes de creer

El principio general es más grande que el trading: **antes de celebrar un "win", descompónlo en las cosas que
podrían explicarlo gratis.** En términos quant, eso es cubrir la beta. En todo lo demás, es controlar por la
explicación aburrida:

- Un dashboard de latencia mejora tras un deploy — pero ¿ayudó el cambio, o **simplemente bajó el tráfico**? Deja
  la carga constante antes de llevarte el crédito.
- Una feature "sube la conversión" — pero ¿fue la feature, o un **pico estacional** que pegó desigual a test y
  control? Eso es [confusión (confounding)](https://es.wikipedia.org/wiki/Variable_de_confusi%C3%B3n), y es el
  mismo bug que confundir beta con alpha.
- Una optimización "duplicó el throughput" — en un benchmark que esta vez resultó caber en caché.

La disciplina es idéntica: encuentra el control más barato que podría desmontar tu resultado, y corre *ese* antes
de creerte la historia halagadora — y desde luego antes de gastar dinero en ella. Un resultado que no puede
sobrevivir a su propio control nunca fue tuyo para conservar.

## Referencias y para profundizar

- [Alpha](https://en.wikipedia.org/wiki/Alpha_(finance)) y [beta](https://en.wikipedia.org/wiki/Beta_(finance)) — la descomposición en el corazón de este post.
- [Modelo CAPM](https://es.wikipedia.org/wiki/Modelo_de_valoraci%C3%B3n_de_activos_financieros) e inversión [market-neutral](https://en.wikipedia.org/wiki/Market_neutral).
- [Post-earnings-announcement drift](https://en.wikipedia.org/wiki/Post%E2%80%93earnings-announcement_drift) — Bernard & Thomas (1989).
- [Variable de confusión](https://es.wikipedia.org/wiki/Variable_de_confusi%C3%B3n) — el mismo error fuera de finanzas.
- [Significancia estadística](https://es.wikipedia.org/wiki/Significaci%C3%B3n_estad%C3%ADstica) vs tamaño del efecto — por qué un *t* grande no es un edge grande.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — donde esta señal tuvo su capstone.
- Posts compañeros: [siete estrategias, sin edge](/es/blog/sin-edge-siete-estrategias), [pre-registro de backtests](/es/blog/pre-registro-backtests) y [sesgo de supervivencia](/es/blog/sesgo-supervivencia-backtest).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. El t-statistic y los resultados
cubiertos aquí son de backtests reales, fechados y pre-registrados. El código sanitizado vive en el
[caso de estudio](/es/trinitrade) y el [repositorio público](https://github.com/mizolutions/trinitrade).*
