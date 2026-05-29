import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mensaje } from '../models/mensaje';

@Injectable({
  providedIn: 'root',
})
export class MensajeService {

  private readonly url = 'https://backendproyectointermodular-production.up.railway.app/api';

  constructor(private http: HttpClient) { }

  // Mensajes
  getMensajes(): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.url}/mensajes`);
  }
  // Mensaje
  getMensaje(id: number): Observable<Mensaje> {
    return this.http.get<Mensaje>(`${this.url}/mensajes/${id}`);
  }
  // Mensaje usuario
  getReservasUsuario(receptorId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.url}/usuarios/${receptorId}/mensajes`)
  }

  createMensaje(mensaje: Mensaje): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.url}/mensajes`, mensaje);
  }

  deleteMensaje(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/mensajes/${id}`);
  }

  updateMensaje(id: number, mensaje: Mensaje): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${this.url}/mensajes/${id}`, mensaje);
  }

  getMensajesEnviados(emisorId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.url}/usuarios/${emisorId}/mensajes/enviados`);
  }

}
