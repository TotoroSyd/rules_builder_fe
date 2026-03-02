// services/api.service.ts

import { Injectable } from '@angular/core';
import axios, { AxiosInstance } from 'axios';
import { from, Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Contact, Rule, SavedRule } from '../models/audience-rule.model';
import { environment } from '../environments/environment';

export interface SaveRulePayload {
  name: string;
  description?: string;
  rule: Rule;
}

interface EvaluateResponse {
  success: boolean;
  data: { rule: Rule; matched_count: number; contacts: Contact[] };
  message: string;
}

interface SaveRuleResponse {
  success: boolean;
  data: { saved: SavedRule };
  message: string;
}

interface GetRulesResponse {
  success: boolean;
  data: { count: number; rules: SavedRule[] };
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http: AxiosInstance = axios.create({
    baseURL: environment.baseUrl,
    timeout: 10_000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.authToken}`
    }
  });

  getContacts(rule: Rule): Observable<Contact[]> {
    console.log('Sending rule to API:', rule);
    return from(this.http.post<EvaluateResponse>('/evaluate', rule)).pipe(
      map(res => res.data.data.contacts),
      tap(res => console.log('API response:', res)),
      catchError(err => { throw new Error(err?.message ?? 'Failed to fetch contacts'); })
    );
  }

  getRules(): Observable<SavedRule[]> {
    return from(this.http.get<GetRulesResponse>('/rules')).pipe(
      map(res => res.data.data.rules),
      tap(res => console.log('Fetched saved rules:', res)),
      catchError(err => { throw new Error(err?.message ?? 'Failed to fetch rules'); })
    );
  }

  saveRule(payload: SaveRulePayload): Observable<SavedRule> {
    return from(this.http.post<SaveRuleResponse>('/rules', payload)).pipe(
      map(res => res.data.data.saved),
      tap(res => console.log('Rule saved:', res)),
      catchError(err => { throw new Error(err?.message ?? 'Failed to save rule'); })
    );
  }
}
