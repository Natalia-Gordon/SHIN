import { isPlatformServer } from '@angular/common';
import { Directive, ElementRef, HostListener, PLATFORM_ID, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';

const PRERENDERED = 'data-prerendered';

/** Renders archive HTML once per value so Chrome translation is not wiped on the next change-detection pass. */
@Directive({
  selector: '[appStaticHtml]',
})
export class StaticHtml {
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
  private rendered = '';

  readonly appStaticHtml = input.required<string>();

  constructor() {
    effect(() => {
      const html = this.appStaticHtml();
      if (html === this.rendered) return;
      const host = this.element.nativeElement;
      // Keep the prerendered markup on first load instead of rebuilding identical DOM (and reloading images).
      if (!this.isServer && !this.rendered && host.hasAttribute(PRERENDERED)) {
        host.removeAttribute(PRERENDERED);
        this.rendered = html;
        return;
      }
      this.rendered = html;
      host.innerHTML = html;
      if (this.isServer) host.setAttribute(PRERENDERED, '');
    });
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    if (!href.startsWith('/') || anchor.getAttribute('target')) return;
    event.preventDefault();
    void this.router.navigateByUrl(href);
  }
}
