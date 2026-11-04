import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContentService } from '../content/content.service';
import { SitePage } from '../content/site.model';

@Component({
  selector: 'app-search',
  imports: [RouterLink],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class SearchPage {
  private readonly content = inject(ContentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly site = toSignal(this.content.site$, { initialValue: null });

  protected readonly query = signal('');

  protected readonly results = computed(() => {
    const site = this.site();
    const term = this.query().trim().toLowerCase();
    if (!site || term.length < 2) return [];
    return site.pages
      .filter((page) => page.path !== '/')
      .filter((page) => page.title.toLowerCase().includes(term) || page.text.toLowerCase().includes(term))
      .slice(0, 40)
      .map((page) => ({ page, snippet: this.snippet(page, term) }));
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => this.query.set(params.get('q') ?? ''));
  }

  protected onInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) this.update(target.value);
  }

  protected update(value: string): void {
    this.query.set(value);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null },
      replaceUrl: true,
    });
  }

  private snippet(page: SitePage, term: string): string {
    const text = page.text;
    const index = text.toLowerCase().indexOf(term);
    if (index < 0) return text.slice(0, 180);
    const start = Math.max(0, index - 70);
    const excerpt = text.slice(start, index + term.length + 110).trim();
    return (start > 0 ? '…' : '') + excerpt + '…';
  }
}
