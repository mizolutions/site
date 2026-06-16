# ADR-003: Branding cloud-general (no AWS-específico) en el copy

**Estado:** Aceptado
**Fecha:** 2026-06-16
**Contexto:** El primer borrador del copy decía "AWS architecture", "AWS
workloads", "AWS CDK" en hero, servicios y caso de estudio. El stack real del
trading-system es AWS, pero la consultoría quiere captar trabajo cloud en general.

## Decisión

Usar branding **cloud-general** en el copy de marca: "Cloud" en lugar de "AWS" en
los textos de posicionamiento (hero kicker, descripción de servicios, meta tags,
chips del stack).

## Razones

1. **Mercado más amplio.** "Cloud-native architecture" capta prospectos en
   cualquier nube; "AWS" autolimita el ICP.
2. **El mensaje es confiabilidad, no un proveedor.** El valor es SRE/observabilidad/
   IaC — transferible entre nubes.
3. **Sigue siendo honesto.** Se conservan nombres de herramientas concretas (ECS
   Fargate, CloudWatch, Grafana, TimescaleDB, CDK) como prueba de profundidad;
   solo se quita el lock-in de marca "AWS".

## Consecuencias

- 0 menciones de "AWS" en el copy de `src/i18n/ui.ts` y en los chips del Hero;
  "AWS CDK" → "CDK"; tag de blog `aws` → `cloud`.
- El **cuerpo** de los posts del blog sí puede citar herramientas concretas
  (CloudWatch/Fargate) cuando sea técnicamente preciso.
- Si algún día se ofrece una especialización AWS explícita (ej. landing zone),
  se puede añadir como sección concreta sin revertir este ADR.
