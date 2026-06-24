---
title: 'Footguns de AWS CLI y CloudFormation que me costaron una hora cada uno'
description: 'Los peores errores de AWS no son los ruidosos — son los gotchas diminutos y específicos: vacío no es ausente, un campo solo-ASCII, un file:// que resuelve en el host equivocado, y un dry-run limpio que igual hace rollback.'
pubDate: 2026-09-22
lang: 'es'
draft: true
tags: ['devops', 'aws', 'cloudformation', 'cli', 'incident']
---

Los errores de AWS que de verdad te cuestan tiempo no son las caídas dramáticas. Son los gotchas diminutos e
hiper-específicos donde una herramienta hace *exactamente* lo que le dijiste — solo que no lo que querías decir — y
el arreglo es un solo carácter o una sola palabra que jamás pensarías en cuestionar. Aquí van cuatro que me topé
construyendo [Trinitrade](/es/trinitrade), cada uno se comió una hora, y la idea que los une.

## Footgun 1: vacío no es ausente

Tenía un script que a veces corría con un profile de AWS específico y a veces con ninguno, así que seteaba
`AWS_PROFILE` condicionalmente. Cuando debía ser "ninguno," seteaba `AWS_PROFILE=""` — y cada comando moría con:

```
The config profile () could not be found
```

El string vacío no es "ningún profile." Es un profile **llamado** `""`, que por supuesto no existe. La AWS CLI
obedientemente buscó un profile cuyo nombre es el string vacío y falló. El arreglo es hacer que la variable esté
*ausente*, no vacía:

```sh
unset AWS_PROFILE      # correcto: cae a la cadena de credenciales por defecto
AWS_PROFILE=""         # mal: busca un profile literalmente llamado ""
```

<figure>
  <img src="/blog/aws-cli-cloudformation-footguns/empty-vs-unset.svg" alt="Setear AWS_PROFILE a un string vacío hace que la CLI busque un profile llamado string vacío y falle, mientras hacerle unset cae a la cadena de credenciales por defecto" loading="lazy" />
  <figcaption>Vacío no es ausente — <code>""</code> es un nombre de profile; solo <code>unset</code> significa "usa el default."</figcaption>
</figure>

## Footgun 2: un campo que en secreto es solo-ASCII

Le di a un security group una descripción prolija con un em dash: `"trading app — prod"`. El synth de CDK estuvo
limpio. El deploy falló en CREATE con un vago `InvalidRequest`. La causa: el `GroupDescription` de
`AWS::EC2::SecurityGroup` es **solo-ASCII**, y `—` (U+2014) no es ASCII. Un solo carácter tipográfico, copiado
de algún lado, rompió el deploy — y nada aguas arriba me advirtió, porque la plantilla era *sintácticamente*
perfecta.

<figure>
  <img src="/blog/aws-cli-cloudformation-footguns/ascii-only.svg" alt="Una descripción de security group con un em dash pasa cdk synth pero falla en create con InvalidRequest porque el campo es solo-ASCII; un guion simple funciona" loading="lazy" />
  <figcaption>El synth estuvo limpio; el servicio rechazó un carácter no-ASCII que el validador de la plantilla nunca chequeó.</figcaption>
</figure>

El arreglo fue un guion simple. La lección es más grande: **el tipo documentado de un campo no es su conjunto real
de restricciones.**

## Footgun 3: `file://` resuelve en la máquina que corre el comando

Corrí un `send-command` de SSM con parámetros desde un archivo, a través de un wrapper tunelado que ejecuta las
llamadas de AWS desde un bastión:

```sh
aws ssm send-command --parameters file://params.json ...
```

No pudo encontrar `params.json` — aunque el archivo estaba justo ahí en mi laptop. La referencia `file://` la
resuelve el **proceso que hace la llamada a la API**, no la instancia destino ni donde tecleé el comando. Como el
wrapper ejecutaba la CLI en un host *distinto*, `file://` buscó el archivo *ahí*, no en mi laptop. El arreglo fue
poner el archivo donde realmente se hace la llamada.

<figure>
  <img src="/blog/aws-cli-cloudformation-footguns/file-resolves-executor.svg" alt="Una referencia file dos puntos barra barra en un comando de AWS CLI la lee el host que ejecuta la llamada, no la instancia destino ni la máquina donde tecleaste, así que a través de un wrapper el archivo debe existir en el host del wrapper" loading="lazy" />
  <figcaption><code>file://</code> se lee donde la llamada se <em>ejecuta</em> — no donde tecleaste, no en el destino.</figcaption>
</figure>

## Footgun 4: un dry-run limpio que igual hace rollback

La clase más cara: la plantilla que **sintetiza y diffea limpio, luego falla en el deploy** — porque la
restricción real es un límite *del lado del servicio* que el validador de la plantilla no conoce. Una alarma de
métrica de CloudWatch, por ejemplo, tiene reglas que el linter no puede ver (ciertos tipos de expresión no se
permiten en metric alarms; las ventanas de evaluación largas tienen topes duros). `cdk synth` y `cdk diff` están
contentos; CloudFormation acepta la plantilla; luego el servicio la rechaza y ves un `UPDATE_ROLLBACK` deshacer tu
cambio.

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>Un `cdk diff` o `terraform plan` limpio valida tu plantilla contra el modelo del mundo de la herramienta — no
  contra las restricciones reales y de runtime del servicio. <strong>Un plan limpio es una promesa sobre la
  sintaxis, no sobre un deploy exitoso.</strong></p>
</aside>

## El hilo: las herramientas validan sintaxis, los servicios imponen la realidad

Mira los cuatro de reojo y son el mismo bug con disfraces distintos:

<figure>
  <img src="/blog/aws-cli-cloudformation-footguns/the-thread.svg" alt="Las herramientas y los dry-runs validan sintaxis mientras los servicios imponen la realidad en runtime; el footgun vive en la brecha entre sintácticamente válido y realmente permitido" loading="lazy" />
  <figcaption>La forma común — el footgun siempre vive en la brecha entre "sintácticamente válido" y "realmente permitido."</figcaption>
</figure>

- `AWS_PROFILE=""` — **vacío no es ausente.** La CLI honró un valor que querías omitir.
- El em dash — **un tipo documentado no es la restricción real.** Solo-ASCII vivía debajo del tipo.
- `file://` — **la resolución pasa donde no miraste.** "Local" depende de *quién* es el local.
- El rollback con diff-limpio — **el validador y el servicio tienen modelos distintos.** Pasar uno no pasa el
  otro.

La lección unificadora es desconfiar de la capa que solo chequea *forma*. Lee el error real — los de AWS suelen
ser precisos, aun cuando son escuetos (`The config profile () could not be found` te está diciendo, en
retrospectiva, *exactamente* qué está mal). Y nunca dejes que un dry-run en verde te convenza de que un deploy va
a tener éxito: valida contra el servicio cuando la restricción vive en el servicio. El footgun casi siempre es la
brecha entre "sintácticamente válido" y "realmente permitido."

## Referencias y para profundizar

- [Configuración de AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) y la [cadena de proveedores de credenciales](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html) — dónde encaja `AWS_PROFILE`.
- [ASCII](https://es.wikipedia.org/wiki/ASCII) vs [Unicode](https://es.wikipedia.org/wiki/Unicode) — el em dash que rompió un deploy.
- [Null vs. vacío](https://es.wikipedia.org/wiki/Null_(SQL)) y la perenne confusión entre ausente y en blanco.

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — la IaC y el tooling de donde salieron estos.
- Relacionado: [lo que no está en IaC, deriva](/es/blog/lo-que-no-esta-en-iac-deriva) y [CodeBuild corre en dash, no en bash](/es/blog/codebuild-corre-en-dash-no-bash).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Cada footgun aquí es uno que de
verdad me topé. El código sanitizado vive en el [caso de estudio](/es/trinitrade) y el
[repositorio público](https://github.com/mizolutions/trinitrade).*
