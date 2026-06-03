import { Component, ChangeDetectorRef } from '@angular/core';
import { Usuario } from '../../models/usuario';
import { Vivienda } from '../../models/vivienda';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViviendaService } from '../../services/vivienda-service';
import { MensajeService } from '../../services/mensaje-service';
import { ReservaService } from '../../services/reserva-service';
import { ServicioCompartido } from '../../services/servicio-compartido';

@Component({
  selector: 'app-principal',
  imports: [CommonModule, FormsModule],
  templateUrl: './principal.html',
  styleUrl: './principal.css',
})
export class Principal {

  usuario: Usuario = {} as Usuario;
  inicial: string = '';

  viviendas: Vivienda[] = [];
  viviendasFiltradas: Vivienda[] = [];

  filtroCiudad: string = '';
  filtroTipo: string = '';
  filtroCapacidad: number | null = null;
  filtroPrecioMin: number = 0;
  filtroPrecioMax: number = 10000000;
  precio: number = 0;

  mensajesSinLeer: number = 0;
  reservasSinVer: number = 0;

  vistaActual: 'tarjetas' | 'mapa' = 'tarjetas';
  mapa: any = null;

  constructor(private servicioCompartido: ServicioCompartido, private route: Router, private viviendaServicio: ViviendaService, private cdr: ChangeDetectorRef, private mensajeServicio: MensajeService, private reservaServicio: ReservaService) { }

  ngOnInit() {
    this.cargarUsuario();
    this.cargarViviendas();
  }

  cambiarVista(vista: 'tarjetas' | 'mapa') {
    this.vistaActual = vista;
    if (vista === 'mapa') {
      setTimeout(() => this.iniciarMapa(), 100);
    }
  }

  iniciarMapa() {
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
    }

    this.mapa = (window as any).L.map('mapa').setView([40.4168, -3.7038], 6);

    (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapa);

    const cluster = (window as any).L.markerClusterGroup();

    this.viviendasFiltradas.forEach(v => {
      if (!v.latitud || !v.longitud) return;

      const marker = (window as any).L.marker([v.latitud, v.longitud]);

      const popupContent = `
        <div style="text-align:center">
          <strong>${v.titulo}</strong><br>
          ${v.ciudad}, ${v.pais}<br>
          ${v.tipo === 'INTERCAMBIO' ? 'Intercambio' : v.precioNoche + ' €/noche'}<br><br>
          <button id="btn-vivienda-${v.id}" style="cursor:pointer; padding: 4px 10px; background:#4a90d9; color:white; border:none; border-radius:6px;">
            Ver detalle
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-vivienda-${v.id}`);
        if (btn) {
          btn.addEventListener('click', () => this.verDetalle(v.id));
        }
      });

      cluster.addLayer(marker);
    });

    this.mapa.addLayer(cluster);
  }

  cargarUsuario() {
    const usuario = this.servicioCompartido.getUsuario();
    if (usuario) {
      this.usuario = usuario;
      this.obtenerInicial();
      this.cargarMensajesSinLeer();
      this.cargarReservasSinVer();
    } else {
      this.usuario = {} as Usuario;
      this.inicial = '';
      this.route.navigate(['/']);
    }
  }

  cargarReservasSinVer() {
    this.viviendaServicio.getViviendasUsuario(this.usuario.id!).subscribe({
      next: (viviendas) => {
        let total = 0;
        viviendas.forEach(v => {
          this.reservaServicio.getReservasVivienda(v.id!).subscribe({
            next: (reservas) => {
              total += reservas.filter(r => !r.visto).length;
              this.reservasSinVer = total;
              this.cdr.detectChanges();
            }
          });
        });
      }
    });
  }

  cargarMensajesSinLeer() {
    this.mensajeServicio.getReservasUsuario(this.usuario.id!).subscribe({
      next: (datos) => {
        this.mensajesSinLeer = datos.filter(m => !m.leido).length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar mensajes', err)
    });
  }

  cargarViviendas() {
    this.viviendaServicio.getViviendas().subscribe({
      next: (datos) => {
        this.viviendas = datos.filter(v => v.activa && v.usuario?.id !== this.usuario.id);
        this.viviendasFiltradas = this.viviendas;
        const precios = this.viviendasFiltradas
          .filter(v => v.tipo === 'ALQUILER' && v.precioNoche != null)
          .map(v => v.precioNoche!);

        this.filtroPrecioMax = precios.length > 0 ? Math.max(...precios) : 0;
        this.filtroPrecioMax += 10;
        this.precio = this.filtroPrecioMax
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar viviendas', err)
    });
  }

  soloNumeros(event: KeyboardEvent): boolean {
    return /[0-9]/.test(event.key);
  }

  onPrecioMinChange(valor: number) {
    this.filtroPrecioMin = Math.min(valor, this.filtroPrecioMax - 10);
    this.filtrar();
  }

  onPrecioMaxChange(valor: number) {
    this.filtroPrecioMax = Math.max(valor, this.filtroPrecioMin + 10);
    this.filtrar();
  }

  filtrar() {
    this.viviendasFiltradas = this.viviendas.filter(v => {
      let coincideCiudad = true;
      let coincideTipo = true;
      let coincideCapacidad = true;
      let coincidePrecio = true;

      if (this.filtroCiudad) {
        coincideCiudad = v.ciudad.toLowerCase().startsWith(this.filtroCiudad.toLowerCase());
      }
      if (this.filtroTipo) {
        coincideTipo = v.tipo === this.filtroTipo;
      }
      if (this.filtroCapacidad) {
        coincideCapacidad = v.capacidad >= this.filtroCapacidad;
      }
      if (v.tipo === 'ALQUILER') {
        coincidePrecio = v.precioNoche! >= this.filtroPrecioMin && v.precioNoche! <= this.filtroPrecioMax;
      } else if (v.tipo === 'INTERCAMBIO' && (this.filtroPrecioMin > 0 || this.filtroPrecioMax < this.precio)) {
        coincidePrecio = false;
      }

      return coincideCiudad && coincideTipo && coincideCapacidad && coincidePrecio;
    });
    this.cdr.detectChanges();
  }

  limpiarFiltros() {
    this.filtroCiudad = '';
    this.filtroTipo = '';
    this.filtroCapacidad = null;
    this.filtroPrecioMin = 0;
    this.filtroPrecioMax = this.precio;
    this.viviendasFiltradas = this.viviendas;
    this.cdr.detectChanges();
  }

  rutaAdministracion() {
    this.route.navigate(['/administracion']);
  }

  rutaPerfil() {
    this.route.navigate(['/perfil']);
  }

  rutaMensajes() {
    this.route.navigate(['/mensajes']);
  }

  rutaRanking() {
    this.route.navigate(['/ranking']);
  }

  rutaLogin() {
    this.route.navigate(['/']);
  }

  obtenerInicial() {
    if (this.usuario && this.usuario.nombre) {
      this.inicial = this.usuario.nombre.charAt(0).toUpperCase();
    }
  }

  cerrarSesion() {
    this.servicioCompartido.cerrarSesion();
    this.usuario = {} as Usuario;
    this.inicial = '';
    this.rutaLogin();
  }

  verDetalle(id: number | undefined) {
    if (!id) return;
    this.route.navigate(['/vivienda', id]);
  }
}