# ADR-004: DNS — mantener la zona en Route53 y apuntar a Vercel con un A record

**Estado:** Aceptado
**Fecha:** 2026-06-16
**Contexto:** `mizolutions.com` se registró en **AWS Route53 (Route53 Domains)**
dentro de la cuenta de producción del trading (`520999258244`) — la misma que
posee `miz0.com`. El registro auto-creó una hosted zone dedicada
(`Z062327723TCUEVA9TY8M`). El sitio se hospeda en Vercel.

## Decisión

**Mantener la zona DNS en Route53** (el registrador ES Route53) y apuntar el apex
a Vercel con un único registro **`A mizolutions.com → 216.198.79.1`** (TTL 300).
**No** delegar los nameservers a Vercel; **no** meter estos registros en el CDK
del trading-system ni en la zona de `miz0.com`.

## Razones

1. **Aislamiento de blast-radius.** La landing y la infra de trading son dominios
   de fallo separados: el sitio no debe poder tumbar (ni ser tumbado por) el
   trading-system. Una zona distinta = un failure domain distinto.
2. **La pestaña "Vercel DNS" delegaría toda la zona** a `ns1/ns2.vercel-dns.com`,
   moviendo el control fuera de Route53. Innecesario y acoplante. Se usa la pestaña
   **"DNS Records"** de Vercel (que solo pide el A record).
3. **`216.198.79.1` es la IP apex actual** que Vercel muestra; la antigua
   `76.76.21.21` / `cname.vercel-dns.com` siguen funcionando pero están deprecadas.
4. **SSL automático.** Vercel emite el certificado al resolver el A record.

## Consecuencias

- Los registros DNS de la landing se gestionan **a mano** (o en un stack CDK
  dedicado en el futuro), **nunca** dentro del trading-system.
- `www.mizolutions.com` no se configura hasta añadirlo como dominio en Vercel
  (entonces pedirá `CNAME www → cname.vercel-dns.com`).
- `blog.mizolutions.com` (si se usa) = `CNAME` + redirect/own-project (decisión
  futura, ver RAID S-05).
- El comando aplicado quedó registrado en el README §DNS para reproducibilidad.
