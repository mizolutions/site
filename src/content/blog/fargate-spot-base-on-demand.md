---
title: "Fargate Spot más una base on-demand: el trade-off como código"
description: 'La capacidad Spot es ~70% más barata y puede ser reclamada en cualquier momento. Una estrategia de capacity provider te deja codificar el trade-off coste-contra-disponibilidad directamente en el código de infraestructura: una base garantizada, con lo barato encima.'
pubDate: 2026-11-24
lang: 'es'
draft: true
tags: ['finops', 'aws', 'coste', 'ecs', 'fargate']
---

La capacidad Spot es uno de los mejores descuentos del cloud — a menudo cerca de un 70% — con una pega: te la pueden
quitar en cualquier momento. Para un sistema que debe estar corriendo mientras el mercado está abierto, "tu tarea
podría desaparecer a media sesión" no es una propiedad aceptable. En [Trinitrade](/es/trinitrade) no tuve que elegir
entre barato y fiable, porque una estrategia de capacity provider te deja codificar *ambos* — una base on-demand
garantizada, con la capacidad barata e interrumpible encima — directamente en el código de infraestructura.

## El trade-off, dicho claramente

Spot y on-demand son dos extremos de un mismo dial. La capacidad on-demand está garantizada de colocarse y no será
reclamada, pero pagas precio completo. La capacidad Spot es dramáticamente más barata, pero el proveedor puede
reclamarla con unos dos minutos de aviso cuando necesita la capacidad de vuelta. La mayoría de los debates de
"¿debería usar Spot?" tratan esto como una elección binaria. No lo es — puedes tener algo de cada uno, en una
proporción que tú controlas.

<figure>
  <img src="/blog/fargate-spot-on-demand-base/the-tradeoff.svg" alt="Un dial entre capacidad on-demand (colocación garantizada, precio completo) y capacidad Spot (cerca de un 70 por ciento más barata, reclamable con dos minutos de aviso)" loading="lazy" />
  <figcaption>El trade-off — on-demand está garantizada pero a precio completo; Spot es mucho más barata pero reclamable. Es un dial, no un interruptor.</figcaption>
</figure>

## Por qué 100% Spot es un riesgo real en las horas que importan

La optimización de coste ingenua es correr todo en Spot y embolsarse el ahorro. El peligro oculto es que un reclamo
de Spot durante tu ventana activa no es solo una interrupción — el orquestador entonces tiene que *colocar un
reemplazo*, y si la capacidad Spot está ajustada en ese momento, puede que no haya dónde ponerlo. Tu recuento deseado
dice "una tarea", pero tienes cero corriendo, durante las horas exactas en que el sistema necesita estar vivo.

<figure>
  <img src="/blog/fargate-spot-on-demand-base/spot-risk.svg" alt="Durante horario de mercado, un despliegue 100 por ciento Spot es reclamado, el orquestador intenta colocar un reemplazo, la capacidad Spot no está disponible, y el servicio corre cero tareas pese a un recuento deseado de una" loading="lazy" />
  <figcaption>100% Spot en horas activas — un reclamo más capacidad ajustada significa cero tareas corriendo cuando más necesitas una.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>El descuento de Spot es real, pero también lo es su riesgo de reclamo — y el riesgo muerde más fuerte justo en
  el peor momento. El arreglo no es "todo Spot" ni "todo on-demand"; es una <strong>base on-demand garantizada con
  Spot encima</strong>, expresada como una estrategia de capacity provider. <em>Codificas "mantén siempre al menos
  una tarea segura" como código, no como una esperanza.</em></p>
</aside>

## Codificar el trade-off como una estrategia de capacity provider

El mecanismo es una estrategia de capacity provider: una pequeña pieza de configuración que dice, para este
servicio, *cómo* repartir las tareas entre on-demand y Spot. Tiene dos palancas. Una **base** reserva un número fijo
de tareas para un proveedor — pon la base on-demand a uno y siempre tendrás al menos una tarea garantizada. Los
**pesos** luego distribuyen todo lo que esté por encima de la base — dale a Spot el peso mayor y las tareas extra
viajan en la capacidad barata.

<figure>
  <img src="/blog/fargate-spot-on-demand-base/capacity-strategy.svg" alt="Una estrategia de capacity provider con una base on-demand de una tarea y un peso Spot para todo lo que esté por encima de la base, definida en el código de infraestructura" loading="lazy" />
  <figcaption>La estrategia como código — una base on-demand de una tarea garantizada, con Spot cargando todo lo que esté por encima.</figcaption>
</figure>

Como vive en el código de infraestructura, el trade-off se revisa en un pull request, se versiona y es reproducible —
no una casilla que alguien marcó una vez en una consola y olvidó. Si la proporción está mal, puedes verla, discutirla
y cambiarla como cualquier otro código.

## Cómo se comporta a medida que escalas

La parte elegante es cómo esta única estrategia se adapta al tamaño del servicio. Con una tarea deseada, la base la
reclama, así que esa tarea solitaria es on-demand — efectivamente 100% garantizada, que es exactamente lo que quieres
para un sistema donde perder la única tarea significa perder la sesión. Escala a varias tareas y la base aún
garantiza una on-demand, mientras el resto viaja en Spot por el descuento. La misma configuración es conservadora
cuando es pequeña y económica cuando es grande, sin cambios.

<figure>
  <img src="/blog/fargate-spot-on-demand-base/scaling-behavior.svg" alt="Con una tarea la base on-demand la hace totalmente garantizada; con varias tareas una se queda on-demand y el resto corre en Spot, todo desde la misma estrategia" loading="lazy" />
  <figcaption>Misma estrategia, distintas escalas — una tarea totalmente garantizada; muchas tareas mantienen una segura y ponen el resto en Spot barato.</figcaption>
</figure>

Esto se combina naturalmente con escalar a cero fuera de horario: durante las horas en que el sistema está apagado,
nada de esto cuesta nada; durante las horas en que está encendido, la base lo mantiene seguro y Spot mantiene barata
cualquier capacidad extra.

## La lección: haz el trade-off explícito y revisable

La razón para empujar esto al código en vez de dejarlo como una elección al desplegar es que los trade-offs de
coste-contra-disponibilidad son exactamente las decisiones que se pudren cuando son implícitas. Una estrategia de
capacity provider convierte "creemos que esto está mayormente en Spot" en una afirmación precisa y auditable: *esta
cantidad garantizada, el resto barato.* Obtienes la mayor parte del descuento de Spot sin apostar tus horas activas a
que la capacidad esté disponible, y cualquiera que lea la infraestructura puede ver exactamente cuánta fiabilidad
compraste y cuánto ahorraste.

## Referencias y lecturas adicionales

- [Capacity providers de Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/cluster-capacity-providers.html) y el provider [Fargate Spot](https://docs.aws.amazon.com/AmazonECS/latest/userguide/fargate-capacity-providers.html).
- [Estrategias de capacity provider](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/cluster-capacity-providers.html#capacity-providers-strategy) — la semántica de base y peso.
- [Avisos de interrupción de Spot](https://docs.aws.amazon.com/AmazonECS/latest/userguide/fargate-capacity-providers.html#fargate-capacity-providers-considerations) — el aviso de dos minutos.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el stack de cómputo y su estrategia de capacidad.
- Relacionado: [escalar a cero por las noches y fines de semana](/es/blog/escalar-a-cero-noches-y-fines-de-semana) y [tu factura cloud mensual es un SLO](/es/blog/factura-cloud-es-un-slo).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. La estrategia de capacity
provider descrita aquí es real y está definida en el código de infraestructura. El código fuente saneado vive en el
[caso de estudio](/es/trinitrade) y en el [repositorio público](https://github.com/mizolutions/trinitrade).*
