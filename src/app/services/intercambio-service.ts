import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IntercambioModelo } from '../models/intercambioModelo';

@Injectable({
  providedIn: 'root',
})
export class IntercambioService {
  private readonly url = 'https://backendproyectointermodular-production.up.railway.app/api';

  constructor(private http: HttpClient) { }

  // Intercambios
  getIntercambios(): Observable<IntercambioModelo[]> {
    return this.http.get<IntercambioModelo[]>(`${this.url}/intercambios`);
  }
  // Intercambio
  getIntercambio(id: number): Observable<IntercambioModelo> {
    return this.http.get<IntercambioModelo>(`${this.url}/intercambios/${id}`);
  }

  createIntercambio(intercambio: IntercambioModelo): Observable<IntercambioModelo> {
    return this.http.post<IntercambioModelo>(`${this.url}/intercambios`, intercambio);
  }

  updateIntercambio(id: number, intercambio: IntercambioModelo): Observable<IntercambioModelo> {
    return this.http.put<IntercambioModelo>(`${this.url}/intercambios/${id}`, intercambio);
  }

  deleteIntercambio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/intercambios/${id}`);
  }
}