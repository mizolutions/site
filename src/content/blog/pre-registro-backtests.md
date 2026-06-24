---
title: 'Pre-registro de backtests: cómo no engañarte a ti mismo'
description: 'A un backtest siempre se le puede sacar una confesión. Congelar la hipótesis en git antes de correrla es la defensa más barata contra el autoengaño.'
pubDate: 2026-07-07
lang: 'es'
draft: true
tags: ['quant', 'research', 'backtesting', 'engineering-discipline', 'statistics']
---

Hay un secreto sucio en el research cuantitativo: **dale suficientes oportunidades a un backtest y confesará lo
que sea.** Universo, lookback, frecuencia de rebalanceo, umbral de entrada, umbral de salida — cada uno es una
perilla, y tienes una sola historia contra la cual ajustarlas. Gira suficientes perillas y *algo* parecerá una
máquina de imprimir dinero. No será un edge. Será tu propio optimismo, lavado a través de un gráfico.

Corrí un programa de research estructurado sobre **Trinitrade**, mi plataforma de trading en vivo, precisamente
para *no* caer en eso. La herramienta más importante no fue un modelo sofisticado ni un dataset exótico. Fue una
disciplina prestada de la ciencia: el **pre-registro** — escribir exactamente qué iba a probar, y qué contaría
como éxito, **antes de correr nada.** Este post va de por qué funciona y cómo hacerlo en concreto.

## El problema: demasiados caminos que se bifurcan

El modo de fallo tiene nombre. Los estadísticos lo llaman el [problema de las comparaciones múltiples](https://es.wikipedia.org/wiki/Comparaciones_m%C3%BAltiples);
Andrew Gelman lo llama el *jardín de los caminos que se bifurcan*. La idea es simple: si tomas suficientes
decisiones de análisis *después* de ver los datos, casi siempre puedes encontrar un resultado que parezca
"significativo" — incluso en puro ruido.

<figure>
  <img src="/blog/pre-registration-backtests/forking-paths.svg" alt="Un árbol de decisiones de análisis — universo, lookback, rebalanceo, umbrales — que se ramifica en miles de caminos, uno de los cuales parece rentable por azar" loading="lazy" />
  <figcaption>El jardín de los caminos que se bifurcan — con suficientes decisiones post-hoc, al menos una configuración parece rentable por puro azar.</figcaption>
</figure>

Lo peligroso es que esto no se siente como hacer trampa. No estás fabricando datos. Estás "explorando." Pruebas un
lookback de 200 días, está meh; pruebas 100, mejora; cambias el universo, añades un filtro de volatilidad — y en
algún punto la curva de equity te devuelve la sonrisa. Paras, y te dices que *encontraste* algo. Lo que en
realidad hiciste fue correr decenas de tests de hipótesis silenciosos y reportar solo al ganador. Eso no es
señal; es un efecto de selección.

## La solución: congelar la hipótesis antes del run

El pre-registro rompe el bucle **fijando cada grado de libertad por adelantado.** Antes de que corra un solo
backtest, escribo la hipótesis — completa — y la commiteo a git. El timestamp del commit es la prueba: los
criterios existían *antes* de que viera el resultado, así que no pude haberlos movido después.

<figure>
  <img src="/blog/pre-registration-backtests/prereg-vs-phack.svg" alt="Dos flujos: un bucle de p-hacking que corre, ajusta una perilla y repite hasta que se ve bien; frente al pre-registro que congela la hipótesis en git, corre una vez y aplica criterios pre-fijados" loading="lazy" />
  <figcaption>El p-hacking es un bucle del que sales cuando el gráfico se ve bien. El pre-registro es una línea recta: congelar, correr una vez, juzgar contra criterios fijos.</figcaption>
</figure>

En concreto, el documento congelado fija cinco cosas — y **el universo es una de ellas**, porque *qué nombres
dejas entrar al test* es en sí mismo un parámetro (y una fuente notoria de [sesgo de supervivencia](https://es.wikipedia.org/wiki/Sesgo_de_supervivencia)):

<figure>
  <img src="/blog/pre-registration-backtests/what-gets-frozen.svg" alt="Un commit de git fechado que fija el universo, la regla, los parámetros, los criterios de aceptación y el mapeo de veredicto GO/NO-GO" loading="lazy" />
  <figcaption>Qué se congela — los cinco en un commit fechado, antes de cualquier run.</figcaption>
</figure>

Aquí va un pre-registro representativo del programa — escrito y commiteado *antes* de que el backtest existiera:

```yaml
# EDGE-H00X.md — congelado 2026-06-13, commit a1b2c3d (ANTES de cualquier run)
hipotesis: momentum transversal le gana a SPY pasivo, neto de costes
universo: miembros del S&P 100, lista congelada    # un parámetro — fijado a propósito
regla: mantener el tercil superior por retorno 12m, equal-weight, rebalanceo mensual
params: { lookback_dias: 252, rebalanceo_dias: 21, fraccion_top: 0.333, costes_bps: 20 }
aceptacion:
  C1: Sharpe(estrategia) > Sharpe(SPY)             # ajustado por riesgo, neto
  C2: spread ganadores-menos-perdedores > 0        # el mecanismo realmente paga
  C3: retorno en exceso positivo en >= 3 de 4 ventanas out-of-sample
  C4: sobrevive walk-forward (sin espiar in-sample)
veredicto:
  GO:    C1 y C2 y C3 y C4
  NO-GO: falla C1 o falla C3
presupuesto: 2 tiros para esta clase de mecanismo; si ambos fallan -> concluir
```

Una vez commiteado, el backtest es casi un anticlímax. Lo corro **una vez**, leo los criterios y escribo el
veredicto — GO o NO-GO. Nada de "déjame probar un lookback más." El resultado es lo que diga la regla
pre-registrada.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>El pre-registro no te hace tener <em>razón</em> — te hace ser <strong>honesto</strong>. Convierte un vago "encontré
  algo" en un falsable "probé una cosa específica, y aquí está el veredicto pre-acordado."</p>
</aside>

## Las dos reglas que lo hacen funcionar

El pre-registro solo funciona si además te comprometes a dos reglas de seguimiento, porque la tentación de hacer
trampa se mueve *aguas abajo* del primer resultado.

**Regla 1 — una stop-rule, fijada por adelantado.** Antes de empezar una clase de mecanismo, fijo un presupuesto
de intentos: p. ej. *dos tiros; si ambos son NO-GO, la clase se concluye.* Sin esto, el "pre-registro" degenera en
correr hipótesis pre-registradas para siempre hasta que una pase por suerte — comparaciones múltiples con pasos
extra.

**Regla 2 — nunca re-tunear un NO-GO hasta volverlo GO.** Cuando una hipótesis falla, el seguimiento debe ser un
*mecanismo distinto* o *más datos / breadth* — nunca la misma idea con las perillas movidas hasta que pase.

<figure>
  <img src="/blog/pre-registration-backtests/follow-up-rule.svg" alt="Tras un NO-GO, el movimiento permitido es una clase de mecanismo distinta o más datos; re-tunear las mismas perillas hasta que pase está prohibido porque es p-hacking" loading="lazy" />
  <figcaption>La regla de seguimiento — un NO-GO puede llevar a un mecanismo nuevo o más datos, nunca a torcer las perillas del perdedor.</figcaption>
</figure>

Esta es la disciplina que hace que un resultado *negativo* signifique algo. Si me hubiera permitido re-tunear,
cada NO-GO sería solo una estación de paso en el camino hacia un GO manufacturado. Al pre-comprometerme, un NO-GO
es una respuesta real y confiable — y en todo el programa, siete familias de mecanismo volvieron NO-GO y me creí
cada una.

## Por qué esto es una habilidad de ingeniería, no solo un truco estadístico

Si has escrito un RFC o un Architecture Decision Record, ya conoces el pre-registro — solo que lo aplicas a código
en vez de a backtests:

- Escribir los **criterios de aceptación antes del run** es escribir el **test antes de la implementación.**
  Defines "terminado" antes de empezar, así no puedes redefinir el éxito en silencio para que cuadre con lo que
  construiste.
- La **stop-rule** son los **criterios de muerte de un spike**: "le ponemos un time-box a esta investigación; si
  no pasa la barra, paramos." Es como evitas la ingeniería de costo hundido.
- "**Nunca re-tunear un NO-GO**" es "**no sigas aflojando el umbral hasta que el test flaky pase.**" Mover la
  portería para que el rojo se vuelva verde es el mismo pecado en ambos mundos.

El mismo instinto que hace confiable un backtest hace confiable una decisión de ingeniería: decide qué te haría
cambiar de opinión *antes* de mirar, y luego hónralo de verdad. El pre-registro es solo honestidad intelectual con
un timestamp.

## Referencias y para profundizar

- [El problema de las comparaciones múltiples](https://es.wikipedia.org/wiki/Comparaciones_m%C3%BAltiples) y el *jardín de los caminos que se bifurcan* (Gelman & Loken).
- [Researcher degrees of freedom](https://en.wikipedia.org/wiki/Researcher_degrees_of_freedom) — las decisiones que inflan en silencio los falsos positivos.
- [Pre-registro](https://en.wikipedia.org/wiki/Preregistration_(science)) en las ciencias.
- [Overfitting](https://es.wikipedia.org/wiki/Sobreajuste) y [walk-forward optimization](https://en.wikipedia.org/wiki/Walk_forward_optimization).
- Bailey, Borwein, López de Prado & Zhu, "The Probability of Backtest Overfitting" — por qué más intentos exigen una barra más alta.
- Harvey, Liu & Zhu (2016), "…and the Cross-Section of Expected Returns" — el argumento de que un *t*-stat de 2 no alcanza ni de cerca tras minar datos.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — donde vivió este programa.
- El post compañero: [Intenté encontrar un edge de trading y fallé siete veces](/es/blog/sin-edge-siete-estrategias).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Cada pre-registro descrito aquí
fue un commit de git real y fechado. El código sanitizado vive en el [caso de estudio](/es/trinitrade) y el
[repositorio público](https://github.com/mizolutions/trinitrade).*
