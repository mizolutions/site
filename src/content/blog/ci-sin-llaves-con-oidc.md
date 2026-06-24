---
title: 'CI sin llaves: mata tus access keys estáticas de AWS con GitHub OIDC'
description: 'La mejor credencial cloud es la que no existe. Cómo despliego a AWS desde CI con cero llaves de larga vida — usando tokens OIDC de corta vida — y la única línea de la trust policy que lo hace o lo rompe.'
pubDate: 2026-09-08
lang: 'es'
draft: true
tags: ['devops', 'security', 'aws', 'ci-cd', 'oidc']
---

Una enorme proporción de brechas cloud empieza de la misma forma aburrida: una access key de larga vida se filtra
— en un log, un fork, un `.env` commiteado, un screenshot — y alguien la usa. La defensa más confiable no es rotar
las llaves más rápido ni guardarlas mejor. Es **no tenerlas en absoluto.**

[Trinitrade](/es/trinitrade) despliega a AWS desde CI con **cero credenciales estáticas de AWS** en ningún lado —
ninguna access key en un secret de GitHub, ninguna llave en un runner, nada que filtrar ni rotar. Usa tokens OIDC
de corta vida en su lugar. Aquí va cómo funciona y la única línea que lo hace seguro.

## El problema con las llaves estáticas en CI

El patrón viejo es crear un usuario IAM, generar una access key + secret, y pegarlas en los secrets de tu CI para
que el pipeline pueda llamar a AWS. Funciona, y es un pasivo todo el tiempo:

- Es de **larga vida** — válida hasta que alguien recuerde rotarla (nadie recuerda).
- Es **copiable y pegable** — un solo string que funciona desde cualquier parte del planeta, sin contexto.
- Se **filtra de formas aburridas** — impresa en un log de debug, heredada por un fork, commiteada por accidente,
  quedándose en el historial para siempre.

<figure>
  <img src="/blog/keyless-ci-with-oidc/before-after.svg" alt="Antes, una access key de AWS de larga vida se guarda como secret de CI y puede filtrarse; después, no hay llave guardada y CI usa un token OIDC de corta vida intercambiado por credenciales temporales" loading="lazy" />
  <figcaption>Antes y después — de un secret permanente que debes cuidar a un token de corta vida que no hay que guardar.</figcaption>
</figure>

## El arreglo: federación OIDC

En vez de *tener* una credencial, CI **prueba quién es** y obtiene una temporal. GitHub Actions puede emitir un
token firmado [OpenID Connect](https://en.wikipedia.org/wiki/OpenID_Connect) que describe el job en marcha — qué
repo, qué branch, qué workflow. A AWS se le enseña a **confiar en el proveedor de identidad de GitHub**, así que
acepta ese token y devuelve credenciales temporales acotadas a un rol IAM específico, válidas por la duración del
job.

<figure>
  <img src="/blog/keyless-ci-with-oidc/handshake.svg" alt="GitHub Actions pide un token OIDC que describe el job, llama a AWS STS AssumeRoleWithWebIdentity, AWS valida el token contra el proveedor GitHub confiado y la trust policy del rol, y devuelve credenciales temporales de corta vida" loading="lazy" />
  <figcaption>El handshake — GitHub acuña un token acotado al job, AWS lo valida y devuelve credenciales temporales que auto-expiran.</figcaption>
</figure>

Dos piezas lo hacen funcionar:

1. Un **proveedor de identidad OIDC en IAM** registrado para el emisor de tokens de GitHub
   (`token.actions.githubusercontent.com`), para que AWS valide los tokens que firma.
2. Un **rol IAM** cuya trust policy dice "GitHub puede asumirme — *pero solo* desde este repo y branch."

El workflow entonces llama a `AssumeRoleWithWebIdentity` (la action oficial `aws-actions/configure-aws-credentials`
lo hace por ti), y el resto del pipeline corre con credenciales temporales. Nunca se guardó un secret.

## La única línea que lo hace o lo rompe

La seguridad de todo el esquema vive en la **condición de la trust policy** del rol — el claim `sub` que fija
*qué* identidad de GitHub puede asumir el rol:

```json
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:mizolutions/trinitrade:ref:refs/heads/main"
  }
}
```

Ese `sub` dice: solo el branch `main` de *este repo exacto* puede asumir este rol. Equivócalo — un comodín, un
qualifier de repo faltante — y has construido una puerta por la que **cualquier repositorio de GitHub en internet**
puede entrar. Un error común y peligroso es hacer match con `repo:*` u olvidar el branch: acótalo tan ajustado
como el job realmente necesita.

<figure>
  <img src="/blog/keyless-ci-with-oidc/trust-condition.svg" alt="Un claim sub bien acotado restringido a un repo y branch es seguro, mientras un comodín o un qualifier faltante deja que cualquier repo de GitHub asuma el rol" loading="lazy" />
  <figcaption>La condición de confianza — fija el repo y branch exactos. Un comodín aquí es una puerta para todo internet.</figcaption>
</figure>

<aside class="callout callout--key">
  <span class="callout__label">Idea clave</span>
  <p>OIDC no solo acorta la vida de la credencial — <strong>saca el secreto de la existencia</strong>. No hay
  llave que filtrar, rotar o encontrar en un log. Lo que proteges ya no es un string en una bóveda; es una
  <em>relación de confianza</em> que puedes leer, acotar y auditar.</p>
</aside>

## Por qué es estrictamente mejor

Una vez que las llaves se van, una categoría entera de trabajo y preocupación se va con ellas:

- **Nada que filtrar.** El token está firmado, atado a una audiencia, y expira en minutos; es inútil fuera del job
  que lo acuñó.
- **Nada que rotar.** No hay secret de larga vida, así que no hay calendario de rotación que olvidar.
- **Acotado por construcción.** El rol otorga exactamente los permisos que el pipeline necesita, a exactamente un
  repo y branch — [mínimo privilegio](https://en.wikipedia.org/wiki/Principle_of_least_privilege) que puedes ver.
- **Auditable.** Cada asunción es un evento de CloudTrail atado a una corrida de workflow específica.

<figure>
  <img src="/blog/keyless-ci-with-oidc/properties.svg" alt="CI sin llaves con OIDC da cuatro propiedades: nada que filtrar porque los tokens expiran en minutos, nada que rotar, acotado a un repo y branch por mínimo privilegio, y auditable en CloudTrail" loading="lazy" />
  <figcaption>Lo que obtienes gratis cuando las llaves se van — nada que filtrar, nada que rotar, acotado y auditable.</figcaption>
</figure>

## El principio general: deja de guardar secretos compartidos

OIDC para CI es una instancia de un cambio más amplio: **reemplaza secretos compartidos y de larga vida con
credenciales de corta vida basadas en identidad.** La misma idea aparece como workload identity entre servicios,
roles de instancia/pod en vez de llaves horneadas, y SSO con sesiones cortas en vez de contraseñas estáticas. Cada
secret de larga vida es un pasivo que eliges cargar; el default moderno es cargar tan pocos como sea posible —
idealmente cero.

El cambio mental es de *"¿cómo guardo esta llave de forma segura?"* a *"¿por qué existe esta llave siquiera?"* La
mayoría de las veces, con federación, la respuesta honesta es: no tiene por qué.

## Referencias y para profundizar

- [OpenID Connect](https://en.wikipedia.org/wiki/OpenID_Connect) e [identidad federada](https://en.wikipedia.org/wiki/Federated_identity).
- [Configurar OpenID Connect en AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) (docs de GitHub Actions).
- [`AssumeRoleWithWebIdentity`](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html) (AWS STS) y el [principio de mínimo privilegio](https://en.wikipedia.org/wiki/Principle_of_least_privilege).

De mi propio trabajo en **Trinitrade**:

- El [caso de estudio completo de Trinitrade](/es/trinitrade) — el pipeline de CI/CD que usa esto.
- Relacionado: [CodeBuild corre en dash, no en bash](/es/blog/codebuild-corre-en-dash-no-bash) y [lo que no está en IaC, deriva](/es/blog/lo-que-no-esta-en-iac-deriva).
- El [repositorio público](https://github.com/mizolutions/trinitrade) sanitizado y [sobre mí](/es/misael).

---

*Trinitrade es un sistema real y en vivo que diseñé, construí y operé en solitario. Despliega a AWS sin
credenciales estáticas. El código sanitizado vive en el [caso de estudio](/es/trinitrade) y el
[repositorio público](https://github.com/mizolutions/trinitrade).*
