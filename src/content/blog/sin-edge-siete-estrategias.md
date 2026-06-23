---
title: 'Intenté encontrar un edge de trading — y fallé siete veces. Ese es el punto.'
description: 'Un programa de research pre-registrado y con controles de sesgo no halló edge robusto en siete familias de estrategia. Por qué un negativo limpio es un éxito de método.'
pubDate: 2026-06-30
lang: 'es'
draft: true
tags: ['quant', 'research', 'backtesting', 'engineering-discipline', 'trading']
---

La mayoría de los portfolios de ingeniería te muestran lo que funcionó. Este empieza con lo que **no** funcionó —
a propósito — porque **cómo manejas un resultado negativo dice más de tu criterio que cualquier dashboard en
verde.**

Construí **Trinitrade**, una plataforma de trading algorítmico en vivo, de extremo a extremo como operador único:
Infraestructura como Código, observabilidad, una auditoría a prueba de manipulación, todo el stack de
confiabilidad. Pero la pregunta interesante nunca fue "¿puedo construirlo?". Fue **"¿hay aquí un edge real y
cosechable — o estoy a punto de engañarme a mí mismo?"**

Corrí un programa estructurado para responderlo con honestidad. Probó **siete familias de estrategia distintas.**
Todas y cada una fueron un **NO-GO** frente a simplemente mantener el mercado (SPY pasivo). Y lo más limpio de
todo el proyecto es que puedo *demostrar* que no hice trampa para llegar ahí.

## Por qué "¿funcionó?" es la primera pregunta equivocada

En research de trading, el modo de fallo no es construir lo incorrecto. Es **construir lo correcto y luego
mentirte sobre los resultados.** Los backtests son extraordinariamente buenos para producir edges preciosos y
completamente falsos, porque tienes miles de perillas (universo, lookback, rebalanceo, umbrales) y un solo
dataset contra el cual ajustarlas. Gira suficientes perillas y *algo* parecerá rentable. Eso no es señal — es el
[problema de las comparaciones múltiples](https://es.wikipedia.org/wiki/Comparaciones_m%C3%BAltiples) disfrazado
de buen gráfico.

Así que antes de correr nada, hice las reglas más difíciles de hackear que mi propio optimismo:

- **Pre-registro.** Cada hipótesis — su universo, su regla, sus parámetros y los criterios exactos de
  aprobación/rechazo — quedó **congelada en un commit de git antes de correr el backtest.** El historial de git
  prueba que los criterios se fijaron *a priori*, no que se movieron tras ver el resultado. El universo de
  tickers es en sí mismo un parámetro, así que también se congeló.
- **Una stop-rule pre-comprometida.** Fijé un presupuesto de intentos *antes* de empezar (p. ej. dos "tiros" por
  clase de mecanismo, y una regla a nivel de programa: una racha de NO-GO limpios concluye el programa). No vale
  correr hipótesis hasta que una gane por suerte y entonces cantar victoria.
- **Una barra consciente de las comparaciones múltiples.** Aceptar no era solo "le gana a SPY". Era una batería de
  criterios más controles de sesgo, descontando explícitamente los márgenes finos.

Esta es la parte aburrida. También es el punto entero.

## Las siete familias

A lo largo de dos pistas de research probé siete familias de mecanismo. Aquí está el marcador:

| # | Familia de estrategia | Veredicto vs SPY pasivo |
|---|---|---|
| 1 | Overlay de tendencia (régimen SMA) | NO-GO |
| 2 | Volatility targeting | NO-GO |
| 3 | Dual momentum (rotar a bonos) | NO-GO |
| 4 | Momentum transversal (elegir ganadores) | NO-GO |
| 5 | Momentum cross-asset de series temporales | NO-GO |
| 6 | Reversión a la media / pairs estadísticos | NO-GO |
| 7 | Event-driven (drift post-earnings) | NO-GO |

Las primeras tres son *overlays defensivos* — intentan cronometrar cuándo salir del mercado. Las tres redujeron
el drawdown pero produjeron **cero alpha out-of-sample**: recortar riesgo no es lo mismo que batir al benchmark en
base ajustada por riesgo. Esa distinción tumba a mucha gente. Una estrategia que pierde menos en un crash pero va
por detrás de un simple buy-and-hold a lo largo del ciclo no encontró un edge. Encontró una versión peor del
efectivo.

Dos de las siete merecen contarse como historias propias, porque son donde la disciplina realmente se ganó el
sueldo.

## El "edge" que en realidad era sesgo de supervivencia

La familia #4, momentum transversal (mantener a los ganadores recientes), fue la más prometedora. En un universo
amplio *pasó* mis criterios — un Sharpe cómodamente por encima de SPY. Durante un día, tuve un GO.

Entonces hice la pregunta incómoda: **¿ese edge era real, o un artefacto de qué nombres dejé entrar al
universo?** La membresía del índice de hoy está contaminada por la retrospectiva. Una lista de "los large caps de
hoy" corrida hacia atrás hasta 2016 sobre-incluye en silencio el puñado de acciones que se volvieron enormes —
exactamente los nombres que ama una estrategia de momentum. Eso es sesgo de supervivencia, y favorece al momentum
en particular.

Así que reconstruí el test sobre un universo **survivorship-free, point-in-time**: la membresía real del índice
tal como era en cada fecha histórica, incluyendo los nombres que después salieron o fueron deslistados. Misma
regla, universo honesto.

El Sharpe se desplomó por debajo de SPY. El GO se volvió un **NO-GO** limpio. El "edge" había estado viviendo en
unos pocos mega-ganadores ex-post que un universo ingenuo sobre-incluía. Quitar el sesgo quitó el alpha — que es
exactamente lo que un test de descomposición separado había predicho.

## El test de control de $0 que mató un t = 5.7

La familia #7, drift post-anuncio de resultados, dio la única *señal* genuinamente real de todo el programa. Los
nombres que saltaban tras una sorpresa de earnings seguían derivando en la misma dirección después —
estadísticamente, por un margen con un **t-statistic cercano a 5.7**, positivo en diez de once años. Para los
estándares que usa la mayoría, eso es un slam dunk. "Cinco sigma. A producción."

No lo mandé a producción. Corrí un control que no cuesta nada salvo disciplina: **hedgear el mercado.** Si el
drift es *alpha* real, debería sobrevivir a una construcción market-neutral o con beta cubierta. Si es solo
*beta* — los nombres post-shock resultando ser de beta alta y subiendo con el mercado — la versión hedgeada se
queda plana o negativa.

Todas las versiones hedgeadas salieron **negativas.** El drift de t = 5.7 era beta de mercado disfrazada, no
alpha cosechable. La señal era real; el *edge* no. Un diagnóstico gratis sobre datos que ya tenía me salvó de
pagar un feed de datos premium para perseguir un espejismo.

> Este es el juego entero. Un t-stat alto te dice que un patrón es poco probable que sea aleatorio. No te dice
> **nada** sobre si el patrón es *tuyo para cosechar* después de costes y cobertura. Confundir ambos es como la
> gente segura y con credenciales pierde dinero.

## Concluir es una característica, no un fracaso

Cuando se agotó el presupuesto de la stop-rule, escribí una decisión capstone: **el programa concluye. SPY pasivo
es el benchmark honesto.** Sin re-tunear un perdedor hasta volverlo ganador, sin abrir una octava familia con la
esperanza de un golpe de suerte.

Ese último movimiento es el que la mayoría no puede hacer. Hay una presión enorme — sobre todo cuando ya
construiste toda la infraestructura — por seguir torciendo perillas hasta que el backtest sonría.
**Pre-comprometerse a una stop-rule, y luego honrarla, es lo que separa el research de la racionalización.** Un
negativo limpio y bien documentado es un éxito de método.

## Por qué le debería importar a quien contrata

Podrías preguntar, con razón, qué tiene que ver un programa fallido de research de trading con operar sistemas en
producción. Para mí es el mismo músculo:

- La disciplina que **congela una hipótesis en git antes del run** es la que **escribe el plan de rollback antes
  del deploy.**
- El instinto de **desconfiar de un precioso t = 5.7** es el de **desconfiar de una suite de tests en verde que
  prueba lo que no es.**
- La voluntad de **parar según la evidencia y documentar el negativo** es la voluntad de **decir "este enfoque no
  está funcionando" en un design review** en vez de mandar "probablemente está bien" a producción.

Medir con honestidad y parar según la evidencia es la habilidad senior. La infraestructura fue la parte fácil. No
engañarme a mí mismo fue la parte difícil — y es de la que estoy más orgulloso.

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Cada número aquí es trazable a
un Architecture Decision Record fechado. El código sanitizado y la arquitectura viven en el
[caso de estudio](/es/trinitrade) y el [repositorio público](https://github.com/mizolutions/trinitrade).*
