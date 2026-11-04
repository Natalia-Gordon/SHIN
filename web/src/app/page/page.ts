import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ContentService } from '../content/content.service';
import { ParagraphClass, toParagraphs } from '../content/paragraphs';
import { SitePage } from '../content/site.model';
import { StaticHtml } from '../content/static-html';
import { ContactForm } from '../contact-form/contact-form';
import { ProjectList } from '../project-list/project-list';

interface SectionNav {
  owner: SitePage;
  items: SitePage[];
}

@Component({
  selector: 'app-page',
  imports: [RouterLink, DatePipe, StaticHtml, ContactForm, ProjectList],
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
      crumbs: this.crumbs(site.pages, page),
      section: this.section(site.pages, page),
    };
  });

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
