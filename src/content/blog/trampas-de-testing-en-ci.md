---
title: "Trampas de testing que solo muerden en CI"
description: 'Algunos bugs pasan siempre en tu máquina y fallan solo en CI. La causa es casi siempre la misma: estado compartido oculto más un orden de ejecución distinto. Singletons de configuración, locks a nivel de módulo y flakes de orden aleatorio — y cómo reproducirlos antes de que te avergüencen.'
pubDate: 2027-02-02
lang: 'es'
draft: true
tags: ['testing', 'ci', 'python', 'pytest', 'depuracion']
---

Hay un tipo especial de bug frustrante: pasa cada vez en tu portátil, y falla en CI. Lo reejecutas localmente,
verde. Miras el log de CI, rojo. En [Trinitrade](/es/trinitrade) pisé esta familia las veces suficientes como para
aprender que casi siempre tiene una causa raíz — **estado compartido oculto encontrándose con un orden de ejecución
distinto** — y que CI no es flaky; es un entorno de pruebas más honesto que tu máquina.

## Por qué "pasa localmente, falla en CI" es una categoría, no una casualidad

Tu ejecución de tests local es el entorno más amable que tu código verá jamás: los tests normalmente corren en un
orden estable, en un proceso que has calentado, a menudo igual cada vez. CI es más duro a propósito — aleatoriza el
orden de los tests, corre en un proceso fresco, a veces en paralelo. Así que cuando un test pasa localmente y falla
en CI, la diferencia entre los dos entornos *es el reporte del bug*. La diferencia más común es el orden: localmente
los tests dan la casualidad de correr en un orden que esconde un problema de estado compartido; en el orden
aleatorizado de CI, no.

<figure>
  <img src="/blog/testing-pitfalls-ci/passes-local-fails-ci.svg" alt="Las ejecuciones locales usan un orden de test estable que esconde un problema de estado compartido, mientras CI aleatoriza el orden y lo expone, así que la diferencia entre entornos es el bug" loading="lazy" />
  <figcaption>Una categoría, no una casualidad — el orden estable local esconde el estado compartido; el orden aleatorio de CI lo expone.</figcaption>
</figure>

## Trampa 1: el singleton de configuración que todos comparten

El clásico. Un objeto de configuración es un singleton cacheado — una instancia compartida por cada módulo que lee la
config. Un test mete la mano y muta una bandera sobre él con una asignación plana para montar su escenario, y nunca
la restaura. Localmente, el orden de los tests da la casualidad de poner ese test mutador el último, así que nada
aguas abajo lo nota. En el orden aleatorio de CI, corre el *primero*, y ahora cada test posterior que lee esa bandera
ve el valor contaminado y falla — tests que no tienen nada que ver con el que los rompió.

<figure>
  <img src="/blog/testing-pitfalls-ci/settings-pollution.svg" alt="Un test muta una bandera sobre un singleton de configuración cacheado y compartido con una asignación plana y nunca la restaura, así que en orden aleatorio tests posteriores no relacionados leen el valor contaminado y fallan" loading="lazy" />
  <figcaption>Contaminación de config — una mutación plana de un singleton compartido se filtra a tests no relacionados, pero solo en orden aleatorio.</figcaption>
</figure>

La señal es que los tests que *fallan* no son el que tiene el bug. Añadiste un test que pone una bandera, y tres
tests preexistentes no relacionados se pusieron en rojo. Esa es la firma de estado compartido siendo mutado sin
limpieza.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Cuando un test nuevo hace fallar a <strong>otros tests no relacionados</strong> — sobre todo solo en CI —
  sospecha del estado mutable compartido, no de la lógica del test nuevo. Muta cualquier singleton o config cacheada
  a través de un fixture auto-restaurador que deshaga el cambio al teardown, nunca con una asignación plana. <em>El
  test que se rompe rara vez es el test con el bug.</em></p>
</aside>

## Trampa 2: un lock a nivel de módulo atado a un loop muerto

El primo async. Un lock u otro objeto async cacheado a nivel de módulo está silenciosamente atado al event loop en
el que se creó. Con un runner de tests que crea un loop fresco por test, el segundo test que toca ese objeto cacheado
obtiene uno atado a un loop que ya se ha desmontado — y un await sobre él nunca retorna. Localmente con un solo test
va bien; en la suite completa de orden aleatorio de CI, entra en deadlock hasta que un timeout lo mata, sin traceback
útil. Misma huella — bien solo, roto en compañía — distinto mecanismo.

<figure>
  <img src="/blog/testing-pitfalls-ci/module-level-lock.svg" alt="Un lock async a nivel de módulo atado al event loop de un test es reutilizado por un test posterior cuyo loop es distinto, así que el await se cuelga hasta un timeout sin traceback" loading="lazy" />
  <figcaption>El primo async — un lock a nivel de módulo atado a un loop desmontado deja en deadlock al siguiente test que lo toca.</figcaption>
</figure>

## El arreglo: aislamiento y fixtures auto-restauradores

Ambas trampas tienen la misma cura: nunca dejes que el estado de un test sobreviva al siguiente. Muta la config
compartida solo a través de un fixture que registre el valor viejo y lo restaure al teardown, para que el cambio no
pueda filtrarse. Indexa cualquier objeto atado al loop por el loop actual, o créalo fresco por test, para que no
pueda reutilizarse entre loops. El principio es que cada test debe empezar desde la misma pizarra limpia, sin
importar qué corrió antes — que es exactamente la propiedad que el orden aleatorio de CI está comprobando.

<figure>
  <img src="/blog/testing-pitfalls-ci/auto-restore-fix.svg" alt="Un fixture auto-restaurador registra el valor original, deja que el test lo mute, y lo restaura al teardown para que ningún estado se filtre entre tests" loading="lazy" />
  <figcaption>El arreglo — un fixture auto-restaurador registra, deja que el test mute, y restaura al teardown, para que nada se filtre.</figcaption>
</figure>

## Reprodúcelo antes de que te avergüence

El hábito decisivo es dejar de correr tus tests en el modo local amable y empezar a correrlos como lo hace CI.
Aleatoriza el orden localmente — y, de forma crucial, cuando CI falle, **reutiliza la semilla aleatoria exacta de la
ejecución fallida** para reproducir el mismo orden de forma determinista. Un bug que "solo pasa en CI" normalmente
reproduce al instante una vez que alimentas tu ejecución local con la semilla que lo rompió. Entonces es solo un bug
normal, depurable en tu máquina.

<figure>
  <img src="/blog/testing-pitfalls-ci/reproduce-with-seed.svg" alt="Reproducir un fallo de CI localmente tomando la semilla aleatoria de la ejecución fallida de CI y corriendo la suite de tests con esa semilla exacta para obtener el mismo orden" loading="lazy" />
  <figcaption>Reproduce con la semilla — toma la semilla aleatoria de la ejecución fallida de CI y reprodúcela localmente para obtener el mismo orden.</figcaption>
</figure>

Un hábito relacionado: algunos tests de concurrencia usan sleeps reales para forzar una carrera, y esos se vuelven
flaky bajo runners de CI ocupados más timeouts basados en hilos. Márcalos como lentos, mantenlos fuera del gate
rápido, y córrelos deliberadamente en vez de dejar que la deriva de deadline los convierta en ruido.

## La lección: CI es el test honesto, así que haz tu ejecución local tan hostil como CI

La tentación es descartar los fallos solo-de-CI como flakiness y reejecutar hasta verde. Eso es exactamente al revés.
El entorno aleatorizado, de proceso-fresco y paralelo de CI es un *mejor* modelo de la realidad que tu portátil
caliente y ordenado — está encontrando suposiciones reales que tu código hace sobre el orden y el estado compartido.
El arreglo no es hacer CI más amable; es hacer tus ejecuciones locales tan hostiles como CI, para que estos bugs
aparezcan en tu máquina donde puedes arreglarlos, en vez de en el pipeline donde te cuestan un build rojo y una
tarde. Trata "pasa localmente, falla en CI" no como mala suerte, sino como un mensaje preciso sobre estado oculto.

## Referencias y lecturas adicionales

- [pytest-randomly](https://github.com/pytest-dev/pytest-randomly) — orden aleatorizado y semillas reproducibles.
- [Fixtures de pytest](https://docs.pytest.org/en/stable/how-to/fixtures.html) y [monkeypatch](https://docs.pytest.org/en/stable/how-to/monkeypatch.html) — estado auto-restaurador.
- [Aislamiento de tests](https://en.wikipedia.org/wiki/Test_fixture#Software) y [tests flaky](https://en.wikipedia.org/wiki/Flaky_test).

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — la suite de tests y el CI que las expuso.
- Relacionado: [async SQLAlchemy con asyncpg](/es/blog/async-sqlalchemy-asyncpg-trampas) y [deuda en cascada en CI](/es/blog/deuda-en-cascada-ci).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Cada trampa aquí es una que
realmente pisé, diagnostiqué y arreglé. El código fuente saneado vive en el [caso de estudio](/es/trinitrade) y en el
[repositorio público](https://github.com/mizolutions/trinitrade).*
