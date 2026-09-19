import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BRAND, NAV_LINKS } from '../../core/content';

@Component({
  selector: 'aq-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly brand = BRAND;
  protected readonly links = NAV_LINKS;
  protected readonly year = 2026;
}
