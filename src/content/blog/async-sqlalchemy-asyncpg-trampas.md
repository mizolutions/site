---
title: "Async SQLAlchemy con asyncpg: patrones y trampas"
description: 'Async SQLAlchemy corre de maravilla en producción, donde un event loop vive para siempre. Los bordes afilados solo aparecen en los tests, donde FastAPI y pytest crean loops constantemente — y una caché atada a un loop muerto se cuelga para siempre sin traza útil.'
pubDate: 2027-01-12
lang: 'es'
draft: true
tags: ['data', 'sqlalchemy', 'asyncio', 'fastapi', 'testing']
---

Async SQLAlchemy sobre asyncpg es una delicia en producción. Hay un único event loop de larga vida, el pool de
conexiones calienta una vez, y todo ronronea. Luego escribes tests, y el mismo código que ha sido impecable en
producción empieza a colgarse para siempre en CI sin stack trace. En [Trinitrade](/es/trinitrade), casi cada bug de
base de datos async que pisé tenía la misma raíz: **producción corre un event loop, pero el harness de tests corre
muchos** — y los objetos async atados silenciosamente a un loop no sobreviven a eso.

## Dos mundos de concurrencia distintos

El modelo mental clave es que producción y los tests no son el mismo entorno de concurrencia. En producción, se crea
un único event loop al arranque y corre hasta el apagado; cualquier objeto async que caches — un engine, una factoría
de sesiones, un lock — vive feliz en ese único loop para siempre. En los tests, el runner de tests async a menudo
crea un loop *fresco* por test, y el cliente de tests de un framework web puede crear loops efímeros por petición. El
mismo objeto cacheado ahora se alcanza desde loops en los que nunca se creó.

<figure>
  <img src="/blog/async-sqlalchemy-asyncpg-pitfalls/two-worlds.svg" alt="Producción corre un event loop de larga vida así que los objetos async cacheados siempre se reutilizan con seguridad, mientras los tests crean muchos loops efímeros por test y por petición" loading="lazy" />
  <figcaption>Dos mundos — el único loop de larga vida de producción contra los muchos loops efímeros del harness de tests.</figcaption>
</figure>

Esta diferencia es invisible justo hasta que una primitiva async se ata a un loop específico. Entonces muerde.

## El bug característico: una caché atada a un loop muerto

Aquí está el que más me costó. Una caché a nivel de módulo de objetos async — indexada por alguna cadena, creada
perezosamente — funciona perfectamente en producción porque solo hay un loop. En los tests, el primer test crea un
objeto en su loop y lo cachea; ese loop se desmonta al final del test. El siguiente test mete la mano en la misma
caché, recibe de vuelta un objeto atado al loop ahora **muerto**, y hace await sobre él. El await nunca completa,
porque el future al que espera pertenece a un loop que ya no corre. El test simplemente se cuelga hasta que un
timeout lo mata, sin traceback útil que apunte a la causa.

<figure>
  <img src="/blog/async-sqlalchemy-asyncpg-pitfalls/dead-loop.svg" alt="Una caché a nivel de módulo devuelve un objeto async creado en el event loop de un test anterior que se ha desmontado, así que hacer await sobre él se cuelga para siempre esperando un future atado a un loop muerto" loading="lazy" />
  <figcaption>El bug característico — un objeto async cacheado atado a un loop desmontado; hacer await sobre él se cuelga para siempre sin traza.</figcaption>
</figure>

El síntoma revelador es inconfundible una vez que lo has visto: **"pasa localmente con un solo test, se cuelga en CI
en orden aleatorio la segunda vez que se pega a la misma clave de caché."** Ese patrón — verde solo, en deadlock
cuando algo corre antes — casi siempre significa un objeto a nivel de módulo atado a un event loop.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Cualquier primitiva async cacheada a nivel de módulo — un engine, una factoría de sesiones, un lock — está
  silenciosamente <strong>atada al event loop en el que se creó.</strong> Producción tiene un loop para siempre, así
  que el bug nunca aparece; el harness de tests tiene muchos loops, así que entra en deadlock. <em>"Funciona con un
  test, se cuelga en CI de orden aleatorio" es la huella de una caché atada al loop.</em></p>
</aside>

## El arreglo: indexar por loop, o crear dentro del loop

El arreglo es dejar de compartir un objeto async entre loops. O reindexar la caché por la identidad del loop
*actual* en ejecución, para que cada loop tenga su propio objeto, o crear el objeto dentro del loop en ejecución en
vez de al importar. Ambos hacen la caché correcta en el mundo de muchos-loops de los tests sin cambiar nada de
producción, donde solo hay un loop y por tanto una entrada. El principio es: la vida de un objeto async no debe
sobrevivir al loop al que pertenece.

<figure>
  <img src="/blog/async-sqlalchemy-asyncpg-pitfalls/fix-key-by-loop.svg" alt="Reindexar la caché por la identidad del loop actual en ejecución da a cada loop su propio objeto async, así que producción con un loop no cambia y los tests con muchos loops obtienen cada uno un objeto válido" loading="lazy" />
  <figcaption>El arreglo — indexa la caché por el loop en ejecución, para que cada loop tenga su propio objeto válido y producción no cambie.</figcaption>
</figure>

## El otro clásico: hacer await cruzando la frontera del greenlet

La segunda trampa es distinta en forma. Async SQLAlchemy puentea sync y async con un greenlet por debajo, y ese
puente tiene un borde: si accedes a una relación cargada perezosamente *después* de que el contexto async de la
sesión haya terminado, no hay greenlet que conduzca la consulta implícita, y obtienes un error tipo `MissingGreenlet`
en vez de datos. El arreglo es cargar lo que necesitas *mientras* la sesión está abierta — eager-load de las
relaciones que vas a tocar, o materializar los datos antes de que el contexto cierre — en vez de confiar en la carga
perezosa que necesita un await que ya no tienes.

<figure>
  <img src="/blog/async-sqlalchemy-asyncpg-pitfalls/greenlet-boundary.svg" alt="Acceder a una relación perezosa después de que el contexto de sesión async haya cerrado no tiene greenlet que corra la consulta y lanza un error, arreglado con eager-load dentro de la sesión" loading="lazy" />
  <figcaption>La frontera del greenlet — la carga perezosa tras cerrar la sesión falla; eager-load dentro de la sesión en su lugar.</figcaption>
</figure>

Un primo de estos es el estado mutable compartido que se filtra entre tests — un singleton cacheado mutado por un
test y leído por otro — produciendo la misma firma de "pasa solo, falla en orden aleatorio". La cura es de la misma
familia: aísla por-loop o por-test, y nunca dejes que el estado de un test se filtre al siguiente.

## La lección: tu harness de tests es un runtime distinto

La moraleja más profunda es que pasar en producción no valida las suposiciones de tu código async, porque producción
es el entorno de concurrencia *más fácil* en el que tu código correrá jamás — un loop, de larga vida, sin churn. El
harness de tests, con su creación y destrucción constantes de loops, es mucho más hostil, y eso es una característica:
saca a la luz los bugs de atadura-al-loop que un incidente real expondría de otro modo en el peor momento posible.
Cuando el código async "funciona en prod pero se cuelga en los tests", resiste el impulso de culpar a los tests. Los
tests suelen tener razón, y te están avisando de una suposición que tu código hace y que producción simplemente da la
casualidad de no violar aún.

## Referencias y lecturas adicionales

- [Soporte asyncio de SQLAlchemy](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html) — incluido el puente greenlet y la guía de eager-loading.
- [Event loop de asyncio](https://docs.python.org/3/library/asyncio-eventloop.html) y los scopes de loop de [pytest-asyncio](https://pytest-asyncio.readthedocs.io/).
- [asyncpg](https://magicstack.github.io/asyncpg/current/) — el driver por debajo.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — la capa de datos async y el ADR tras ella.
- Relacionado: [el bug de enum en SQLAlchemy que no existía](/es/blog/el-bug-de-enum-sqlalchemy-que-no-existia) y [envío idempotente de órdenes sin un lock distribuido](/es/blog/envio-idempotente-de-ordenes).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Los bugs de atadura-al-loop y de
frontera-del-greenlet descritos aquí son reales y aparecieron exactamente como se describe bajo el harness de tests.
El código fuente saneado vive en el [caso de estudio](/es/trinitrade) y en el
[repositorio público](https://github.com/mizolutions/trinitrade).*
