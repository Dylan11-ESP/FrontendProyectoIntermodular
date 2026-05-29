import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reserva } from '../models/reserva';


@Injectable({
  providedIn: 'root',
})
export class ReservaService {

  private readonly url = 'https://backendproyectointermodular-production.up.railway.app/api';

  constructor(private http: HttpClient) { }

  // Reservas
  getReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.url}/reservas`);
  }
  // Reserva
  getReserva(id: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.url}/reservas/${id}`);
  }
  // Reservas usuario
  getReservasUsuario(usuarioId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.url}/usuarios/${usuarioId}/reservas`)
  }
  // Reservas vivienda
  getReservasVivienda(viviendaId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.url}/viviendas/${viviendaId}/reservas`)
  }

  createReserva(reserva: Reserva): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.url}/reservas`, reserva);
  }

  updateReserva(id: number, reserva: Reserva): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.url}/reservas/${id}`, reserva);
  }

  deleteReserva(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/reservas/${id}`);
  }

}
