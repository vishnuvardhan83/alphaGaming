import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../auth/auth.service';
import { AdminBooking, SetupAdmin } from './admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  bookings(status?: string): Observable<AdminBooking[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<AdminBooking[]>(`${API_BASE}/admin/bookings`, { params });
  }
  assignableSetups(reference: string): Observable<string[]> {
    return this.http.get<string[]>(`${API_BASE}/admin/bookings/${reference}/assignable-setups`);
  }
  approve(reference: string, setupCodes: string[]): Observable<AdminBooking> {
    return this.http.post<AdminBooking>(`${API_BASE}/admin/bookings/${reference}/approve`, { setupCodes });
  }
  reject(reference: string, reason: string): Observable<AdminBooking> {
    return this.http.post<AdminBooking>(`${API_BASE}/admin/bookings/${reference}/reject`, { reason });
  }
  setups(): Observable<SetupAdmin[]> {
    return this.http.get<SetupAdmin[]>(`${API_BASE}/admin/setups`);
  }
  setSetupStatus(code: string, status: string): Observable<SetupAdmin> {
    return this.http.post<SetupAdmin>(`${API_BASE}/admin/setups/${code}/status`, { status });
  }
}
