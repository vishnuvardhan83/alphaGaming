import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse, LoginRequest, OtpSentResponse, RegisterRequest, ResetPasswordRequest, UserSummary,
} from './auth.models';

export const API_BASE = 'http://localhost:8080/api';
const TOKEN_KEY = 'aq_token';
const USER_KEY = 'aq_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<UserSummary | null>(this.readStoredUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  constructor(private readonly http: HttpClient) {}

  get token(): string | null { return localStorage.getItem(TOKEN_KEY); }

  // ---- Registration ----
  requestRegisterOtp(mobile: string): Observable<OtpSentResponse> {
    return this.http.post<OtpSentResponse>(`${API_BASE}/auth/register/request-otp`, { mobile });
  }
  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/register`, req).pipe(tap((r) => this.store(r)));
  }

  // ---- Login ----
  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/login`, req).pipe(tap((r) => this.store(r)));
  }

  // ---- Password recovery ----
  requestResetOtp(mobile: string): Observable<OtpSentResponse> {
    return this.http.post<OtpSentResponse>(`${API_BASE}/auth/forgot-password/request-otp`, { mobile });
  }
  resetPassword(req: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE}/auth/reset-password`, req);
  }

  // ---- Session ----
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  private store(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private readStoredUser(): UserSummary | null {
    try { const raw = localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) as UserSummary : null; }
    catch { return null; }
  }
}
