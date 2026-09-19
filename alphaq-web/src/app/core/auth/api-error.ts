import { HttpErrorResponse } from '@angular/common/http';

/** Turns any HTTP failure into a safe, user-facing message. */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the server. Is the backend running?';
    const body = err.error as { message?: string; fieldErrors?: Record<string, string> } | null;
    if (body?.fieldErrors) {
      const first = Object.values(body.fieldErrors)[0];
      if (first) return first;
    }
    if (body?.message) return body.message;
  }
  return 'Something went wrong. Please try again.';
}
