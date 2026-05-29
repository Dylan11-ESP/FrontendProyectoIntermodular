import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario';

@Injectable({
    providedIn: 'root',
})
export class UsuarioService {
    private readonly url = 'https://backendproyectointermodular-production.up.railway.app/api';

    constructor(private http: HttpClient) { }


    login(email: string, password: string): Observable<Usuario> {
        return this.http.post<Usuario>(`${this.url}/login`, { email, password });
    }
    // Usuarios
    getUsuarios(): Observable<Usuario[]> {
        return this.http.get<Usuario[]>(`${this.url}/usuarios`);
    }
    // Usuario
    getUsuario(id: number): Observable<Usuario> {
        return this.http.get<Usuario>(`${this.url}/usuarios/${id}`);
    }

    createUsuario(usuario: Usuario): Observable<Usuario> {
        return this.http.post<Usuario>(`${this.url}/usuarios`, usuario);
    }

    updateUsuario(id: number, usuario: Usuario): Observable<Usuario> {
        return this.http.put<Usuario>(`${this.url}/usuarios/${id}`, usuario);
    }

    deleteUsuario(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/usuarios/${id}`);
    }

    cambiarPassword(id: number, passwordActual: string, passwordNueva: string): Observable<void> {
        return this.http.put<void>(`${this.url}/usuarios/${id}/password`, { passwordActual, passwordNueva });
    }
}
