import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import siteConfig from '../../site.config.json';

export interface SeoData {
  /** Page name; the site name is appended unless `fullTitle` is set. */
  title: string;
  fullTitle?: boolean;
  description: string;
  /** Site-relative path, for example `/about/about-us`. */
  path: string;
  /** Site-relative or absolute image URL. */
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: object[];
}

export const SITE_URL = siteConfig.siteUrl.replace(/\/+$/, '');
export const SITE_NAME = siteConfig.siteName;
export const ORGANIZATION_NAME = siteConfig.organizationName;
export const SITE_DESCRIPTION = siteConfig.description;
const DEFAULT_IMAGE = '/brand/logo.png';

export function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : SITE_URL + (path.startsWith('/') ? path : `/${path}`);
}

/** Cuts plain text to about `max` characters on a word boundary, for meta descriptions. */
export function summarize(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.–-]+$/, '') + '…';
}

/** The organization behind the site, as schema.org data. */
export function organizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    '@id': `${SITE_URL}/#organization`,
    name: ORGANIZATION_NAME,
    alternateName: ['SHIN', 'Shin', 'The Israeli Movement for Equal Representation of Women'],
    url: `${SITE_URL}/`,
    logo: absoluteUrl(DEFAULT_IMAGE),
    description: SITE_DESCRIPTION,
    foundingDate: '1989-02',
    founder: { '@type': 'Person', name: 'Esther Hertzog' },
    areaServed: { '@type': 'Country', name: 'Israel' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Almog 5',
      addressLocality: 'Michmoret',
      postalCode: '4092700',
      addressCountry: 'IL',
    },
    sameAs: ['https://www.facebook.com/pages/%D7%A4%D7%A8%D7%9C%D7%9E%D7%A0%D7%98-%D7%A0%D7%A9%D7%99%D7%9D/382265370469'],
  };
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  update(data: SeoData): void {
    const title = data.fullTitle ? data.title : `${data.title} | ${SITE_NAME}`;
    const url = absoluteUrl(data.path);
    const image = absoluteUrl(data.image || DEFAULT_IMAGE);
    const description = summarize(data.description);

    this.title.setTitle(title);
    this.setName('description', description);
    this.setName('robots', data.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    this.setProperty('og:type', data.type || 'website');
    this.setProperty('og:site_name', ORGANIZATION_NAME);
    this.setProperty('og:locale', 'en_US');
    this.setProperty('og:title', title);
    this.setProperty('og:description', description);
    this.setProperty('og:url', url);
    this.setProperty('og:image', image);
    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', title);
    this.setName('twitter:description', description);
    this.setName('twitter:image', image);
    this.setCanonical(data.noindex ? null : url);
    this.setJsonLd(data.jsonLd || []);
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content }, `name="${name}"`);
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property="${property}"`);
  }

  private setCanonical(url: string | null): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!url) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(items: object[]): void {
    let script = this.document.head.querySelector<HTMLScriptElement>('script#page-jsonld');
    if (!items.length) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.document.createElement('script');
      script.id = 'page-jsonld';
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    const nodes = items.map((item) => {
      const { '@context': _context, ...node } = item as Record<string, unknown>;
      return node;
    });
    const graph = { '@context': 'https://schema.org', '@graph': nodes };
    script.textContent = JSON.stringify(graph).replace(/</g, '\\u003c');
  }
}
