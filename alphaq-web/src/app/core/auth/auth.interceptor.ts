import { HttpInterceptorFn } from '@angular/common/http';

/** Attaches the JWT bearer token to API requests when present. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('aq_token');
  if (token && req.url.includes('/api/')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
