/**
 * Bilingual content + i18n helpers.
 *
 * `ui[lang]` is the single source of truth for all on-page copy.
 * English (`en`) is the default locale, served at `/`.
 * Spanish (`es`) is served under `/es`.
 */

export type Lang = 'en' | 'es';

export const defaultLang: Lang = 'en';
export const locales: Lang[] = ['en', 'es'];
export const languageNames: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
};

/** Resolve the active locale from a URL pathname (`/es/...` => 'es'). */
export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split('/').filter(Boolean)[0];
  return seg === 'es' ? 'es' : 'en';
}

/** Strip the locale prefix, returning the canonical route ('/', '/blog', ...). */
export function stripLocale(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'es') parts.shift();
  return '/' + parts.join('/');
}

/** Build a localized href for a canonical route. */
export function localizeUrl(route: string, lang: Lang): string {
  const clean = route === '/' ? '' : route.replace(/\/+$/, '');
  return lang === 'en' ? clean || '/' : '/es' + clean;
}

export const ui = {
  en: {
    meta: {
      title: 'Mizolutions — Reliability engineering for critical cloud systems',
      description:
        'Senior SRE consultancy: fault-tolerant cloud architecture, observability, and Infrastructure as Code. Proven on Trinitrade, a live algorithmic trading platform built to institutional standards.',
    },
    nav: {
      services: 'Services',
      case: 'Case study',
      method: 'Method',
      writing: 'Writing',
      contact: 'Contact',
    },
    hero: {
      kicker: 'Reliability engineering · Cloud · SRE',
      title: "Reliability engineering for systems that can't afford to fail.",
      subtitle:
        'Mizolutions is the engineering practice of a senior SRE designing fault-tolerant, observable, cost-disciplined cloud infrastructure — proven on Trinitrade, a live algorithmic trading platform built to institutional standards.',
      ctaPrimary: 'Book a reliability review',
      ctaSecondary: 'Read the Trinitrade case study',
    },
    services: {
      heading: 'What I build',
      items: [
        {
          title: 'Cloud-Native Architecture',
          body: 'High-throughput cloud workloads on ECS Fargate, Postgres/Timescale, and event-driven backbones. Built to scale, billed for what you actually run.',
        },
        {
          title: 'SRE & Observability',
          body: 'SLOs, actionable alerting, and end-to-end tracing that turn 3 a.m. pages into 9 a.m. post-mortems. Real signals, not log soup.',
        },
        {
          title: 'Infrastructure as Code',
          body: 'Every environment reproducible from one `cdk deploy`. Immutable deploys, blast-radius isolation, and disaster recovery you have actually tested.',
        },
      ],
    },
    caseStudy: {
      kicker: 'Case study',
      title: 'Trinitrade — institutional-grade reliability on a $100 budget',
      body: 'A live algorithmic trading platform running entirely in the cloud on ECS Fargate and TimescaleDB, provisioned end-to-end as code with CDK. Trinitrade is not a get-rich product — it is a proving ground for the reliability engineering I bring to clients: immutable deploys, automated broker reconciliation, chaos drills, and SLO-backed alerting.',
      metrics: [
        { value: '< 30 bps', label: 'target slippage, measured per fill' },
        { value: '0', label: 'broker reconciliation discrepancies' },
        { value: '100%', label: 'IaC — every stack reproducible from code' },
        { value: 'Auto', label: 'risk gates halt anomalous orders' },
      ],
      captionGrafana: 'Redacted Grafana — order latency & fill ratio',
      captionCloudwatch: 'Redacted CloudWatch — SLO alarm, healthy',
      note: 'Dashboards and alarms shown are redacted production captures. No P&L, no account identifiers.',
      cta: 'Read the engineering log',
    },
    method: {
      kicker: 'Method',
      title: 'How I work',
      body: 'I treat infrastructure as a product: immutable deployments, declarative state, and pipelines that fail loudly before they fail silently. Every change is reversible, every cost line is justified, and every system ships with the observability to prove it works — and the runbooks for when it does not.',
      principles: [
        {
          title: 'Immutable & declarative',
          body: 'Environments rebuilt from code, never patched by hand. The repo is the source of truth.',
        },
        {
          title: 'Cost-disciplined',
          body: 'Every resource justified; scale-to-zero where it makes sense. Reliability without a runaway bill.',
        },
        {
          title: 'Observable by default',
          body: 'SLOs, tracing, and runbooks ship with the system — not bolted on after the incident.',
        },
      ],
    },
    newsletter: {
      title: 'The Reliability Log',
      body: 'Field notes on cloud architecture, observability, and the incidents that taught me something. No growth hacks, no fluff — just engineering. One email when there is something worth your inbox.',
      placeholder: 'you@company.com',
      button: 'Subscribe',
      note: 'No spam. Unsubscribe anytime.',
    },
    blog: {
      title: 'Writing',
      subtitle: 'Engineering notes, architecture decisions, and post-mortems.',
      empty: 'No posts published yet. The first one is in the oven.',
      readMore: 'Read',
      backToList: '← All writing',
    },
    footer: {
      tagline: 'Reliability engineering for critical cloud systems.',
      builtWith: 'Built with Astro. Deployed on Vercel. Zero stock photos.',
      rights: 'All rights reserved.',
    },
    a11y: {
      skip: 'Skip to content',
      langSwitch: 'Switch language',
    },
  },

  es: {
    meta: {
      title: 'Mizolutions — Ingeniería de confiabilidad para sistemas cloud críticos',
      description:
        'Consultoría SRE senior: arquitectura cloud tolerante a fallos, observabilidad e Infraestructura como Código. Probada en Trinitrade, una plataforma de trading algorítmico en vivo con estándares institucionales.',
    },
    nav: {
      services: 'Servicios',
      case: 'Caso de estudio',
      method: 'Método',
      writing: 'Blog',
      contact: 'Contacto',
    },
    hero: {
      kicker: 'Ingeniería de confiabilidad · Cloud · SRE',
      title: 'Ingeniería de confiabilidad para sistemas que no se pueden permitir fallar.',
      subtitle:
        'Mizolutions es la práctica de ingeniería de un SRE senior que diseña infraestructura cloud tolerante a fallos, observable y con disciplina de costos — probada en Trinitrade, una plataforma de trading algorítmico en vivo construida con estándares institucionales.',
      ctaPrimary: 'Agenda una revisión de confiabilidad',
      ctaSecondary: 'Lee el caso de estudio de Trinitrade',
    },
    services: {
      heading: 'Qué construyo',
      items: [
        {
          title: 'Arquitectura Cloud-Native',
          body: 'Cargas cloud de alto rendimiento sobre ECS Fargate, Postgres/Timescale y backbones orientados a eventos. Diseñadas para escalar, facturadas por lo que realmente usas.',
        },
        {
          title: 'SRE y Observabilidad',
          body: 'SLOs, alertas accionables y trazas de extremo a extremo que convierten pages de las 3 a.m. en post-mortems de las 9 a.m. Señales reales, no sopa de logs.',
        },
        {
          title: 'Infraestructura como Código',
          body: 'Cada entorno reproducible desde un solo `cdk deploy`. Despliegues inmutables, aislamiento de blast-radius y recuperación ante desastres que sí has probado.',
        },
      ],
    },
    caseStudy: {
      kicker: 'Caso de estudio',
      title: 'Trinitrade — confiabilidad institucional con un presupuesto de $100',
      body: 'Una plataforma de trading algorítmico en vivo que corre por completo en la nube sobre ECS Fargate y TimescaleDB, aprovisionada de extremo a extremo como código con CDK. Trinitrade no es un producto de enriquecimiento rápido — es un campo de pruebas para la ingeniería de confiabilidad que llevo a mis clientes: despliegues inmutables, conciliación automatizada con el broker, chaos drills y alertas respaldadas por SLOs.',
      metrics: [
        { value: '< 30 bps', label: 'slippage objetivo, medido por fill' },
        { value: '0', label: 'discrepancias de conciliación con el broker' },
        { value: '100%', label: 'IaC — cada stack reproducible desde código' },
        { value: 'Auto', label: 'compuertas de riesgo frenan órdenes anómalas' },
      ],
      captionGrafana: 'Grafana redactado — latencia de orden y ratio de fills',
      captionCloudwatch: 'CloudWatch redactado — alarma de SLO, sana',
      note: 'Los dashboards y alarmas mostrados son capturas de producción redactadas. Sin P&L, sin identificadores de cuenta.',
      cta: 'Lee el log de ingeniería',
    },
    method: {
      kicker: 'Método',
      title: 'Cómo trabajo',
      body: 'Trato la infraestructura como un producto: despliegues inmutables, estado declarativo y pipelines que fallan ruidosamente antes de fallar en silencio. Cada cambio es reversible, cada línea de costo está justificada y cada sistema se entrega con la observabilidad para demostrar que funciona — y los runbooks para cuando no.',
      principles: [
        {
          title: 'Inmutable y declarativo',
          body: 'Entornos reconstruidos desde código, nunca parcheados a mano. El repo es la fuente de verdad.',
        },
        {
          title: 'Disciplina de costos',
          body: 'Cada recurso justificado; scale-to-zero donde tiene sentido. Confiabilidad sin una factura desbocada.',
        },
        {
          title: 'Observable por defecto',
          body: 'SLOs, trazas y runbooks se entregan con el sistema — no atornillados después del incidente.',
        },
      ],
    },
    newsletter: {
      title: 'The Reliability Log',
      body: 'Notas de campo sobre arquitectura cloud, observabilidad y los incidentes que me enseñaron algo. Sin growth hacks, sin relleno — solo ingeniería. Un correo cuando haya algo que valga tu bandeja.',
      placeholder: 'tu@empresa.com',
      button: 'Suscribirme',
      note: 'Sin spam. Cancela cuando quieras.',
    },
    blog: {
      title: 'Blog',
      subtitle: 'Notas de ingeniería, decisiones de arquitectura y post-mortems.',
      empty: 'Aún no hay posts publicados. El primero está en el horno.',
      readMore: 'Leer',
      backToList: '← Todo el blog',
    },
    footer: {
      tagline: 'Ingeniería de confiabilidad para sistemas cloud críticos.',
      builtWith: 'Hecho con Astro. Desplegado en Vercel. Cero fotos de stock.',
      rights: 'Todos los derechos reservados.',
    },
    a11y: {
      skip: 'Saltar al contenido',
      langSwitch: 'Cambiar idioma',
    },
  },
} as const;
