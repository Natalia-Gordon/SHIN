import { Directive, ElementRef, HostListener, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';

/** Renders archive HTML once per value so Chrome translation is not wiped on the next change-detection pass. */
@Directive({
  selector: '[appStaticHtml]',
})
export class StaticHtml {
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private rendered = '';

  readonly appStaticHtml = input.required<string>();

  constructor() {
    effect(() => {
      const html = this.appStaticHtml();
      if (html === this.rendered) return;
      this.rendered = html;
      this.element.nativeElement.innerHTML = html;
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
