import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ContentService } from './content/content.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly content = inject(ContentService);

  protected readonly site = toSignal(this.content.site$, { initialValue: null });
  protected readonly menuOpen = signal(false);
  protected readonly groupOpen = signal('');

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.menuOpen.set(false);
      this.groupOpen.set('');
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
