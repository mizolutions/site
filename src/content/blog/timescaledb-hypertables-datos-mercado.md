---
title: "Por qué hypertables de TimescaleDB para datos de mercado"
description: 'Los datos de mercado son series temporales, pero también tienen que hacer JOIN limpio con órdenes, posiciones y estrategias. La elección entre Postgres puro, un store NoSQL y TimescaleDB se reduce a una pregunta: ¿quieres una base de datos o dos?'
pubDate: 2026-12-08
lang: 'es'
draft: true
tags: ['data', 'database', 'timescaledb', 'postgres', 'arquitectura']
---

Almacenar datos de mercado parece un problema resuelto hasta que de verdad tienes que consultarlos junto a todo lo
demás. Las barras en sí son series temporales puras — pesadas en escritura, ordenadas por tiempo, siempre
consultadas por un rango de tiempo para un símbolo — pero en el momento en que quieres preguntar "¿cuál era el
precio cuando se ejecutó esta orden?" necesitas que esos datos de series temporales hagan JOIN limpio con tus tablas
relacionales. En [Trinitrade](/es/trinitrade), ese único requisito decidió toda la arquitectura de almacenamiento, y
la respuesta fue TimescaleDB.

## La forma de los datos

Los datos de mercado tienen una forma muy específica. Cada fila es una barra OHLCV — apertura, máximo, mínimo,
cierre, volumen — sellada con un tiempo y un símbolo. Escribes muchas, continuamente, en orden de tiempo. Y casi
nunca lees una sola fila; lees *rangos* — "cada barra de este símbolo en esta ventana" — a menudo submuestreados a
un intervalo más grueso para un gráfico o un backtest.

<figure>
  <img src="/blog/timescaledb-hypertables-market-data/data-shape.svg" alt="Datos de mercado como un flujo de barras OHLCV selladas por tiempo y símbolo, escritas en orden de tiempo y leídas como rangos de tiempo por símbolo, a menudo submuestreadas" loading="lazy" />
  <figcaption>La forma de los datos de mercado — barras OHLCV pesadas en escritura, leídas como rangos de tiempo por símbolo, a menudo submuestreadas.</figcaption>
</figure>

Esa forma grita "base de datos de series temporales". Pero hay una pega que la forma por sí sola no captura: estos
datos no viven aislados. Tienen que relacionarse con órdenes, posiciones, señales y estrategias — todas las cuales
son datos relacionales ordinarios.

## Tres opciones, una pregunta decisiva

Sopesé tres elecciones de almacenamiento, y se alinean a lo largo de un solo eje: cómo de bien manejan las series
temporales *y* cómo de bien se relacionan con el resto del sistema.

- **PostgreSQL puro** se relaciona perfectamente con todo — *es* el store relacional — pero una sola tabla de barras
  en crecimiento continuo se degrada con el tiempo; estarías haciendo a mano el particionado para mantener rápidas
  las inserciones y los escaneos de rango.
- **Un store NoSQL** escala las escrituras de series temporales de maravilla, pero pierdes los JOINs SQL y la
  consistencia transaccional completa. Responder "el precio cuando se ejecutó esta orden" significa unir dos stores
  en código de aplicación, y los escaneos de rango de tiempo se vuelven incómodos.
- **TimescaleDB** es una *extensión* de PostgreSQL: las tablas relacionales se comportan exactamente como Postgres,
  mientras las tablas de series temporales obtienen particionado y submuestreo automáticos. Un motor, ambas cargas.

<figure>
  <img src="/blog/timescaledb-hypertables-market-data/three-options.svg" alt="Postgres puro se relaciona bien pero se degrada con series temporales grandes; NoSQL escala series temporales pero pierde JOINs y ACID; TimescaleDB hace ambos como extensión de Postgres" loading="lazy" />
  <figcaption>Tres opciones en un eje — la pregunta decisiva es si quieres una base de datos o dos sistemas que operar.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>La decisión no fue "qué base de datos es más rápida en series temporales". Fue <strong>"¿quiero una base de
  datos o dos?"</strong> TimescaleDB deja que un sistema operado en solitario mantenga las barras de series
  temporales y las órdenes relacionales en el mismo motor, con JOINs nativos y ACID completo — sin un segundo store
  que correr, respaldar y reconciliar. <em>La simplicidad operativa ganó a la especialización pura.</em></p>
</aside>

## Qué te compra de verdad una hypertable

La característica central es la **hypertable**. Para tus consultas parece una tabla ordinaria, pero por debajo,
TimescaleDB la particiona automáticamente en **chunks** basados en tiempo. Los datos nuevos aterrizan en el chunk
actual; las consultas de un rango de tiempo solo tocan los chunks que se solapan con él. Obtienes el rendimiento del
particionado sin escribir y mantener tú mismo el esquema de particiones — lo que hace doloroso a Postgres puro a
escala sencillamente ocurre solo.

<figure>
  <img src="/blog/timescaledb-hypertables-market-data/hypertable-chunks.svg" alt="Una hypertable parece una tabla pero se divide automáticamente en chunks basados en tiempo; una consulta de rango solo escanea los chunks que se solapan con la ventana pedida" loading="lazy" />
  <figcaption>Una hypertable — una tabla lógica, dividida automáticamente en chunks de tiempo, para que una consulta de rango escanee solo los relevantes.</figcaption>
</figure>

## Continuous aggregates: submuestreo gratis

La segunda característica que se gana su sitio son los **continuous aggregates**. La mayoría de las lecturas de datos
de mercado no son de ticks crudos — son de barras de 5 minutos, horarias o diarias para un gráfico o un backtest. Un
continuous aggregate precomputa esos rollups y los mantiene refrescados automáticamente a medida que llegan datos
crudos nuevos. En vez de reagregar millones de filas en cada carga de gráfico, lees una tabla pequeña y ya
resumida.

<figure>
  <img src="/blog/timescaledb-hypertables-market-data/continuous-aggregates.svg" alt="Barras crudas de datos de mercado alimentan continuous aggregates que autocomputan rollups de 5 minutos, horarios y diarios, para que las lecturas submuestreadas peguen a una tabla pequeña ya resumida" loading="lazy" />
  <figcaption>Continuous aggregates — las barras crudas se enrollan automáticamente en resúmenes de 5m / 1h / 1d, para que las lecturas submuestreadas sean baratas.</figcaption>
</figure>

Y como todo sigue siendo PostgreSQL, consultas cada una de estas con SQL estándar. No hay un segundo lenguaje de
consulta que aprender, ni Flux ni dialecto propio — los mismos JOINs, las mismas funciones de ventana, las mismas
herramientas.

## La lección: elige el almacenamiento para toda la carga, no para una tabla

Es tentador elegir una base de datos para la tabla más difícil — aquí, las barras de alto volumen — y luego atornillar
el resto del sistema alrededor de ella. Eso optimiza una consulta a costa de cada consulta transversal y de un
segundo sistema que operar. La mejor pregunta es qué sirve a *toda* la carga: yo tenía datos de series temporales que
absolutamente tenían que relacionarse con datos relacionales, operados por una persona que no quería correr dos
stores. TimescaleDB respondió eso exactamente — Postgres donde necesitaba relacional, hypertables donde necesitaba
series temporales, un motor que respaldar y sobre el que razonar.

## Referencias y lecturas adicionales

- [Hypertables de TimescaleDB](https://docs.timescale.com/use-timescale/latest/hypertables/) y [continuous aggregates](https://docs.timescale.com/use-timescale/latest/continuous-aggregates/).
- [Particionado de tablas en PostgreSQL](https://www.postgresql.org/docs/current/ddl-partitioning.html) — lo que harías a mano sin ello.
- [Base de datos de series temporales](https://es.wikipedia.org/wiki/Base_de_datos_de_series_temporales) — la categoría general y sus trade-offs.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — la arquitectura de base de datos y el ADR tras esta elección.
- Relacionado: [los datos malos producen resultados seguros-pero-equivocados](/es/blog/datos-malos-resultados-equivocados) y [async SQLAlchemy con asyncpg](/es/blog/async-sqlalchemy-asyncpg-trampas).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. La arquitectura de TimescaleDB
descrita aquí es real. El código fuente saneado vive en el [caso de estudio](/es/trinitrade) y en el
[repositorio público](https://github.com/mizolutions/trinitrade).*
