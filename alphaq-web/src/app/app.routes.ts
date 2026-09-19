import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: "AlphaQ Gaming — Indore's Next-Level Gaming Café",
  },
  {
    path: 'book',
    canActivate: [authGuard],
    loadComponent: () => import('./features/booking/booking').then((m) => m.BookingPage),
    title: 'Book a setup — AlphaQ Gaming',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'My dashboard — AlphaQ Gaming',
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
    title: 'Admin — AlphaQ Gaming',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    title: 'Log in — AlphaQ Gaming',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
    title: 'Create account — AlphaQ Gaming',
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
    title: 'Reset password — AlphaQ Gaming',
  },
  { path: '**', redirectTo: '' },
];
