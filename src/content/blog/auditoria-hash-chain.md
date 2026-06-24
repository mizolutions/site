---
title: "Logs de auditoría a prueba de manipulación con un hash-chain (append-only aún necesita un lock)"
description: 'Un hash-chain hace un log de auditoría a prueba de manipulación: cambia una fila pasada y toda fila posterior se rompe. Pero el encadenamiento convierte silenciosamente cada "append" en un read-modify-write — así que una tabla append-only aún puede corromperse a sí misma bajo concurrencia sin un lock.'
pubDate: 2026-12-22
lang: 'es'
draft: true
tags: ['data', 'auditoria', 'seguridad', 'concurrencia', 'integridad']
---

Un sistema de trading tiene que mantener un registro completo y durable de cada acción que toma — para análisis
post-trade y para regímenes de compliance que exigen años de retención. Pero un log que puedes editar a hurtadillas
no vale mucho para compliance. En [Trinitrade](/es/trinitrade) hice el rastro de auditoría **a prueba de
manipulación** con un hash-chain, y en el proceso aprendí una lección contraintuitiva: una tabla append-only *no* es
automáticamente segura bajo concurrencia. El mismísimo mecanismo que la hace a prueba de manipulación es lo que hace
que necesite un lock.

## A prueba de manipulación con un hash-chain

La idea está tomada de cómo una blockchain enlaza bloques. Cada fila del log de auditoría lleva un hash calculado
sobre su propio contenido *más el hash de la fila anterior*. La primera fila encadena desde un valor génesis fijo. El
hash de cada fila depende por tanto de toda la historia que la precede.

<figure>
  <img src="/blog/audit-hash-chain/hash-chain.svg" alt="Cada fila de auditoría lleva un hash calculado de su contenido más el hash de la fila anterior, encadenando hacia atrás hasta un valor génesis fijo, así que cada fila depende de toda la historia previa" loading="lazy" />
  <figcaption>El hash-chain — el hash de cada fila pliega el hash de la fila anterior, hasta un valor génesis.</figcaption>
</figure>

Esta es la diferencia entre *a prueba de manipulación* (tamper-proof) y *con evidencia de manipulación*
(tamper-evident), y importa. No puedes impedir físicamente que alguien con acceso a la base de datos altere una fila
— pero con un hash-chain, puedes garantizar que cualquier alteración es **detectable**. Cambia los datos de una fila
pasada y su hash ya no coincide; cada fila posterior se calculó del hash viejo, así que toda la cola de la cadena
diverge. Un verificador nocturno recorre la cadena, recalcula cada hash y levanta una alarma en la primera
discrepancia.

<figure>
  <img src="/blog/audit-hash-chain/tamper-evidence.svg" alt="Editar una fila pasada cambia su hash, lo que rompe el hash de cada fila posterior, así que un verificador que recorre la cadena detecta divergencia en la fila manipulada y todo lo que sigue" loading="lazy" />
  <figcaption>Evidencia de manipulación — edita una fila pasada y toda la cola diverge, así que un verificador lo caza.</figcaption>
</figure>

## El bug sutil: hacer append es un read-modify-write

Aquí es donde la intuición te traiciona. "Append-only" suena inherentemente seguro — solo añades filas, nunca las
modificas, ¿qué podría competir en carrera? Pero mira qué requiere de verdad un append a un hash-chain: tienes que
**leer** el hash de la fila anterior, **calcular** el hash de la fila nueva a partir de él, e **insertar**. Eso es un
read-modify-write, y el read-modify-write es la forma canónica de un bug de concurrencia.

Si dos eventos intentan hacer append al mismo tiempo, ambos leen el mismo "hash anterior", ambos calculan su hash
nuevo a partir de él, y ambos insertan. Ahora dos filas reclaman el mismo predecesor — la cadena se ha bifurcado. El
verificador lo marcará como divergencia, aunque nadie manipuló nada; el log se corrompió *a sí mismo* puramente por
escrituras concurrentes.

<figure>
  <img src="/blog/audit-hash-chain/concurrency-fork.svg" alt="Dos appends concurrentes ambos leen el mismo hash anterior, ambos calculan su hash nuevo a partir de él, y ambos insertan, produciendo dos filas que reclaman el mismo predecesor y bifurcando la cadena" loading="lazy" />
  <figcaption>El bug de concurrencia — dos appends leen el mismo hash anterior y bifurcan la cadena, sin manipulación de por medio.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>"Append-only" no significa "seguro ante concurrencia". En el momento en que el contenido de cada fila nueva
  <strong>depende de la fila anterior</strong>, hacer append se vuelve un read-modify-write, y dos escritores pueden
  bifurcar la cadena. El hash-chain que hace el log <em>tamper-evident</em> es exactamente lo que hace inseguro un
  append concurrente simple. <em>La historia enlazada necesita escrituras serializadas.</em></p>
</aside>

## El arreglo: serializa la sección crítica

El arreglo es hacer que la lectura-del-hash-anterior y la inserción sean una única sección crítica serializada, para
que solo haya un append en vuelo a la vez. Un lock alrededor de esa sección garantiza que cada appender vea el hash
anterior *commiteado*, no uno obsoleto que otro append en vuelo está a punto de superar. Los appends hacen cola y la
cadena se mantiene lineal.

<figure>
  <img src="/blog/audit-hash-chain/lock-fix.svg" alt="Un lock alrededor de la sección crítica de leer-hash-anterior e insertar serializa los appends para que cada uno vea el hash anterior commiteado y la cadena se mantenga lineal" loading="lazy" />
  <figcaption>El arreglo — un lock hace de leer-hash-anterior-luego-insertar una sección crítica serializada, manteniendo la cadena lineal.</figcaption>
</figure>

Esta es la misma familia de arreglo que serializar cualquier otra sección crítica sensible al orden: identifica el
read-modify-write, envuélvelo para que solo corra uno a la vez. El coste es throughput en ese único camino, que para
un log de auditoría es un no-problema — la corrección de la cadena importa mucho más que cuántos eventos por segundo
puedes hacer append.

## La lección: "inmutable" y "append-only" no son pases libres

Es fácil asumir que un patrón de escritura que nunca actualiza ni borra es automáticamente seguro de los peligros de
concurrencia habituales. No lo es, en el instante en que las escrituras posteriores dependen de las anteriores.
Hash-chains, totales acumulados, números de secuencia monotónicos, patrones de "inserta la siguiente versión" — todos
convierten un append de apariencia inocente en un read-modify-write que necesita el mismo cuidado que un update.
Cuando construyes algo cuya corrección depende del orden o del estado previo, hazte la pregunta de concurrencia
explícitamente, aunque la tabla sea append-only. La estructura que te da una propiedad bonita — aquí, evidencia de
manipulación — es a menudo la misma estructura que introduce una carrera.

## Referencias y lecturas adicionales

- [Hash chain](https://en.wikipedia.org/wiki/Hash_chain) y [árbol de Merkle](https://es.wikipedia.org/wiki/%C3%81rbol_de_Merkle) — las primitivas de evidencia de manipulación.
- [Read-modify-write](https://en.wikipedia.org/wiki/Read%E2%80%93modify%E2%80%93write) y [condiciones de carrera](https://es.wikipedia.org/wiki/Condici%C3%B3n_de_carrera) — por qué el append no es seguro.
- [SHA-2](https://es.wikipedia.org/wiki/SHA-2) — la función hash que hace el encadenamiento.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el servicio de auditoría y su verificador de cadena.
- Relacionado: [envío idempotente de órdenes sin un lock distribuido](/es/blog/envio-idempotente-de-ordenes) y [trampas de las alarmas de CloudWatch](/es/blog/trampas-alarmas-cloudwatch).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. El rastro de auditoría con
hash-chain y el arreglo de concurrencia descritos aquí son reales. El código fuente saneado vive en el
[caso de estudio](/es/trinitrade) y en el [repositorio público](https://github.com/mizolutions/trinitrade).*
