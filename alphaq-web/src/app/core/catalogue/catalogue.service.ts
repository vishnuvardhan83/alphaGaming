import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../auth/auth.service';
import { GameCard, PlatformPricing, SetupSummary } from './catalogue.models';

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly http = inject(HttpClient);

  pricing(): Observable<PlatformPricing[]> {
    return this.http.get<PlatformPricing[]>(`${API_BASE}/public/pricing`);
  }
  games(): Observable<GameCard[]> {
    return this.http.get<GameCard[]>(`${API_BASE}/public/games`);
  }
  setups(): Observable<SetupSummary[]> {
    return this.http.get<SetupSummary[]>(`${API_BASE}/public/setups`);
  }
}
