import { HttpClient } from '@angular/common/http';
import { PlatformLocation, isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import { Observable, catchError, concat, of, shareReplay, tap } from 'rxjs';
import { SiteConfig, SiteData, SitePage } from './site.model';

const PAGE_DATA_KEY = makeStateKey<SiteData>('shin-page-data');

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformLocation = inject(PlatformLocation);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  /**
   * The prerendered page carries only the data it needs, so the browser can hydrate it at once.
   * The full archive (needed for search and navigation) loads right after.
   */
  readonly site$: Observable<SiteData> = this.loadSite().pipe(shareReplay(1));

  /** Served by server/server.mjs; the form is enabled once Gmail SMTP is configured on Cloud Run. */
  readonly config$: Observable<SiteConfig> = this.http.get<SiteConfig>('config.json').pipe(
    catchError(() => of({ contactFormEnabled: false })),
    shareReplay(1),
  );

  private loadSite(): Observable<SiteData> {
    const full$ = this.http.get<SiteData>('content/site.json');
    if (this.isServer) {
      return full$.pipe(
        tap((site) => this.transferState.set(PAGE_DATA_KEY, pageData(site, this.platformLocation.pathname))),
      );
    }
    const prerendered = this.transferState.get(PAGE_DATA_KEY, null);
    if (!prerendered) return full$;
    this.transferState.remove(PAGE_DATA_KEY);
    return concat(of(prerendered), full$);
  }
}

/** The page at `path`, its ancestors (with the lists that order their children) and their children. */
function pageData(site: SiteData, path: string): SiteData {
  const normalized = path.replace(/\/+$/, '') || '/';
  const current = site.pages.find((page) => page.path === normalized);
  if (!current) return { nav: site.nav, footer: site.footer, pages: [] };

  const byId = new Map(site.pages.map((page) => [page.id, page]));
  const lineage = new Set<number>();
  for (let page: SitePage | undefined = current; page && !lineage.has(page.id); page = byId.get(page.parentId)) {
    lineage.add(page.id);
  }

  const pages = site.pages
    .filter((page) => lineage.has(page.id) || lineage.has(page.parentId))
    .map((page) => (lineage.has(page.id) ? { ...page, text: '' } : { ...page, html: '', text: '' }));
  return { nav: site.nav, footer: site.footer, pages };
}
