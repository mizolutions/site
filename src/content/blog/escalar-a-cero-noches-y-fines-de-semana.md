---
title: "Escalar un sistema de trading a cero por las noches y fines de semana"
description: 'Un sistema que solo funciona en horario de mercado no tiene por qué correr 24/7. Un scheduler que escala el cómputo y la base de datos a cero fuera de horario fue la mayor palanca de mi factura cloud — y tiene que ser él quien controle el interruptor, no tú.'
pubDate: 2026-11-10
lang: 'es'
draft: true
tags: ['finops', 'aws', 'coste', 'ecs', 'rds']
---

Lo más efectivo que hice por mi factura cloud en [Trinitrade](/es/trinitrade) no fue elegir instancias más baratas
ni perseguir descuentos de capacidad reservada. Fue mucho más burdo: **apagar el sistema entero cuando no está
haciendo nada.** Un sistema de trading para acciones de EE. UU. solo es útil cuando el mercado está abierto — unas
pocas horas al día, cinco días a la semana. El otro ~80% de la semana, cada contenedor y base de datos en marcha
quemaba dinero para no hacer nada.

## El patrón de uso decide por ti

Mira *cuándo* el sistema realmente necesita estar vivo. Los mercados de acciones de EE. UU. están abiertos 6.5 horas
al día, de lunes a viernes. Añade un margen generoso para la preparación pre-mercado y la reconciliación post-cierre
y aun así estás muy por debajo de la mitad de la semana. Sin embargo, lo predeterminado en casi cualquier despliegue
es correr continuamente — 168 horas a la semana — sin importar si alguien o algo lo necesita.

<figure>
  <img src="/blog/scaling-to-zero-nights-weekends/usage-pattern.svg" alt="Una línea de tiempo de una semana que muestra el mercado abierto solo en horas diurnas entre semana, mientras un despliegue 24/7 corre continuamente por las noches y fines de semana sin hacer nada" loading="lazy" />
  <figcaption>El patrón de uso — útil solo en horario de mercado entre semana, pero un despliegue por defecto corre las 168 horas de la semana.</figcaption>
</figure>

Cuando la mayor parte de tu semana está inactiva por diseño, la acción de coste de mayor apalancamiento no es
optimizar el coste en marcha — es no correr en absoluto.

## Escalar a cero: apaga el cómputo *y* la base de datos

"Escalar a cero" significa exactamente eso: fuera de horario, el servicio de contenedores baja a un recuento deseado
de cero, y la base de datos se detiene, no solo queda ociosa. El cómputo suele ser el objetivo obvio, pero la base
de datos es a menudo el mayor coste siempre-encendido — una instancia de base de datos gestionada factura corra o no
una sola consulta. Detener ambas es lo que hace el ahorro real.

<figure>
  <img src="/blog/scaling-to-zero-nights-weekends/scale-to-zero.svg" alt="Un scheduler dispara dos acciones fuera de horario: el recuento deseado del servicio de contenedores baja a cero y la base de datos gestionada se detiene, luego ambas se restauran antes de la apertura del mercado" loading="lazy" />
  <figcaption>Escalar a cero — un scheduler detiene el servicio de contenedores y la base de datos fuera de horario, y los restaura antes de la apertura.</figcaption>
</figure>

Una función agendada hace el trabajo: en un disparador de parada pone el servicio a cero tareas y detiene la base de
datos; en un disparador de arranque trae la base de datos de vuelta y escala el servicio, con suficiente antelación
antes de la apertura para que la base de datos esté disponible y la app caliente.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>La mayor victoria de FinOps a menudo no es hacer más barato el sistema en marcha — es <strong>no correrlo
  cuando nadie lo necesita</strong>. Para un sistema con una agenda conocida, escalar a cero fuera de horario gana a
  casi cualquier optimización por-recurso, porque elimina el coste por completo en vez de recortarlo. <em>No
  optimices el tiempo ocioso — elimínalo.</em></p>
</aside>

## El ritmo semanal

El resultado es un ritmo semanal limpio: el sistema despierta antes de la apertura del mercado cada día hábil, corre
durante la sesión y sus márgenes, duerme por la noche y se queda apagado por completo todo el fin de semana. Las
noches y los fines de semana — el grueso del calendario — cuestan esencialmente nada.

<figure>
  <img src="/blog/scaling-to-zero-nights-weekends/weekly-rhythm.svg" alt="Un horario semanal donde el sistema despierta antes de cada apertura de mercado entre semana, duerme cada noche y se queda completamente apagado sábado y domingo" loading="lazy" />
  <figcaption>El ritmo semanal — despierto para las sesiones entre semana, dormido cada noche, apagado del todo el fin de semana.</figcaption>
</figure>

Hay una sutileza que conviene saber: una base de datos gestionada detenida no se queda detenida para siempre — el
proveedor la reiniciará tras una semana aproximadamente si nunca la tocas. Una cadencia semanal esquiva eso
automáticamente, porque la base de datos se arranca cada lunes bien dentro de esa ventana. Un recurso de verdad
siempre-apagado necesita un diseño distinto.

## El scheduler debe controlar el interruptor — no tú

Aquí está la regla operativa que me costó un momento interiorizar: **el scheduler tiene que ser autoritativo.** Si
alguna vez metes la mano y pones manualmente el servicio a cero, has creado dos fuentes de verdad para "¿está el
sistema encendido?", y van a discrepar. El siguiente arranque agendado podría pelear con tu estado manual, o un
despliegue podría reafirmar silenciosamente el recuento equivocado.

<figure>
  <img src="/blog/scaling-to-zero-nights-weekends/authoritative-scheduler.svg" alt="Dos caminos para controlar el estado encendido/apagado: una anulación manual crea fuentes de verdad en conflicto, mientras enrutar cada acción por el scheduler mantiene una sola autoridad" loading="lazy" />
  <figcaption>Una sola autoridad — enruta cada encendido/apagado por el scheduler; una anulación manual crea una segunda fuente de verdad en conflicto.</figcaption>
</figure>

Así que cada acción de encendido/apagado pasa por el scheduler. ¿Quieres encenderlo fuera de su ventana para algo
puntual? Dispara la acción de arranque del scheduler, no edites el servicio a mano. Hay también una trampa de
despliegue relacionada: desplegar un servicio con estado mientras su base de datos está detenida puede dejar las
tareas nuevas en bucle de fallo (no pueden alcanzar la base de datos al arrancar) y revertir tu cambio — así que
esos despliegues los haces dentro de la ventana encendida, con la base de datos disponible, y dejas que el scheduler
restaure el estado apagado después.

## La lección: ajusta el gasto a la agenda que de verdad tienes

Mucho consejo de FinOps va de recortar porcentajes a recursos que has decidido que deben correr. Eso vale la pena —
pero es de segundo orden. La pregunta de primer orden es si el recurso necesita correr *en absoluto* ahora mismo.
Cualquier sistema con una agenda predecible — apps de horario de oficina, pipelines batch, cualquier cosa atada a
horas de mercado u oficina — probablemente paga por un gran bloque de tiempo ocioso garantizado. Escalar ese bloque
a cero, con un scheduler que controle el interruptor, es la victoria grande más barata de toda la disciplina.

## Referencias y lecturas adicionales

- [Detener y arrancar una instancia de Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_StopInstance.html) — y el auto-reinicio a los ~7 días.
- [Agendar el auto-scaling de servicios de Amazon ECS](https://docs.aws.amazon.com/autoscaling/application/userguide/examples-scheduled-actions.html) y [agendas de Amazon EventBridge](https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html).
- [Horario del mercado de EE. UU.](https://www.nyse.com/markets/hours-calendars) — por qué la ventana es tan pequeña.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el scheduler y la arquitectura de coste a su alrededor.
- Relacionado: [nunca despliegues un servicio con estado fuera de horario](/es/blog/nunca-despliegues-stateful-fuera-de-horario) y [health checks que no mienten](/es/blog/health-checks-que-no-mienten).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. El scheduler de auto-apagado por
coste descrito aquí es real y es el mayor ahorro de una sola línea del proyecto. El código fuente saneado vive en el
[caso de estudio](/es/trinitrade) y en el [repositorio público](https://github.com/mizolutions/trinitrade).*
