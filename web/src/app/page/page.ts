import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ContentService } from '../content/content.service';
import { ParagraphClass, toParagraphs } from '../content/paragraphs';
import { SitePage } from '../content/site.model';
import { StaticHtml } from '../content/static-html';
import { ContactForm } from '../contact-form/contact-form';
import { Overview, OVERVIEWS } from '../content/overview';
import {
  SITE_DESCRIPTION,
  SITE_URL,
  SeoData,
  SeoService,
  absoluteUrl,
  organizationJsonLd,
} from '../content/seo.service';
import { SectionOverview } from '../section-overview/section-overview';

interface SectionNav {
  owner: SitePage;
  items: SitePage[];
}

@Component({
  selector: 'app-page',
  imports: [RouterLink, DatePipe, StaticHtml, ContactForm, SectionOverview],
  templateUrl: './page.html',
  styleUrl: './page.scss',
})
export class PageView {
  private readonly router = inject(Router);
  private readonly content = inject(ContentService);
  private readonly site = toSignal(this.content.site$, { initialValue: null });
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0]),
      startWith(this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  protected readonly view = computed(() => {
    const site = this.site();
    const path = this.path() || '/';
    if (!site) return { state: 'loading' as const };
    const page = site.pages.find((item) => item.path === path);
    if (!page) return { state: 'missing' as const };
    return {
      state: 'ready' as const,
      page,
      html: toParagraphs(page.html, page.slug === 'about-us' ? aboutClasses() : undefined),
      overview: OVERVIEWS[page.path] ?? null,
      crumbs: this.crumbs(site.pages, page),
      section: this.section(site.pages, page),
    };
  });

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const view = this.view();
      if (view.state === 'loading') return;
      if (view.state === 'missing') {
        seo.update({ title: 'Page not found', description: SITE_DESCRIPTION, path: this.path(), noindex: true });
        return;
      }
      seo.update(pageSeo(view.page, view.crumbs, view.overview));
    });
  }

  protected isReading(page: SitePage): boolean {
    return page.slug === 'about-us';
  }

  private crumbs(pages: SitePage[], page: SitePage): SitePage[] {
    const trail: SitePage[] = [];
    let current: SitePage | undefined = page;
    const seen = new Set<number>();
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      trail.unshift(current);
      current = pages.find((item) => item.id === current?.parentId);
    }
    return trail;
  }

  /** Pages that share this page's parent, in the order the parent lists them. */
  private section(pages: SitePage[], page: SitePage): SectionNav | null {
    let owner = pages.find((item) => item.id === page.parentId);
    while (owner && owner.path !== '/') {
      const items = childrenInOrder(pages, owner);
      if (items.length > 1) return { owner, items };
      owner = pages.find((item) => item.id === owner?.parentId);
    }
    return null;
  }
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim();
}

function pageSeo(page: SitePage, crumbs: SitePage[], overview: Overview | null): SeoData {
  const url = absoluteUrl(page.path);
  const description = overview
    ? `${overview.cards.map((card) => card.title).join(', ')}. ${overview.cards[0].summary[0]}`
    : plainText(page.html.replace(/<h([1-6])[^>]*>[\s\S]*?<\/h\1>/gi, ' ')) || plainText(page.html) || SITE_DESCRIPTION;
  const image = page.html.match(/<img[^>]+src="(\/media\/[^"]+)"/)?.[1];
  const isArticle = page.showDate;

  const webPage: Record<string, unknown> = {
    '@type': isArticle ? 'Article' : 'WebPage',
    '@id': `${url}#page`,
    url,
    [isArticle ? 'headline' : 'name']: page.title,
    description: plainText(description).slice(0, 300),
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
  if (image) webPage['image'] = absoluteUrl(image);
  if (isArticle) {
    webPage['datePublished'] = page.date;
    webPage['author'] = { '@id': `${SITE_URL}/#organization` };
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [{ path: '/', title: 'Home' }, ...crumbs.filter((crumb) => crumb.path !== '/')].map(
      (crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.title,
        item: absoluteUrl(crumb.path),
      }),
    ),
  };

  return {
    title: page.title,
    description,
    path: page.path,
    image,
    type: isArticle ? 'article' : 'website',
    jsonLd: [organizationJsonLd(), webPage, breadcrumb],
  };
}

function childrenInOrder(pages: SitePage[], owner: SitePage): SitePage[] {
  const children = pages.filter((item) => item.parentId === owner.id);
  const listed = [...owner.html.matchAll(/<ul class="child-pages">([\s\S]*?)<\/ul>/g)]
    .flatMap((match) => [...match[1].matchAll(/href="([^"]+)"/g)].map((link) => link[1]));
  const rank = (item: SitePage) => {
    const index = listed.indexOf(item.path);
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  return children.sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
}

/** Marks what the About page source already emphasizes: the label, the opening paragraph and the committee list. */
function aboutClasses(): ParagraphClass {
  let leadSet = false;
  return (inner, text) => {
    if (text.length < 40 && /^<strong>[\s\S]*<\/strong>$/.test(inner)) return 'kicker';
    if (inner.includes('/about/board-members')) return 'people';
    if (!leadSet && text.length > 80) {
      leadSet = true;
      return 'lead';
    }
    return '';
  };
}
