import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';

/**
 * `aqReveal` — subtle fade/rise as an element scrolls into view.
 * Respects prefers-reduced-motion (elements simply appear, no transform).
 */
@Directive({ selector: '[aqReveal]' })
export class RevealDirective implements AfterViewInit, OnDestroy {
  // Stagger delay in ms. Accepts a bare attribute (`aqReveal`) or a number (`[aqReveal]="120"`).
  @Input({ transform: (v: unknown) => Number(v) || 0 }) aqReveal = 0;

  private readonly el = inject(ElementRef<HTMLElement>);
  private io?: IntersectionObserver;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { node.classList.add('is-revealed'); return; }

    node.classList.add('aq-reveal');
    if (this.aqReveal) node.style.transitionDelay = `${this.aqReveal}ms`;

    this.io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          this.io?.unobserve(e.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    this.io.observe(node);
  }

  ngOnDestroy(): void { this.io?.disconnect(); }
}
