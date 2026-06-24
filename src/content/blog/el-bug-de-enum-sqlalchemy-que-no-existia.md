---
title: "El bug de enum en SQLAlchemy que no existía"
description: 'Estaba seguro de haber encontrado un bug de discrepancia de mayúsculas en enums de Postgres: el SQL crudo devolvía nombres en mayúsculas, mis filtros del ORM usaban valores en minúsculas. Casi envié un arreglo. El bug era un artefacto de cómo lo estaba investigando — una lección sobre depurar en la capa equivocada.'
pubDate: 2027-01-05
lang: 'es'
draft: true
tags: ['data', 'sqlalchemy', 'postgres', 'depuracion', 'orm']
---

Esta es una historia sobre un bug que estaba seguro de haber encontrado, para el que construí una reproducción, y
del que estaba a un commit de "arreglar" — antes de darme cuenta de que no existía. El bug era enteramente un
artefacto de *cómo lo estaba mirando*. En [Trinitrade](/es/trinitrade), me costó una hora y me enseñó una regla de
depuración que ahora aplico en todas partes: reproduce en la misma capa en la que corre tu código real, o estás
investigando un sistema distinto del que tiene el supuesto bug.

## La aparente prueba irrefutable

El montaje: una columna enum que almacena el estado de la orden, definida de modo que los *valores* del enum son
minúsculas (`"filled"`) mientras sus *nombres de miembro* son mayúsculas (`FILLED`). Mi código de aplicación
filtraba con valores en minúsculas — `status == "filled"`. Para verificar qué había de verdad en la base de datos,
bajé a una consulta SQL cruda, y volvió en mayúsculas: `FILLED`. Minúsculas en mi código, mayúsculas en la base de
datos. Eso parecía exactamente un bug de discrepancia de mayúsculas esperando para descartar filas en silencio.

<figure>
  <img src="/blog/sqlalchemy-enum-bug-that-wasnt/apparent-bug.svg" alt="El código de aplicación filtra una columna enum con un valor en minúsculas mientras una sonda SQL cruda devuelve el valor almacenado en mayúsculas, pareciendo un bug de discrepancia de mayúsculas" loading="lazy" />
  <figcaption>La aparente prueba irrefutable — minúsculas en el código, mayúsculas desde una sonda SQL cruda, pareciendo una discrepancia.</figcaption>
</figure>

Tenía una hipótesis, una reproducción y un arreglo formándose en mi cabeza. Todo apuntaba a un bug real — salvo que
no lo era.

## Qué hace de verdad el mapeo de enum del ORM

Aquí está la parte que había malentendido. Cuando mapeas una columna enum a través del ORM, el mapeo es más listo
que una comparación de cadenas plana. **Coerciona de forma transparente**: puedes filtrar con el valor en minúsculas,
el nombre en mayúsculas, o el miembro del enum mismo, y los tres resuelven a las mismas filas. El ORM sabe que la
columna es un enum y traduce lo que le des a la representación subyacente correcta antes de que la consulta corra. La
distinción minúsculas-contra-mayúsculas que me preocupaba sencillamente no sobrevive al contacto con la capa del ORM
— él maneja la traducción por ti.

<figure>
  <img src="/blog/sqlalchemy-enum-bug-that-wasnt/orm-coercion.svg" alt="El mapeo de enum del ORM acepta el valor en minúsculas, el nombre de miembro en mayúsculas, o el miembro del enum, y coerciona los tres a la misma consulta, devolviendo filas idénticas" loading="lazy" />
  <figcaption>Qué hace de verdad el ORM — valor, nombre o miembro coercionan a la misma consulta y devuelven filas idénticas.</figcaption>
</figure>

## El bug real: estaba sondeando en la capa equivocada

Entonces, ¿por qué el SQL crudo mostraba mayúsculas? Porque el SQL crudo *evita el ORM por completo.* Una consulta
`text()`, o una llamada directa al driver, habla con la base de datos sin el mapeo de enum en el camino — así que
devuelve la representación almacenada tal como la guarda la base de datos, que resulta ser el nombre de miembro en
mayúsculas. Mi "verificación" en SQL crudo respondía una pregunta *distinta* de la que hace mi código de aplicación.
El código pasa por el ORM y obtiene coerción; mi sonda rodeó el ORM y obtuvo el almacenamiento crudo. Comparar las
dos y concluir "discrepancia" era comparar manzanas con una traducción de manzanas.

<figure>
  <img src="/blog/sqlalchemy-enum-bug-that-wasnt/wrong-layer.svg" alt="Las consultas de aplicación pasan por el ORM y obtienen coerción de enum, mientras una sonda SQL cruda evita el ORM y ve el almacenamiento crudo, así que las dos responden preguntas distintas" loading="lazy" />
  <figcaption>El problema real — la app pasa por el ORM y obtiene coerción; la sonda cruda lo evita, así que las dos ven cosas distintas.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Antes de reportar un bug, reprodúcelo <strong>en la misma capa en la que corre tu código de verdad.</strong> Una
  sonda SQL cruda y una consulta del ORM son dos sistemas distintos; una discrepancia entre ellos es a menudo la
  abstracción haciendo su trabajo, no un defecto. Casi envié un "arreglo" para un bug que en realidad era mi método
  de investigación. <em>Depura el camino que toma tu código, no un atajo a su alrededor.</em></p>
</aside>

## El test barato que lo zanjó

Lo que disolvió todo el asunto fue un experimento: correr el *mismo* filtro a través del ORM con el valor en
minúsculas, el nombre en mayúsculas y el miembro del enum, y contar las filas que devuelve cada uno. Eran idénticas.
No había pérdida de filas, ni discrepancia silenciosa — la coerción funcionaba exactamente como se diseñó. El "bug"
existía solo en el hueco entre mi sonda SQL cruda y el camino de consulta real de mi aplicación. Cinco minutos de
sondeo en la capa correcta salvaron un pull request desperdiciado que no arreglaba nada.

<figure>
  <img src="/blog/sqlalchemy-enum-bug-that-wasnt/cheap-test.svg" alt="Correr el mismo filtro a través del ORM con valor, nombre y miembro devuelve recuentos de filas idénticos, probando que la coerción funciona y no hay bug" loading="lazy" />
  <figcaption>El test barato — recuentos de filas idénticos entre valor, nombre y miembro a través del ORM probaron que no había bug.</figcaption>
</figure>

## La lección: ajusta tu reproducción a tu runtime

La lección amplia sobrevive a los detalles de cualquier ORM. Cuando sospechas un bug, la reproducción que construyes
tiene que ejercitar el *mismo stack* que usa tu código real. Salta una capa — consulta la base de datos directamente
cuando tu app usa un ORM, pega al servicio directamente cuando tu app pasa por un gateway, llama a la función cuando
tu app pasa por una cola — y puedes "descubrir" una discrepancia que es solo la capa que te saltaste haciendo
exactamente lo que se supone que hace. Algunos de los bugs más convincentes son los que tu método de depuración
inventó. Reproduce en el camino real primero; luego, si aún reproduce, tienes algo que vale la pena arreglar.

## Referencias y lecturas adicionales

- [Tipo Enum de SQLAlchemy](https://docs.sqlalchemy.org/en/20/core/type_basics.html#sqlalchemy.types.Enum) — cómo coerciona el mapeo.
- [Tipos enumerados de PostgreSQL](https://www.postgresql.org/docs/current/datatype-enum.html) — qué se almacena debajo.
- [Abstracción con fugas](https://en.wikipedia.org/wiki/Leaky_abstraction) — y por qué sondear bajo una despista.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — la capa de datos donde vivió este casi-bug.
- Relacionado: [async SQLAlchemy con asyncpg](/es/blog/async-sqlalchemy-asyncpg-trampas) y [por qué hypertables de TimescaleDB para datos de mercado](/es/blog/timescaledb-hypertables-datos-mercado).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Este casi-PR de verdad ocurrió;
la coerción de enum se comportó exactamente como se diseñó. El código fuente saneado vive en el
[caso de estudio](/es/trinitrade) y en el [repositorio público](https://github.com/mizolutions/trinitrade).*
