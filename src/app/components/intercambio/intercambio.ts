import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../models/usuario';
import { Vivienda } from '../../models/vivienda';
import { Reserva } from '../../models/reserva';
import { IntercambioModelo } from '../../models/intercambioModelo';
import { ReservaService } from '../../services/reserva-service';
import { ViviendaService } from '../../services/vivienda-service';
import { IntercambioService } from '../../services/intercambio-service';
import { ServicioCompartido } from '../../services/servicio-compartido';

@Component({
  selector: 'app-intercambio',
  imports: [CommonModule],
  templateUrl: './intercambio.html',
  styleUrl: './intercambio.css',
})
export class Intercambio {

  usuario: Usuario = {} as Usuario;
  reserva: Reserva | null = null;
  viviendasSolicitante: Vivienda[] = [];
  viviendaElegida: Vivienda | null = null;
  intercambioCreado: boolean = false;
  error: string = '';

  constructor(private activatedRoute: ActivatedRoute, private route: Router, private reservaServicio: ReservaService, private viviendaServicio: ViviendaService, private intercambioServicio: IntercambioService, private cdr: ChangeDetectorRef, private servicioCompartido: ServicioCompartido) { }

  ngOnInit() {
    const usuario = this.servicioCompartido.getUsuario();
    if (usuario) {
      this.usuario = usuario;
    } else {
      this.route.navigate(['/']);
      return;
    }

    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
    this.reservaServicio.getReserva(id).subscribe({
      next: (datos) => {
        this.reserva = datos;
        this.cargarViviendasSolicitante(datos.usuario.id!);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar reserva', err)
    });
  }

  cargarViviendasSolicitante(usuarioId: number) {
    this.viviendaServicio.getViviendasUsuario(usuarioId).subscribe({
      next: (datos) => {
        this.viviendasSolicitante = datos.filter(v => v.tipo === 'INTERCAMBIO' && v.activa);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar viviendas', err)
    });
  }

  elegirVivienda(vivienda: Vivienda) {
    this.viviendaElegida = vivienda;
  }

  confirmarIntercambio() {
    this.error = '';

    if (!this.viviendaElegida) {
      this.error = 'Debes elegir una vivienda para el intercambio.';
      return;
    }

    const reservaAceptada = { ...this.reserva!, estado: 'CONFIRMADA' };
    this.reservaServicio.updateReserva(this.reserva!.id!, reservaAceptada).subscribe({
      next: () => {
        const reservaInversa: Reserva = {
          vivienda: this.viviendaElegida!,
          usuario: this.reserva!.vivienda.usuario,
          fechaInicio: this.reserva!.fechaInicio,
          fechaFin: this.reserva!.fechaFin,
          estado: 'CONFIRMADA',
          tipo: 'INTERCAMBIO'
        };
        this.reservaServicio.createReserva(reservaInversa).subscribe({
          next: (reservaDestino) => {
            const intercambio: IntercambioModelo = {
              reservaOrigen: reservaAceptada,
              reservaDestino: reservaDestino,
              estado: 'Pendiente'
            };
            this.intercambioServicio.createIntercambio(intercambio).subscribe({
              next: () => {
                this.intercambioCreado = true;
                this.cdr.detectChanges();
              },
              error: (err) => console.error('Error al crear intercambio', err)
            });
          },
          error: (err) => console.error('Error al crear reserva inversa', err)
        });
      },
      error: (err) => console.error('Error al aceptar reserva', err)
    });
  }

  volver() {
    this.route.navigate(['/perfil']);
  }
}