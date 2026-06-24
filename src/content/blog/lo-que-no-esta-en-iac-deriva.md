---
title: 'Lo que no está en IaC, deriva: el deploy que revirtió producción en silencio'
description: 'Un deploy rutinario volvió mi sistema de trading en vivo a modo paper — durante días — porque un ajuste vivía fuera de la Infraestructura como Código. El incidente, la causa raíz, y por qué "todo declarativo" es el único arreglo.'
pubDate: 2026-08-18
lang: 'es'
draft: true
tags: ['devops', 'iac', 'aws', 'sre', 'incident']
---

El deploy más peligroso no es el que falla ruidosamente. Es el que tiene éxito — y cambia en silencio algo que
nunca pediste. Envié uno de esos en [Trinitrade](/es/trinitrade), mi sistema de trading en vivo, y me enseñó una
ley que ahora trato como innegociable: **lo que no está en la Infraestructura como Código, deriva.**

Aquí va el incidente, la causa raíz que lo hace tan traicionero, y el arreglo.

## El incidente: en vivo, y luego calladamente no

Trinitrade puede correr contra una cuenta de bróker **paper** (dinero falso, para pruebas) o una **live** (dinero
real). Lo había cambiado a live usando un pequeño script operativo — de esos que registran una nueva task
definition y actualizan el servicio en marcha directamente. Funcionó. El sistema estaba en vivo.

Días después, envié un cambio totalmente no relacionado: activar un pequeño feature flag de riesgo, desplegado por
mi ruta normal de Infraestructura como Código (`cdk deploy`). El deploy tuvo éxito. Verde por todos lados.

Salvo que también, en silencio, **volvió el bróker a modo paper.** El sistema había estado operando calladamente
en la cuenta *paper* — no en la live — y solo lo noté días después cuando fui a verificar un depósito y los
números no cuadraban. Ninguna alarma se disparó. Nada se rompió. El deploy hizo exactamente lo que estaba escrito
para hacer; el problema era lo que estaba escrito para hacer.

<figure>
  <img src="/blog/anything-not-in-iac-drifts/incident.svg" alt="Secuencia: el operador cambia el servicio a live fuera de banda, ECS corre live invisible para CloudFormation, luego un cdk deploy no relacionado re-asserta la task definition paper de la plantilla y revierte el servicio a paper en silencio" loading="lazy" />
  <figcaption>El incidente — un cambio a live fuera de banda, revertido en silencio por el siguiente deploy no relacionado.</figcaption>
</figure>

## Causa raíz: IaC re-asserta el mundo que conoce

Aquí está el mecanismo, y es la parte que vale la pena internalizar. Una herramienta de Infraestructura como
Código no despliega tu *intención* — despliega su *modelo* de la realidad, y luego fuerza al mundo a coincidir.
CloudFormation (bajo CDK) guarda un registro de lo que cree que debe ser la task definition. Cuando cambié a live
**fuera de banda** — con un script que le hablaba al servicio directamente, saltándose la plantilla —
CloudFormation nunca se enteró. Su modelo seguía diciendo "paper."

Así que cuando corrió el siguiente `cdk deploy`, hizo lo que se supone que debe hacer: re-assertó su modelo sobre
la realidad. "¿La realidad dice live? No lo tengo en mis registros. Lo regreso a paper." El switch a live no fue
*sobrescrito por un conflicto* — fue borrado por un apply que ni siquiera sabía que existía.

<figure>
  <img src="/blog/anything-not-in-iac-drifts/why-dryrun-lied.svg" alt="El dry-run compara la plantilla contra el último estado conocido de IaC, que era paper porque nunca supo del switch a live fuera de banda, así que el diff se ve limpio mientras la realidad se revierte" loading="lazy" />
  <figcaption>Por qué el dry-run se vio limpio — el plan compara contra el estado conocido de IaC, no contra el mundo. Diffeó paper-vs-paper.</figcaption>
</figure>

Esta es la parte genuinamente aterradora: **el dry-run mintió, y no era un bug.** Sí corrí un `cdk diff` primero.
Mostró solo el feature flag cambiando, porque el diff compara la plantilla nueva contra el *último estado conocido
de IaC* — que era "paper." No tenía idea de que el sistema real estaba en vivo, así que no tenía nada de qué
advertirme. Un plan limpio no es una promesa sobre la realidad; es una promesa sobre la plantilla.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Un cambio fuera de banda no es un cambio permanente con un riesgo asociado — es un cambio <strong>temporal</strong>
  por definición. El reloj arranca en el momento en que lo haces, y el siguiente <em>apply</em> es la alarma. Si un
  ajuste no está en IaC, la respuesta real del sistema a "¿qué debería ser esto?" es lo que diga la plantilla, no
  lo que tecleaste en una terminal.</p>
</aside>

## El arreglo: hacer todo declarativo

El arreglo no fue "ten más cuidado con los deploys." El cuidado no escala, y aquí falló precisamente porque el
deploy *parecía* seguro. El arreglo fue **eliminar la ruta fuera de banda por completo** y hacer el modo del
bróker una parte declarativa y de primera clase de la infraestructura:

- El modo paper/live pasó a ser **contexto de CDK** — un valor en la config de IaC, versionado, que la plantilla
  lee. Cambiar de modo ahora es un cambio de código con un diff real, revisado y commiteado.
- Está respaldado por un **secret durable** y un flag explícito de acknowledgment, así que ir a live es un acto
  deliberado y registrado — no un script que alguien corrió una vez y olvidó.

<figure>
  <img src="/blog/anything-not-in-iac-drifts/the-fix.svg" alt="Antes, el modo lo ponía fuera de banda un script y lo revertía el siguiente deploy; después, el modo es contexto de CDK más un secret durable y acknowledgment, así que sobrevive cada deploy declarativamente" loading="lazy" />
  <figcaption>El arreglo — mover el ajuste de un script fuera de banda a la plantilla misma, para que cada deploy lo preserve.</figcaption>
</figure>

Ahora hay exactamente una fuente de verdad. Un `cdk deploy` nunca puede revertir en silencio el modo del bróker,
porque el modo del bróker *está* en lo que se despliega. La clase entera de incidentes "¿por qué cambió
producción?" desaparece — no porque yo sea más cuidadoso, sino porque ya no hay un lugar fuera de banda donde la
realidad pueda esconderse.

## La ley, y dónde le pega a todos

<figure>
  <img src="/blog/anything-not-in-iac-drifts/the-law.svg" alt="Cualquier cambio fuera de banda vía CLI, consola o script es revertido en silencio por el siguiente apply de IaC, así que si no está en IaC es temporal; un cambio hecho en IaC sobrevive el siguiente apply" loading="lazy" />
  <figcaption>La ley — los cambios fuera de banda son temporales; solo el estado rastreado por IaC sobrevive al siguiente apply.</figcaption>
</figure>

No necesitas un sistema de trading para toparte con esto. La misma forma aparece en todas partes donde la config
puede cambiarse en dos lugares:

- **Un hotfix en la consola cloud** que el siguiente apply de Terraform/CDK borra calladamente — la clásica trampa
  del ClickOps.
- **Un `kubectl edit`** que el siguiente reconcile de GitOps revierte, porque Argo CD o Flux tratan git como la
  verdad y tu edición en vivo como deriva a corregir.
- **Un ajuste de producción afinado a mano** que se esfuma la próxima vez que el pipeline redespliega desde el
  repo.

En todos los casos la regla es la misma, y de hecho es una *buena* regla una vez que dejas de pelearte con ella:
**el repositorio es la fuente de verdad, y lo que no esté en él es, por definición, temporal.** No hagas cambios
que el sistema vaya a olvidar. Hazlos donde el sistema recuerda — y deja que los reverts silenciosos trabajen *a
tu favor*, garantizando que producción siempre coincida con el código que puedes leer.

## Referencias y para profundizar

- [Infraestructura como Código](https://es.wikipedia.org/wiki/Infraestructura_como_c%C3%B3digo) e [idempotencia](https://es.wikipedia.org/wiki/Idempotencia) — el modelo que re-asserta el estado.
- [GitOps](https://en.wikipedia.org/wiki/DevOps#GitOps) — git como única fuente de verdad, con corrección automática de deriva.
- [Infraestructura inmutable](https://en.wikipedia.org/wiki/Immutable_infrastructure) — nunca parchear en sitio; reconstruir desde la declaración.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — la arquitectura que este incidente endureció.
- Posts relacionados de disciplina de research: [pre-registro de backtests](/es/blog/pre-registro-backtests) y [siete estrategias, sin edge](/es/blog/sin-edge-siete-estrategias).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Este incidente — y el arreglo
declarativo — están documentados como decisiones fechadas. El código sanitizado vive en el [caso de estudio](/es/trinitrade)
y el [repositorio público](https://github.com/mizolutions/trinitrade).*
