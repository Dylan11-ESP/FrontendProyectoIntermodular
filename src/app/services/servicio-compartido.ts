import { Injectable } from '@angular/core';
import { Usuario } from '../models/usuario';

@Injectable({
  providedIn: 'root',
})
export class ServicioCompartido {
  private usuario: Usuario | null = null;

setUsuario(usuario: Usuario) {
    this.usuario = usuario;
    const usuarioSinPassword = { ...usuario, password: '' };
    sessionStorage.setItem('usuario', JSON.stringify(usuarioSinPassword));
}

  getUsuario(): Usuario | null {
    if (!this.usuario) {
      const storage = sessionStorage.getItem('usuario');
      if (storage) this.usuario = JSON.parse(storage);
    }
    return this.usuario;
  }

  cerrarSesion() {
    this.usuario = null;
    sessionStorage.removeItem('usuario');
  }

  estaLogueado(): boolean {
    return this.getUsuario() !== null;
  }
}