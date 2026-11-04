import { Component, DestroyRef, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ContentService } from './content/content.service';
import { FooterCredits } from './footer-credits/footer-credits';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FooterCredits],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly content = inject(ContentService);
  private readonly header = viewChild.required<ElementRef<HTMLElement>>('siteHeader');

  protected readonly site = toSignal(this.content.site$, { initialValue: null });
  protected readonly menuOpen = signal(false);
  protected readonly groupOpen = signal('');
  protected readonly year = new Date().getFullYear();

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.menuOpen.set(false);
      this.groupOpen.set('');
    });

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const header = this.header().nativeElement;
      const observer = new ResizeObserver(() => {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
      });
      observer.observe(header);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected toggleGroup(label: string): void {
    this.groupOpen.update((current) => (current === label ? '' : label));
  }

  protected groupIsOpen(label: string): boolean {
    return this.groupOpen() === label;
  }
}
