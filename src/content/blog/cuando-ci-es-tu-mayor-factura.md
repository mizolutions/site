---
title: "Cuando CI es tu mayor factura cloud"
description: 'Una vez escalas el sistema de producción a cero fuera de horario, lo que silenciosamente se vuelve tu mayor línea de gasto es lo que corre todo el tiempo: la integración continua. Aquí va cómo el runner de CI se convirtió en el gasto número uno, y cómo domarlo.'
pubDate: 2026-12-01
lang: 'es'
draft: true
tags: ['finops', 'aws', 'coste', 'ci', 'codebuild']
---

Pasa algo curioso cuando te pones serio con el coste. Escalas el sistema de producción a cero por las noches y fines
de semana, pones la base de datos en una agenda, ajustas el tamaño de todo — y entonces abres el cuadro de mando de
coste y la mayor línea de gasto no es el sistema de trading en absoluto. Es la **integración continua**. En
[Trinitrade](/es/trinitrade), el runner de build silenciosamente se volvió la mayor fuente única de gasto,
precisamente *porque* había optimizado todo lo demás tan bien.

## La paradoja: optimiza el producto, y CI flota a la cima

El coste es relativo. Cuando el sistema de producción corre 24/7, domina la factura y CI es un error de redondeo.
Pero en el momento en que escalas producción a cero la mayor parte de la semana, su parte se colapsa — y lo que sea
que corra en cada push, cada pull request y cada job agendado es ahora proporcionalmente enorme. CI no se volvió más
caro; todo lo demás se volvió más barato, y CI se quedó con el primer puesto.

<figure>
  <img src="/blog/ci-is-your-biggest-bill/cost-shift.svg" alt="Antes de optimizar el sistema de producción domina la factura y CI es pequeño; tras escalar producción a cero fuera de horario, CI se vuelve la mayor línea de gasto restante" loading="lazy" />
  <figcaption>La paradoja — escalar producción a cero no hace CI más grande, hace CI la mayor rebanada restante.</figcaption>
</figure>

Vale la pena interiorizar esto como un patrón general de FinOps: **cuanto más exitosamente optimizas tu mayor coste,
más importa tu segundo mayor coste.** La optimización de coste es un juego de "golpea al topo" donde los topos se
hacen cada vez más pequeños, y en algún punto el topo es tu pipeline de build.

## A dónde van de verdad los minutos de build

Un runner de build gestionado factura por minuto, así que la pregunta se vuelve: ¿qué consume minutos? En mi caso
era un conjunto predecible de culpables, ninguno de los cuales eran los tests en sí:

- **Sin caché de dependencias** — cada build reinstala el toolchain completo desde cero, pagando por las mismas
  descargas una y otra vez.
- **Builds redundantes y superados** — hacer push dos veces en rápida sucesión corre dos pipelines completos cuando
  solo el último importa.
- **Imágenes de runner sobredimensionadas** — una imagen base más pesada tarda más en descargarse y arrancar en cada
  build.
- **Jobs agendados que corren cuando nada cambió** — crons diarios disparando los fines de semana, cuando el sistema
  está apagado y no hay nada significativo que comprobar.

<figure>
  <img src="/blog/ci-is-your-biggest-bill/where-minutes-go.svg" alt="Minutos de build consumidos por falta de caché de dependencias, builds redundantes superados, imágenes de runner sobredimensionadas y jobs agendados que corren cuando nada cambió" loading="lazy" />
  <figcaption>A dónde van los minutos — mayormente setup y desperdicio, rara vez los tests en sí.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>El coste de CI mayormente <strong>no</strong> es el coste de correr tus tests — es el coste de todo lo que los
  *rodea*: reinstalar dependencias, descargar imágenes y correr pipelines que nadie necesitaba. El ahorro más rápido
  viene de cortar el setup y la redundancia, no de hacer los tests más cortos. <em>Perfila a dónde van los minutos
  antes de tocar la suite de tests.</em></p>
</aside>

## La trampa del cron de fin de semana

Un desperdicio específico merece su propio apartado porque se compone con otro problema. Si un build agendado corre
todos los días a una hora fija, pero tu sistema solo está *encendido* entre semana, entonces cada fin de semana ese
build dispara contra un sistema que está apagado. No solo desperdicia minutos — a menudo *falla*, porque está
comprobando un sistema que no está ahí, lo que luego produce falsas alarmas encima del gasto desperdiciado.

<figure>
  <img src="/blog/ci-is-your-biggest-bill/weekend-cron.svg" alt="Un build agendado diario dispara los fines de semana contra un sistema que está apagado, desperdiciando minutos y produciendo fallos falsos, arreglado agendándolo solo entre semana" loading="lazy" />
  <figcaption>La trampa del cron de fin de semana — un build diario contra un sistema apagado desperdicia minutos y pagina en falso; agéndalo para coincidir con las horas del sistema.</figcaption>
</figure>

El arreglo es sencillamente hacer que la agenda coincida con la realidad: si el sistema corre entre semana, las
comprobaciones que dependen de él corren entre semana también. Esta es la misma lección de ajustar el gasto a tu
agenda, aplicada a CI.

## Domarlo

Ninguno de los arreglos es exótico; son el aburrido trabajo de base de la higiene de builds:

- **Cachear dependencias** para que cada build reutilice el toolchain en vez de reinstalarlo.
- **Ajustar el tamaño de la imagen del runner** para que el arranque sea rápido y ligero.
- **Cancelar builds superados** para que un segundo push rápido no corra hasta el final un primer pipeline condenado.
- **Agendar jobs para coincidir con las horas reales del sistema** para que nada dispare al vacío.
- **Poner CI en el cuadro de mando de coste** para que se observe como cualquier otro gasto, y la próxima vez que
  trepe lo veas pronto.

<figure>
  <img src="/blog/ci-is-your-biggest-bill/tame-ci.svg" alt="Domar el coste de CI con cinco arreglos aburridos: cachear dependencias, ajustar el tamaño de la imagen del runner, cancelar builds superados, agendar para coincidir con las horas del sistema y poner CI en el cuadro de mando de coste" loading="lazy" />
  <figcaption>Domar el coste de CI — cinco arreglos sin glamour, ninguno de los cuales toca los tests en sí.</figcaption>
</figure>

El último cierra el bucle: CI se volvió mi mayor línea de gasto *porque* tenía un cuadro de mando de coste que lo
sacó a la luz. La factura me dijo dónde mirar. Sin esa observabilidad, habría quedado invisible, escondido tras la
suposición de que "el producto es la parte cara".

## La lección: la optimización de coste nunca termina, solo se mueve

La verdadera moraleja no es "cachea tus builds" — es que siempre hay una mayor línea de gasto, y optimizarla solo
asciende a la siguiente. La disciplina es mantener toda la factura observable para que lo que sea que flote a la cima
sea visible, ya sea tu cómputo de producción, tu base de datos o — sorprendentemente a menudo — el pipeline que
construye la cosa en vez de la cosa misma. Sigue el dinero, y a veces te lleva a un sitio que no esperabas.

## Referencias y lecturas adicionales

- [Precios de AWS CodeBuild](https://aws.amazon.com/codebuild/pricing/) — facturado por minuto de build.
- [Caché en CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/build-caching.html) — cachés locales y en S3.
- [Concurrencia en GitHub Actions](https://docs.github.com/en/actions/using-jobs/using-concurrency) — cancelar ejecuciones superadas.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el pipeline de CI/CD y su perfil de coste.
- Relacionado: [tu factura cloud mensual es un SLO](/es/blog/factura-cloud-es-un-slo) y [deuda en cascada en CI](/es/blog/deuda-en-cascada-ci).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. CI realmente se volvió la mayor
línea de gasto tras escalar el sistema de producción a cero fuera de horario. El código fuente saneado vive en el
[caso de estudio](/es/trinitrade) y en el [repositorio público](https://github.com/mizolutions/trinitrade).*
