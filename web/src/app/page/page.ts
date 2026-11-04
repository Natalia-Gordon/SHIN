import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ContentService } from '../content/content.service';
import { SitePage } from '../content/site.model';
import { StaticHtml } from '../content/static-html';
import { ContactForm } from '../contact-form/contact-form';

@Component({
  selector: 'app-page',
  imports: [RouterLink, DatePipe, StaticHtml, ContactForm],
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
    return { state: 'ready' as const, page, crumbs: this.crumbs(site.pages, page) };
  });

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
}
