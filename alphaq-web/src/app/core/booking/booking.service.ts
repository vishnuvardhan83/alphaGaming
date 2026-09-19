import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../auth/auth.service';
import { Availability, Booking, CreateBookingRequest } from './booking.models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  availability(platform: string, date: string, start: string, end: string): Observable<Availability> {
    const params = new HttpParams().set('platform', platform).set('date', date).set('start', start).set('end', end);
    return this.http.get<Availability>(`${API_BASE}/public/availability`, { params });
  }

  create(req: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${API_BASE}/bookings`, req);
  }

  pay(reference: string): Observable<Booking> {
    return this.http.post<Booking>(`${API_BASE}/bookings/${reference}/pay`, {});
  }

  cancel(reference: string): Observable<Booking> {
    return this.http.post<Booking>(`${API_BASE}/bookings/${reference}/cancel`, {});
  }

  mine(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API_BASE}/bookings`);
  }
}
