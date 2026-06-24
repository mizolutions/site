---
title: "Un muro de incidentes tipo semáforo en Grafana, por $0"
description: 'Una sola pantalla que responde "¿hay algo ardiendo ahora mismo?" de un vistazo — verde, naranja, rojo — construida con cero infraestructura nueva, cero plugins y cero instrumentación de la app. Solo JSON en git.'
pubDate: 2026-10-20
lang: 'es'
draft: true
tags: ['sre', 'observabilidad', 'grafana', 'cloudwatch', 'aws']
---

Cuando operas un sistema en solitario, el dashboard más valioso no es el de cuarenta gráficas. Es el que responde
una sola pregunta en menos de dos segundos: **¿hay algo ardiendo ahora mismo?** En [Trinitrade](/es/trinitrade)
construí exactamente eso — un muro de incidentes tipo semáforo donde cada señal crítica es un cuadro verde, naranja
o rojo — y no costó nada más allá de JSON commiteado a un repo.

## El objetivo: triaje en un solo panel

Lo primero que haces cuando algo huele mal es triaje: ¿*dónde* está el problema? Sin una vista de triaje rebotas
entre diez dashboards silo leyendo gráficas, lo cual es lento y justo lo que no quieres durante un incidente. El
muro de incidentes colapsa todo eso en una pantalla con tres capas:

<figure>
  <img src="/blog/incident-wall-grafana-zero-cost/three-layers.svg" alt="Un dashboard de incidentes con tres capas apiladas: un muro de semáforos stat, un mapa de topología canvas y una línea de tiempo de estado con bandas de brecha" loading="lazy" />
  <figcaption>Tres capas — un muro de semáforos para el "qué", un mapa de topología para el "dónde" y una línea de tiempo de brechas para el "desde cuándo".</figcaption>
</figure>

1. Un **muro de semáforos stat** — un cuadro por señal crítica, coloreado según su umbral de alarma.
2. Un **mapa de topología canvas** — el flujo de la petición (cliente → balanceador → app → base de datos /
   bróker), con cada nodo y flecha coloreado por una métrica en vivo.
3. Una **línea de tiempo de bandas de brecha** — una fila por señal, verde cuando está sana, roja en brecha, para
   ver *cuándo* empezó y si está parpadeando.

## El truco: CloudWatch no tiene query de "¿esta alarma está disparada?"

La forma obvia de construir un muro de alarmas sería preguntarle al datasource "¿cuál es el estado de la alarma X?"
Pero el datasource de CloudWatch en Grafana tiene exactamente **dos modos de query — Metrics y Logs — y ningún tipo
de query de estado de alarma.** No puedes leer el estado de la alarma desde él.

Así que en vez de *leer* la alarma, la **replicas**: cada cuadro consulta la misma métrica que vigila la alarma, y
sus umbrales de color se fijan a los mismos números que el umbral de la alarma. El cuadro se pone rojo bajo
exactamente la condición que dispara el aviso.

<figure>
  <img src="/blog/incident-wall-grafana-zero-cost/replicate-threshold.svg" alt="Como el datasource no puede consultar el estado de alarma, cada cuadro consulta la misma métrica y aplica el mismo umbral que la alarma real, poniéndose rojo bajo la misma condición" loading="lazy" />
  <figcaption>No existe query de estado de alarma, así que el cuadro replica la alarma — misma métrica, mismo umbral, misma condición roja.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>No necesitas una función especial de "dashboard de alarmas" para construir un muro de alarmas. Un <strong>panel
  stat cuyo color de fondo lo dirigen umbrales que coinciden con tus alarmas reales</strong> convierte la misma
  métrica en un semáforo. La pantalla y el aviso ahora concuerdan por construcción — <em>misma métrica, mismo
  número.</em></p>
</aside>

## El patrón semáforo, en concreto

Todo el efecto sale de una configuración de panel repetida por señal: un panel stat con `colorMode: background`, el
reductor fijado al *último* valor, y pasos de umbral para verde / naranja / rojo. Verde es la línea base sana,
naranja es una banda de aviso, rojo es el umbral de alarma. El fondo del cuadro entero se vuelve el color de estado,
así que un muro de estos se lee como un tablero de semáforos — escaneas buscando rojo.

<figure>
  <img src="/blog/incident-wall-grafana-zero-cost/semaforo.svg" alt="Un panel stat con modo de color de fondo y tres pasos de umbral convierte el valor de una métrica en un cuadro semáforo verde, naranja o rojo" loading="lazy" />
  <figcaption>El cuadro semáforo — último valor más tres umbrales igual a un estado de un vistazo.</figcaption>
</figure>

Para cosas que no son un solo número — como "¿está fluyendo tráfico por el bróker?" — la capa canvas se gana su
sitio: los nodos y las flechas de conexión atan su color a un campo de métrica, así que la topología *misma* se
ilumina donde está el problema. Y la línea de tiempo de estado da la dimensión temporal que a los cuadros stat les
falta: un cuadro solo muestra *ahora*, pero una banda de brecha te muestra que lleva veinte minutos en rojo, o
parpadeando cada pocos minutos.

## Por qué es genuinamente $0

Esta es la parte que más me gusta. Todo el muro se construye con cosas que ya tienes:

- **Sin datasource, plugin o permiso IAM nuevo.** Reutiliza el datasource de CloudWatch existente y las métricas que
  ya se publican. (Evita la tentación de plugins de diagramas vistosos — varios están muertos en Grafana moderno; el
  panel canvas integrado hace el trabajo.)
- **Sin instrumentación de la app.** Cada cuadro lee una métrica que ya existe porque una alarma ya la vigila.
- **Dashboards como código.** El dashboard es un archivo JSON en el repo; el contenedor lo provisiona automáticamente
  al desplegar. Cualquier JSON nuevo en la carpeta se recoge sin registro manual.

<figure>
  <img src="/blog/incident-wall-grafana-zero-cost/dashboards-as-code.svg" alt="Un archivo JSON de dashboard commiteado a git se hornea en la imagen del contenedor de Grafana y se auto-provisiona al desplegar, sin paso de registro manual" loading="lazy" />
  <figcaption>Dashboards como código — el muro vive en git, viaja con el contenedor y se provisiona solo.</figcaption>
</figure>

El resultado es un dashboard con el mismo ciclo de vida que el resto del sistema: revisado en un pull request,
versionado y reproducible. Si alguna vez reconstruyo el entorno, el muro de incidentes vuelve exactamente como
estaba — sin clicar por la UI de Grafana para recrear paneles de memoria.

## La lección: una vista de triaje es un multiplicador de fuerza para un operador solo

Los dashboards de cuarenta gráficas siguen teniendo su lugar — vas a ellos *después* de que el muro te diga qué
rincón del sistema mirar. Pero lo de mayor apalancamiento que puedes construir, sobre todo cuando eres la única
persona de guardia, es la pantalla que convierte "algo va mal" en "el cuadro de la base de datos está en rojo" en
dos segundos. Y lo mejor es que no te pide nada que no hayas construido ya: si tienes alarmas, tienes las métricas y
los umbrales, y un muro de semáforos es solo otra forma de pintar la misma verdad.

## Referencias y lecturas adicionales

- Documentación del [panel stat](https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/stat/) y del [panel canvas](https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/canvas/) de Grafana.
- [Provisionar dashboards como código](https://grafana.com/docs/grafana/latest/administration/provisioning/#dashboards) en Grafana.
- [Conceptos de Amazon CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html) — métricas, namespaces, dimensiones.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — la arquitectura de monitoreo sobre la que se apoya este muro.
- Relacionado: [health checks que no mienten](/es/blog/health-checks-que-no-mienten) y [que no me paginen a las 3am](/es/blog/que-no-me-paginen-a-las-3am) *(misma serie SRE)*.
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. El muro de incidentes descrito
aquí es real, provisionado desde JSON en el repo. El código fuente saneado vive en el
[caso de estudio](/es/trinitrade) y en el [repositorio público](https://github.com/mizolutions/trinitrade).*
