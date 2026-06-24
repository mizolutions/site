---
title: 'Nunca despliegues un servicio stateful fuera de horario: la trampa del circuit-breaker'
description: 'Envié un cambio de config de una línea con la base de datos dormida. El despliegue se revirtió solo — correctamente — y me enseñó que "desplegar a cualquier hora" es mentira para servicios stateful.'
pubDate: 2026-08-25
lang: 'es'
draft: true
tags: ['devops', 'aws', 'ecs', 'sre', 'incident']
---

Para mantener [Trinitrade](/es/trinitrade) barato, un scheduler apaga todo el sistema de noche y los fines de
semana: la base de datos se detiene, el servicio se escala a cero. Es la mayor palanca de coste para un sistema
que solo necesita correr en horario de mercado. También tendió una trampa en la que caí de lleno — al intentar
enviar un cambio de config inofensivo, de una línea, con todo dormido.

El despliegue **se revirtió solo.** Y lo frustrante e instructivo es que *cada componente hizo exactamente lo
correcto.* Aquí va la cadena.

## El setup: un circuit breaker que auto-revierte

Producción corre con dos features de seguridad individualmente excelentes. El servicio corre **más de una task**
por disponibilidad, y usa un **deployment circuit breaker** con rollback automático: si las tasks de un nuevo
despliegue no logran ponerse sanas, AWS aborta el rollout y revierte a la última versión buena. Eso es justo lo
que quieres en prod — una imagen mala nunca debería tumbar el servicio; debería revertirse sola.

La secuencia de arranque del contenedor también hace lo correcto: al bootear, antes de servir tráfico, corre las
migraciones de base de datos (`alembic upgrade head`) para garantizar que el schema coincida con el código.

Cada una de estas es una buena práctica. Juntas, fuera de horario, forman una trampa.

## El incidente: un deploy que no podía tener éxito

Hice un cambio diminuto — añadir un feature flag — y corrí `cdk deploy`. La base de datos estaba detenida (era
fuera de horario). Esto fue lo que se desató:

<figure>
  <img src="/blog/never-deploy-stateful-off-hours/crash-loop.svg" alt="cdk deploy fuera de horario re-asserta el conteo deseado de tasks, arrancan tasks nuevas, el entrypoint corre las migraciones de base de datos, no hay base de datos porque RDS está detenido, las tasks entran en crash-loop, el circuit breaker se dispara y el despliegue se revierte" loading="lazy" />
  <figcaption>La cadena — cada paso es correcto por sí solo, y juntos garantizan un rollback.</figcaption>
</figure>

1. `cdk deploy` re-assertó el estado deseado del servicio, incluido su conteo de tasks, y arrancó **tasks nuevas**
   con la nueva config.
2. Cada task nueva corrió sus migraciones de arranque — que necesitan la base de datos.
3. La base de datos estaba **detenida**. La migración no pudo conectar. La task falló su arranque y salió.
4. Task nueva, mismo fallo. **Crash loop.**
5. El deployment circuit breaker vio un rollout cuyas tasks nunca se pusieron sanas, hizo su trabajo, y **revirtió
   todo el despliegue** a la versión anterior.

Mi cambio de una línea se esfumó — revertido por un mecanismo de seguridad que funcionaba a la perfección. El
deploy nunca tuvo oportunidad: le pedí al sistema arrancar contenedores que *no pueden* arrancar sin base de
datos, en una ventana donde *no hay* base de datos.

## No puedes ganar la carrera despertando la base de datos a mitad del rollback

Mi primer instinto fue arrancar la base de datos para rescatar el deploy en vuelo. No funciona. Una base de datos
gestionada detenida tarda **varios minutos** en volver a *available*; el circuit breaker evalúa la salud de las
tasks con una mecha mucho más corta. Para cuando la base de datos está lista, el rollback ya se disparó.

<figure>
  <img src="/blog/never-deploy-stateful-off-hours/race.svg" alt="La base de datos tarda varios minutos en despertar a available, mientras el deployment circuit breaker evalúa las tasks que fallan mucho más rápido, así que el rollback se dispara antes de que la base de datos esté lista" loading="lazy" />
  <figcaption>La carrera que no puedes ganar — la base de datos despierta en minutos; el circuit breaker dispara en menos.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>El circuit breaker no era el bug — era lo <strong>único</strong> comportándose como una emergencia. El bug
  fue desplegar en un entorno donde el éxito era <em>imposible</em>. Un deploy tiene precondiciones; si las
  ignoras, tus mecanismos de seguridad rechazarán fielmente un deploy que no podía funcionar.</p>
</aside>

## El arreglo: una ventana de deploy, codificada como regla

El arreglo no es debilitar el circuit breaker ni saltarse las migraciones — ambos hacen trabajo real. El arreglo
es respetar la **precondición**: un servicio stateful solo puede desplegarse cuando su almacén de estado está
disponible.

Así que la regla, escrita en el runbook, es contundente: **nunca despliegues un service stack stateful fuera de su
ventana ON.** Despliega cuando el sistema está arriba y la base de datos disponible; los deploys fuera de horario
están prohibidos, punto. El scheduler de coste que apaga las cosas es maravilloso para la factura y una mina para
los deploys — así que los dos tienen que coordinarse, no correr a ciegas.

<figure>
  <img src="/blog/never-deploy-stateful-off-hours/deploy-window.svg" alt="Un deploy solo se permite cuando el sistema está ON y la base de datos disponible; fuera de horario, con la base de datos detenida, los deploys están prohibidos porque las tasks nuevas no pueden arrancar" loading="lazy" />
  <figcaption>La regla — desplegar solo dentro de la ventana ON. Fuera de horario, la base de datos duerme y el deploy no pasa la salud.</figcaption>
</figure>

## La lección general: los deploys tienen un entorno, no solo un artefacto

Es tentador pensar en un deploy como "enviar el artefacto nuevo." Pero un deploy también asume un **entorno** — y
para servicios stateful, ese entorno incluye un almacén de datos alcanzable y listo. La misma trampa aparece mucho
más allá de los schedulers de coste:

- Desplegar durante una **ventana de mantenimiento** cuando la base de datos está en read-only o en failover.
- Un **rollout que corre migraciones** apuntado a una réplica que aún está poniéndose al día.
- **Health checks gateando un rollout** igual que el circuit breaker — negándose correctamente a promover tasks
  que no pueden alcanzar sus dependencias.

El movimiento maduro es hacer la precondición explícita: un check de preflight que se niega a desplegar a menos que
el almacén de datos esté disponible, o un scheduler que *sabe* que debe despertar el estado antes de poder enviar.
Un mecanismo de seguridad revirtiéndote no es el sistema fallando — es el sistema diciéndote que pediste lo
imposible. Escúchalo, y codifica la precondición para no volver a pedirlo.

## Referencias y para profundizar

- [Amazon ECS deployment circuit breaker](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html) — rollback automático ante rollouts no sanos.
- [Migración de schema](https://en.wikipedia.org/wiki/Schema_migration) en el arranque, y [health checks](https://en.wikipedia.org/wiki/Health_check) gateando rollouts.
- [Despliegue blue-green](https://en.wikipedia.org/wiki/Blue%E2%80%93green_deployment) y rolling — y sus supuestos de entorno.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — la arquitectura y el scheduler de coste detrás de esta trampa.
- Relacionado: [lo que no está en IaC, deriva](/es/blog/lo-que-no-esta-en-iac-deriva).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Este incidente y su regla de
runbook están documentados como registros fechados. El código sanitizado vive en el [caso de estudio](/es/trinitrade)
y el [repositorio público](https://github.com/mizolutions/trinitrade).*
