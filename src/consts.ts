/**
 * Site-wide constants. Single source of truth for brand metadata,
 * navigation, and social links. Edit here, not in components.
 */

export const SITE = {
  brand: 'Mizolutions',
  domain: 'mizolutions.com',
  url: 'https://mizolutions.com',
  /** Short technical domain — backend / API / dashboards. Not linked publicly. */
  technicalDomain: 'miz0.com',
  /** Product / flagship case study name. */
  product: 'Trinitrade',
  /** Blog lives on a subdomain (see README for the Vercel mapping). */
  blogDomain: 'blog.mizolutions.com',
} as const;

/** Contact target for the primary CTA. Swap mailto for a Cal.com link if desired. */
export const CONTACT_HREF =
  import.meta.env.PUBLIC_CONTACT_HREF ?? 'mailto:hello@mizolutions.com';

/** Buttondown username used by the newsletter embed form action. */
export const BUTTONDOWN_USERNAME =
  import.meta.env.PUBLIC_BUTTONDOWN_USERNAME ?? 'mizolutions';

export const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/mizolutions' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/mizolutions' },
  { label: 'X', href: 'https://x.com/mizolutions' },
  { label: 'Email', href: 'mailto:hello@mizolutions.com' },
] as const;
