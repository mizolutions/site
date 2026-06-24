---
title: "Architecture Decision Records para un equipo de uno"
description: 'Los ADR se venden como una herramienta para equipos — capturar por qué se tomó una decisión para que los colegas la entiendan. Pero el colega más valioso al que sirve un ADR es tu yo futuro, que habrá olvidado cada razón. Aquí va cómo los ADR ligeros rindieron en un proyecto en solitario.'
pubDate: 2027-01-19
lang: 'es'
draft: true
tags: ['liderazgo', 'arquitectura', 'documentacion', 'proceso', 'adr']
---

Los Architecture Decision Records normalmente se venden como una herramienta de comunicación de equipo: anota *por
qué* tomaste una decisión para que otros ingenieros la entiendan después. Como desarrollador en solitario, ese
argumento suena irrelevante — no hay otros ingenieros. Así que casi me los salté. En [Trinitrade](/es/trinitrade) me
alegro de no haberlo hecho, porque el "otro ingeniero" más importante al que sirve un ADR es la versión de ti dentro
de seis meses que ha olvidado cada razón que jamás tuviste.

## El colega para el que de verdad escribes

El error es pensar que un ADR es para *otras personas*. La audiencia real es **tu yo futuro** — alguien con todos tus
hábitos y nada de tu contexto actual. Tu yo futuro mirará una elección de diseño de apariencia extraña y preguntará
"¿por qué demonios lo hice así?" Sin un registro, rederivas el razonamiento desde cero, o peor, "arreglas" algo que
era una decisión deliberada y reintroduces justo el problema que resolvía.

<figure>
  <img src="/blog/adrs-team-of-one/future-you.svg" alt="Un ADR se escribe no para un equipo sino para una versión futura del mismo desarrollador que ha olvidado el contexto y pregunta por qué se tomó una decisión" loading="lazy" />
  <figcaption>La audiencia real — no colegas, sino tu yo futuro, que tiene tus hábitos y nada de tu contexto actual.</figcaption>
</figure>

## Qué va en un ADR ligero

Un ADR no necesita una plantilla pesada — las plantillas pesadas son exactamente por lo que la gente deja de
escribirlos. Los míos son archivos markdown cortos, numerados secuencialmente, cada uno capturando cuatro cosas: el
**contexto** (las fuerzas y restricciones en juego), la **decisión** (qué elegí), las **alternativas** (qué consideré
y rechacé), y las **consecuencias** (a qué me compromete esto, lo bueno y lo malo).

<figure>
  <img src="/blog/adrs-team-of-one/anatomy.svg" alt="Un ADR ligero tiene cuatro partes: contexto y fuerzas, la decisión tomada, las alternativas consideradas y rechazadas, y las consecuencias a las que compromete" loading="lazy" />
  <figcaption>La anatomía — contexto, decisión, alternativas, consecuencias. Lo bastante corto como para que de verdad lo escribas.</figcaption>
</figure>

La sección de **alternativas** es la que la gente se salta y la que más rinde. Registrar qué rechazaste, y por qué,
te impide re-litigar el mismo debate cada pocos meses — cuando tu yo futuro se pregunte "¿debería esto ser
multi-réplica?", el ADR ya dice "lo consideré, aquí está por qué no", y la conversación termina antes de empezar.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Un ADR para un proyecto en solitario no es burocracia — es una <strong>carta a tu yo futuro</strong> que ha
  perdido todo el contexto. Su sección de mayor valor es el <em>camino no tomado</em>: anotar las alternativas que
  rechazaste, y por qué, significa que nunca re-discutes una decisión zanjada ni la deshaces sin querer. <em>La forma
  más barata de mantener una decisión tomada es anotar por qué la tomaste.</em></p>
</aside>

## El bucle de recompensa

El valor aparece justo cuando estás confundido. Te topas con una elección de diseño que no tiene sentido inmediato,
vas al registro de decisiones, encuentras el ADR, y el razonamiento está justo ahí — contexto, alternativas,
consecuencias. Sin arqueología, sin rederivación, sin riesgo de deshacer un trade-off deliberado. El bucle es corto y
se cierra cada vez que de otro modo quemarías una hora reconstruyendo tu propia intención.

<figure>
  <img src="/blog/adrs-team-of-one/payoff-loop.svg" alt="Cuando una elección de diseño es confusa, el desarrollador consulta el registro de decisiones, encuentra el ADR, lee el razonamiento, y evita rederivar o deshacer la decisión" loading="lazy" />
  <figcaption>El bucle de recompensa — la confusión lleva al ADR, el ADR tiene el razonamiento, y la pregunta se responde en minutos.</figcaption>
</figure>

Hay una segunda recompensa, más sutil: el acto de *escribir* el ADR te obliga a pensar la decisión a fondo. Más de
una vez, redactar la sección de alternativas me hizo darme cuenta de que mi primera elección estaba mal antes de
haber construido nada. El ADR no es solo un registro de pensamiento — es una herramienta que *produce* mejor
pensamiento, porque el razonamiento vago no sobrevive a ser escrito por completo.

## Mantenlos inmutables: supersede, no edites

La única regla que mantiene confiable un registro de decisiones es que un ADR aceptado es **inmutable**. Cuando una
decisión cambia, no editas el registro viejo — escribes un ADR nuevo que lo supersede y enlazas los dos. Esto
preserva la historia de *cómo* evolucionó tu pensamiento, que a menudo es tan valiosa como el estado actual: puedes
ver no solo lo que crees ahora, sino el camino que te trajo aquí, y por qué el razonamiento viejo ya no se sostiene.

<figure>
  <img src="/blog/adrs-team-of-one/supersede.svg" alt="Cuando una decisión cambia, el ADR viejo se mantiene inmutable y se marca superseded por un ADR nuevo, preservando la historia de cómo evolucionó el pensamiento" loading="lazy" />
  <figcaption>Supersede, no edites — mantén el ADR viejo, enlaza uno nuevo, y preserva la evolución del razonamiento.</figcaption>
</figure>

Esta inmutabilidad tiene otro beneficio en el que me apoyé mucho: un ADR escrito en el momento de la decisión es un
registro a-priori con fecha. Cuando luego evalúas si una decisión funcionó, puedes demostrar que la razonaste a fondo
*antes* de que el resultado fuera conocido — no una racionalización a posteriori. Un registro de decisiones donde cada
entrada está fija en el tiempo es una defensa contra engañarte a ti mismo.

## La lección: la gobernanza escala hacia abajo, no solo hacia arriba

El reflejo es pensar que el proceso es para equipos grandes y que el trabajo en solitario debería ser todo flujo, sin
papeleo. Pero las formas más ligeras de gobernanza — un registro de decisiones numerado, un archivo por elección —
rinden a *cualquier* tamaño de equipo, porque su trabajo real no es la coordinación entre personas; es la coordinación
entre tu-yo-ahora y tu-yo-después. Anotar por qué decidiste algo, qué rechazaste y a qué te compromete cuesta diez
minutos y te salva de rederivar, dudar y deshacer sin querer tu propio trabajo. El equipo más pequeño del mundo aún se
beneficia de recordar por qué hizo lo que hizo.

## Referencias y lecturas adicionales

- [Architecture decision records](https://adr.github.io/) — el formato y sus variantes.
- El [post original de ADR](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) de Michael Nygard — la plantilla ligera.
- [Decisión de arquitectura](https://en.wikipedia.org/wiki/Architectural_decision) — el concepto más amplio.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el registro de decisiones que recorrió todo el proyecto.
- Relacionado: [una Torre de Control para operadores en solitario](/es/blog/torre-de-control-operadores-solitarios) y [pre-registrar backtests](/es/blog/pre-registro-backtests).
- El [repositorio público](https://github.com/mizolutions/trinitrade) saneado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Su registro de decisiones de ADR
es real y corrió desde la primera elección de arquitectura hasta la decisión de concluir el proyecto. El código fuente
saneado vive en el [caso de estudio](/es/trinitrade) y en el [repositorio público](https://github.com/mizolutions/trinitrade).*
