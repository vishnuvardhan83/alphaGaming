import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Allows only OWNER/ADMIN; others go home (or login if signed out). */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = auth.user()?.roles ?? [];
  if (auth.isLoggedIn() && (roles.includes('OWNER') || roles.includes('ADMIN'))) return true;
  return router.createUrlTree([auth.isLoggedIn() ? '/' : '/login']);
};
