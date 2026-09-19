import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Branded centered card used by all auth pages. */
@Component({
  selector: 'aq-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  readonly heading = input.required<string>();
  readonly sub = input<string>('');
}
