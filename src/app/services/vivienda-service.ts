import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vivienda } from '../models/vivienda';
@Injectable({
    providedIn: 'root',
})
export class ViviendaService {

    private readonly url = 'https://backendproyectointermodular-production.up.railway.app/api';

    constructor(private http: HttpClient) { }

    // Viviendas
    getViviendas(): Observable<Vivienda[]> {
        return this.http.get<Vivienda[]>(`${this.url}/viviendas`);
    }
    // Vivienda
    getVivienda(id: number): Observable<Vivienda> {
        return this.http.get<Vivienda>(`${this.url}/viviendas/${id}`);
    }

    // Viviendas por ciudad
    getViviendasCiudad(ciudad: string): Observable<Vivienda[]> {
        return this.http.get<Vivienda[]>(`${this.url}/viviendas/ciudad/${ciudad}`);
    }

    createVivienda(vivienda: Vivienda): Observable<Vivienda> {
        return this.http.post<Vivienda>(`${this.url}/viviendas`, vivienda);
    }

    updateVivienda(id: number, vivienda: Vivienda): Observable<Vivienda> {
        return this.http.put<Vivienda>(`${this.url}/viviendas/${id}`, vivienda);
    }

    deleteVivienda(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/viviendas/${id}`);
    }

    // Viviendas por usuario
    getViviendasUsuario(usuarioId: number): Observable<Vivienda[]> {
        return this.http.get<Vivienda[]>(`${this.url}/usuarios/${usuarioId}/viviendas`);
    }

    valorarVivienda(id: number, puntuacion: number): Observable<Vivienda> {
        return this.http.put<Vivienda>(`${this.url}/viviendas/${id}/valorar`, { puntuacion });
    }

    getRanking(): Observable<Vivienda[]> {
        return this.http.get<Vivienda[]>(`${this.url}/viviendas/ranking`);
    }

}