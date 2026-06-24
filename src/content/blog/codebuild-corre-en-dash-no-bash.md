---
title: 'CodeBuild corre en dash, no en bash: el bashism que fallaba cada build'
description: 'Cada build de mi CI fallaba en una sola línea — y no tenía nada que ver con mi código. Un constructo solo-de-bash en un shell que no es bash convertía un check que pasaba en un build en rojo, y enmascaró el resultado real durante días.'
pubDate: 2026-09-01
lang: 'es'
draft: true
tags: ['devops', 'ci-cd', 'aws', 'bash', 'incident']
---

Durante un tiempo, un check diario de mi pipeline de CI fallaba en cada corrida — y el fallo no tenía nada que ver
con lo que el check realmente probaba. El script que corría **pasaba**. El build se ponía **rojo** de todas
formas, en una sola línea de shell, porque había escrito bash en un shell que no es bash. Peor, el build rojo
enmascaró el resultado real durante días. Aquí va el footgun.

## La sorpresa: tu buildspec no corre bash

Escribes un buildspec de CI, escribes lo que parece un script de shell, y razonablemente asumes que corre en bash
— porque ese es el shell de tu laptop. En AWS CodeBuild, cada comando de un buildspec corre bajo **`/bin/sh`**,
que en la imagen de build es **dash** (el Almquist shell), no bash. Dash es un shell POSIX, ligero. Deliberadamente
*no* implementa las extensiones de bash — y ahí salta la trampa.

<figure>
  <img src="/blog/codebuild-runs-in-dash-not-bash/dash-not-bash.svg" alt="Escribes lo que parece un script de bash en un buildspec de CodeBuild, pero cada comando corre bajo bin sh que es dash, así que las features solo-de-bash no están disponibles" loading="lazy" />
  <figcaption>El desajuste — escribes bash, CodeBuild corre dash, y las partes solo-de-bash calladamente no están.</figcaption>
</figure>

## El bug: un bashism de una línea que falla el build

Mi check corría un script y capturaba su exit status a través de un pipe, como lo harías en bash:

```sh
./gate_a_check.sh | tee gate.log
RC=${PIPESTATUS[0]}     # <- array solo-de-bash; dash no tiene idea de qué es esto
```

`PIPESTATUS` es un array de bash. Dash no lo tiene. Así que `${PIPESTATUS[0]}` no es "el exit code del primer
comando del pipe" — es un **error de sintaxis**: `Bad substitution`, que sale con código distinto de cero.
CodeBuild ve un comando salir distinto de cero y marca el **build entero como FAILED** — sin importar qué
devolvió realmente `gate_a_check.sh`.

<figure>
  <img src="/blog/codebuild-runs-in-dash-not-bash/bad-substitution.svg" alt="Bajo dash, la referencia al array PIPESTATUS es un error Bad substitution que sale distinto de cero, así que CodeBuild marca el build como fallido aunque el script de check real haya pasado" loading="lazy" />
  <figcaption>El bashism en sí falla — el build se pone rojo en la línea de bookkeeping, no en el check real.</figcaption>
</figure>

## La parte insidiosa: un rojo falso que enmascara la verdad

Esto es lo que lo hizo más que un typo. El script de check en sí **pasó** — reportó todos sus checks en verde.
Pero el build se puso rojo en la línea *después*, la que debía registrar el resultado. Así que:

- La señal real ("el sistema está sano") decía **pasa**.
- El build decía **falla**.
- Una alarma de "no ha habido build exitoso recientemente", mirando el estado del build, empezó a dispararse —
  sobre un sistema que en realidad estaba bien.

Pasé más tiempo del que me gustaría admitir tratando esa alarma como un fallo real antes de darme cuenta de que el
build ni siquiera había evaluado lo que se suponía debía reportar. El bashism no solo falló un build; **invirtió
el significado** de un check en verde.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>El <strong>exit code</strong> de un paso de CI es lo único que la plataforma cree — no tus logs, no tu
  intención. Si una línea de bookkeeping sale distinto de cero, el "PASS: 16, FAIL: 0" pasando justo arriba es
  invisible para el build. El exit code <em>es</em> el resultado.</p>
</aside>

## El arreglo: pedir bash explícitamente, y propagar el status real

El arreglo es dejar de asumir el shell y capturar el status a la manera POSIX. Envuelve el pipeline en una
invocación explícita de bash con `pipefail`, luego lee el `$?` estándar:

```sh
bash -c 'set -o pipefail; ./gate_a_check.sh | tee gate.log'
RC=$?     # POSIX, funciona en todos lados; pipefail hace que el status real propague por tee
```

`set -o pipefail` hace que el exit status del pipeline sea el del **último comando que falle**, así que el
resultado real del check sobrevive al `tee` — y `$?` lo lee de forma portable. Sin arrays solo-de-bash, sin
sorpresas.

<figure>
  <img src="/blog/codebuild-runs-in-dash-not-bash/the-fix.svg" alt="Envuelve el pipeline en bash -c con set -o pipefail, luego lee la variable POSIX dólar-interrogación, así el exit status real del check propaga por tee y el build refleja el resultado verdadero" loading="lazy" />
  <figcaption>El arreglo — invocar bash explícitamente, activar pipefail, y leer <code>$?</code> para que el build refleje el resultado real.</figcaption>
</figure>

Ya que estaba, barrí el buildspec en busca de los otros gotchas de dash: nada de `[[ ... ]]` (usa `[ ... ]`), nada
de arrays, y `local` no está garantizado. Cualquier cosa específica de bash tiene que vivir dentro de un `bash -c`
explícito.

## Una segunda lección, más sutil: los exit codes son un contrato

Hay un punto más profundo escondido aquí. Un build que **sale 0 es SUCCEEDED**, sin importar lo que imprimió; un
build que sale distinto de cero es FAILED, sin importar qué tan sano esté el sistema. Así que los exit codes no
son una ocurrencia tardía — son el contrato entre tu script y cada alarma, dashboard y gate aguas abajo.

Eso corta en ambos sentidos. Si un check no puede correr porque el *entorno* no está listo (digamos, el sistema
está apagado a propósito), salir distinto de cero dispararía en falso tus alarmas de calidad — la misma inversión
al revés. El movimiento limpio es mapear "no se pudo evaluar" a un **exit code distinto y no-fallido** (un "skip"
deliberado), para que un fallo real y un entorno ausente nunca se vean igual.

<figure>
  <img src="/blog/codebuild-runs-in-dash-not-bash/exit-code-contract.svg" alt="exit 0 significa succeeded sin importar los logs, exit distinto de cero significa failed sin importar la salud del sistema, y un caso de entorno-no-listo debería mapear a un exit code skip distinto en vez de a un fallo" loading="lazy" />
  <figcaption>Los exit codes son el contrato — y "entorno no listo" merece su propio skip code, no un fallo falso.</figcaption>
</figure>

La lección universal es la que enseña cada bug de "funciona en mi máquina": **tu script corre en el shell en que
realmente corre, no en el que asumiste.** Los entornos de CI son mínimos a propósito. No asumas bash, no asumas tu
PATH, no asumas tu locale — declara lo que necesitas, o porta tu script a lo que está garantizado.

## Referencias y para profundizar

- [Almquist shell (dash)](https://en.wikipedia.org/wiki/Almquist_shell) vs [Bash](https://es.wikipedia.org/wiki/Bash) — el sh de POSIX y sus extensiones.
- [Exit status](https://en.wikipedia.org/wiki/Exit_status) — el contrato que lee cada plataforma de CI.
- [Pipeline (Unix)](https://es.wikipedia.org/wiki/Tuber%C3%ADa_(inform%C3%A1tica)) y `pipefail` — propagar el status por un pipe.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el pipeline de CI/CD detrás de este footgun.
- Relacionado: [lo que no está en IaC, deriva](/es/blog/lo-que-no-esta-en-iac-deriva) y [nunca despliegues un servicio stateful fuera de horario](/es/blog/nunca-despliegues-stateful-fuera-de-horario).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Este footgun y su arreglo están
documentados como registros fechados. El código sanitizado vive en el [caso de estudio](/es/trinitrade) y el
[repositorio público](https://github.com/mizolutions/trinitrade).*
