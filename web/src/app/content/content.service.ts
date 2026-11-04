import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { SiteData } from './site.model';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  readonly site$: Observable<SiteData> = this.http
    .get<SiteData>('content/site.json')
    .pipe(shareReplay(1));
}
