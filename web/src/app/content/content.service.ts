import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import { SiteConfig, SiteData } from './site.model';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  readonly site$: Observable<SiteData> = this.http
    .get<SiteData>('content/site.json')
    .pipe(shareReplay(1));

  /** Served by server/server.mjs; the form is enabled once Gmail SMTP is configured on Cloud Run. */
  readonly config$: Observable<SiteConfig> = this.http.get<SiteConfig>('config.json').pipe(
    catchError(() => of({ contactFormEnabled: false })),
    shareReplay(1),
  );
}
