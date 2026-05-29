import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vivienda } from '../../models/vivienda';
import { Usuario } from '../../models/usuario';
import { Reserva } from '../../models/reserva';
import { Mensaje } from '../../models/mensaje';
import { ViviendaService } from '../../services/vivienda-service';
import { ReservaService } from '../../services/reserva-service';
import { MensajeService } from '../../services/mensaje-service';
import { ServicioCompartido } from '../../services/servicio-compartido';

@Component({
  selector: 'app-detalle-vivienda',
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-vivienda.html',
  styleUrl: './detalle-vivienda.css',
})
export class DetalleVivienda {

  vivienda: Vivienda | null = null;
  usuario: Usuario = {} as Usuario;
  reservasVivienda: Reserva[] = [];

  formularioReserva: boolean = false;
  errorReserva: string = '';
  reservaExitosa: boolean = false;

  fechaInicio: string = '';
  fechaFin: string = '';
  precioTotal: number | null = null;

  formularioMensaje: boolean = false;
  contenidoMensaje: string = '';
  errorMensaje: string = '';
  mensajeExitoso: boolean = false;

  cargandoReserva: boolean = false;
  cargandoMensaje: boolean = false;

  constructor(private activatedRoute: ActivatedRoute, private route: Router, private viviendaServicio: ViviendaService, private reservaServicio: ReservaService, private mensajeServicio: MensajeService, private cdr: ChangeDetectorRef, private servicioCompartido: ServicioCompartido) { }

  ngOnInit() {
    const usuario = this.servicioCompartido.getUsuario();
    if (usuario) {
      this.usuario = usuario;
    } else {
      this.route.navigate(['/']);
      return;
    }

    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));

    this.viviendaServicio.getVivienda(id).subscribe({
      next: (datos) => {
        this.vivienda = datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar vivienda', err)
    });

    this.reservaServicio.getReservasVivienda(id).subscribe({
      next: (datos) => {
        this.reservasVivienda = datos;
      },
      error: (err) => console.error('Error al cargar reservas', err)
    });
  }

  calcularPrecio() {
    if (!this.fechaInicio || !this.fechaFin || !this.vivienda?.precioNoche) {
      this.precioTotal = null;
      return;
    }
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    const dias = Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    if (dias > 0) {
      this.precioTotal = dias * this.vivienda.precioNoche;
    } else {
      this.precioTotal = null;
    }
    this.cdr.detectChanges();
  }

  reservar() {
    this.errorReserva = '';

    if (this.vivienda!.usuario?.id === this.usuario.id) {
      this.errorReserva = 'No puedes reservar tu propia vivienda.';
      return;
    }

    if (!this.fechaInicio) { this.errorReserva = 'La fecha de inicio es obligatoria.'; return; }
    if (!this.fechaFin) { this.errorReserva = 'La fecha de fin es obligatoria.'; return; }

    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (inicio < hoy) { this.errorReserva = 'La fecha de inicio no puede ser en el pasado.'; return; }
    if (fin <= inicio) { this.errorReserva = 'La fecha de fin debe ser posterior a la de inicio.'; return; }

    const solapada = this.reservasVivienda.some(r => {
      if (r.estado !== 'CONFIRMADA') return false;
      const inicio2 = new Date(r.fechaInicio);
      const fin2 = new Date(r.fechaFin);
      return inicio < fin2 && fin > inicio2;
    });

    if (solapada) {
      this.errorReserva = 'La vivienda ya está reservada en esas fechas.';
      return;
    }

    const reserva: Reserva = {
      vivienda: this.vivienda!,
      usuario: this.usuario,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      estado: 'PENDIENTE',
      tipo: this.vivienda!.tipo,
      precioTotal: this.precioTotal ?? undefined
    };

    this.cargandoReserva = true;

    this.reservaServicio.createReserva(reserva).subscribe({
      next: () => {
        this.cargandoReserva = false;
        this.reservaExitosa = true;
        this.formularioReserva = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al crear reserva', err);
        this.cargandoReserva = false;
      }
    });
  }

  enviarMensaje() {
    this.errorMensaje = '';

    if (this.vivienda!.usuario?.id === this.usuario.id) {
      this.errorMensaje = 'No puedes enviarte un mensaje a ti mismo.';
      return;
    }

    if (!this.contenidoMensaje.trim()) {
      this.errorMensaje = 'El mensaje no puede estar vacío.';
      return;
    }

    if (this.contenidoMensaje.length > 1000) {
      this.errorMensaje = 'El mensaje no puede superar los 1000 caracteres.';
      return;
    }

    const mensaje: Mensaje = {
      emisor: this.usuario,
      receptor: this.vivienda!.usuario,
      vivienda: this.vivienda!,
      contenido: this.contenidoMensaje.trim(),
      leido: false
    };

    this.cargandoMensaje = true;

    this.mensajeServicio.createMensaje(mensaje).subscribe({
      next: () => {
        this.cargandoMensaje = false;
        this.mensajeExitoso = true;
        this.formularioMensaje = false;
        this.contenidoMensaje = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoMensaje = false;
        this.errorMensaje = 'Error al enviar el mensaje. Inténtalo de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  volver() {
    this.route.navigate(['/principal']);
  }

  abrirFormularioReserva() {
    this.formularioReserva = !this.formularioReserva;
    setTimeout(() => {
      (window as any).flatpickr('#fechaInicio', {
        locale: 'es',
        dateFormat: 'Y-m-d',
        minDate: 'today',
        onChange: (selectedDates: Date[], dateStr: string) => {
          this.fechaInicio = dateStr;
          this.calcularPrecio();
        }
      });
      (window as any).flatpickr('#fechaFin', {
        locale: 'es',
        dateFormat: 'Y-m-d',
        minDate: 'today',
        onChange: (selectedDates: Date[], dateStr: string) => {
          this.fechaFin = dateStr;
          this.calcularPrecio();
        }
      });
    }, 100);
  }
}