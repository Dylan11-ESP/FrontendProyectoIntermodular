import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Usuario } from '../../models/usuario';
import { Mensaje } from '../../models/mensaje';
import { MensajeService } from '../../services/mensaje-service';
import { ServicioCompartido } from '../../services/servicio-compartido';

@Component({
  selector: 'app-mensajes',
  imports: [CommonModule, FormsModule],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.css',
})
export class Mensajes {

  usuario: Usuario = {} as Usuario;
  mensajes: Mensaje[] = [];
  mensajesEnviados: Mensaje[] = [];
  respuestas: any = {};
  seccion: string = 'recibidos';
  mensajeEditandoId: number | null = null;
  contenidoEditado: string = '';

  constructor(private route: Router, private mensajeServicio: MensajeService, private cdr: ChangeDetectorRef, private servicioCompartido: ServicioCompartido) { }

  ngOnInit() {
    const usuario = this.servicioCompartido.getUsuario();
    if (usuario) {
      this.usuario = usuario;
      this.cargarMensajes();
      this.cargarMensajesEnviados();
    } else {
      this.route.navigate(['/']);
    }
  }

  prepararEditar(mensaje: Mensaje) {
    this.mensajeEditandoId = mensaje.id!;
    this.contenidoEditado = mensaje.contenido;
  }
  guardarEdicion(mensaje: Mensaje) {
    if (!this.contenidoEditado.trim()) return;
    const mensajeEditado = { ...mensaje, contenido: this.contenidoEditado };
    this.mensajeServicio.updateMensaje(mensaje.id!, mensajeEditado).subscribe({
      next: () => {
        mensaje.contenido = this.contenidoEditado;
        this.mensajeEditandoId = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al editar mensaje', err)
    });
  }
  cargarMensajes() {
    this.mensajeServicio.getReservasUsuario(this.usuario.id!).subscribe({
      next: (datos) => {
        this.mensajes = datos;
        datos.filter(m => !m.leido).forEach(m => {
          const mensajeLeido = { ...m, leido: true };
          this.mensajeServicio.updateMensaje(m.id!, mensajeLeido).subscribe();
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar mensajes', err)
    });
  }

  cargarMensajesEnviados() {
    this.mensajeServicio.getMensajesEnviados(this.usuario.id!).subscribe({
      next: (datos) => {
        this.mensajesEnviados = datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar mensajes enviados', err)
    });
  }

  responder(mensaje: Mensaje) {
    const contenido = this.respuestas[mensaje.id!];
    if (!contenido || contenido.trim() === '') return;

    const respuesta: Mensaje = {
      emisor: this.usuario,
      receptor: mensaje.emisor,
      contenido: contenido.trim(),
      leido: false
    };

    this.mensajeServicio.createMensaje(respuesta).subscribe({
      next: () => {
        this.respuestas[mensaje.id!] = '';
        this.cargarMensajesEnviados();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al enviar mensaje', err)
    });
  }

  eliminar(id: number | undefined) {
    if (!id) return;
    if (!confirm('¿Seguro que quieres eliminar este mensaje?')) return;
    this.mensajeServicio.deleteMensaje(id).subscribe({
      next: () => {
        if (this.seccion === 'recibidos') {
          this.mensajes = this.mensajes.filter(m => m.id !== id);
        } else {
          this.mensajesEnviados = this.mensajesEnviados.filter(m => m.id !== id);
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al eliminar mensaje', err)
    });
  }

  volver() {
    this.route.navigate(['/principal']);
  }
}