import { ChangeDetectorRef, Component } from '@angular/core';
import { Usuario } from '../../models/usuario';
import { Vivienda } from '../../models/vivienda';
import { Reserva } from '../../models/reserva';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario-service';
import { ViviendaService } from '../../services/vivienda-service';
import { ReservaService } from '../../services/reserva-service';
import { ServicioCompartido } from '../../services/servicio-compartido';

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  usuario: Usuario = {} as Usuario;
  inicial: string = '';
  formulario: boolean = false;
  viviendas: Vivienda[] = [];
  reservas: Reserva[] = [];
  reservasViviendas: Reserva[] = [];
  fechaRegistro: string = '';

  formularioNueva: boolean = false;
  viviendaEditandoId: number | null = null;

  errorNueva: string = '';
  errorEditar: string = '';

  formularioCambiarPassword: boolean = true;
  passwordActual: string = '';
  passwordNueva: string = '';
  passwordNueva2: string = '';
  errorPassword: string = '';

  exitoEditar: boolean = false;
  exitoPassword: boolean = false;
  cargandoNueva: boolean = false;
  exitoEditarVivienda: boolean = false;

  usuarioEditado = {
    nombre: '',
    apellidos: '',
    telefono: '',
    email: '',
    rol: '',
    verificado: false,
    password: ''
  };
  viviendaEditada: Vivienda = {} as Vivienda;
  nuevaVivienda: Vivienda = {} as Vivienda;
  valorandoReservaId: number | null = null;
  puntuacion: number = 0;
  mapa: any = null;

  constructor(
    private servicioCompartido: ServicioCompartido,
    private route: Router,
    private usuarioServicio: UsuarioService,
    private viviendaServicio: ViviendaService,
    private reservaServicio: ReservaService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarUsuario();
  }

  cargarUsuario() {
    const usuario = this.servicioCompartido.getUsuario();
    if (usuario) {
      this.usuario = usuario;
      this.fechaRegistro = this.formatearFecha(usuario.creadoEn || '');
      this.obtenerInicial();
      this.cargarViviendas();
      this.cargarReservas();
    } else {
      this.usuario = {} as Usuario;
      this.inicial = '';
      this.route.navigate(['/']);
    }
  }

  iniciarMapa() {
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
    }

    this.mapa = (window as any).L.map('mapaPerfi').setView([40.4168, -3.7038], 6);

    (window as any).L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; OpenStreetMap contributors' }
    ).addTo(this.mapa);

    const iconoCasa = (window as any).L.divIcon({
      html: '🏠',
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const cluster = (window as any).L.markerClusterGroup();
    const bounds: any[] = [];

    this.viviendas.forEach(v => {
      if (!v.latitud || !v.longitud) return;

      const marker = (window as any).L.marker([v.latitud, v.longitud], { icon: iconoCasa });

      marker.bindPopup(`
            <strong>${v.titulo}</strong><br>
            ${v.ciudad}, ${v.pais}<br>
            ${v.tipo === 'INTERCAMBIO' ? 'Intercambio' : v.precioNoche + ' €/noche'}
        `);

      cluster.addLayer(marker);
      bounds.push([v.latitud, v.longitud]);
    });

    this.mapa.addLayer(cluster);

    if (bounds.length > 0) {
      this.mapa.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  cargarViviendas() {
    if (this.usuario.id) {
      this.viviendaServicio.getViviendasUsuario(this.usuario.id).subscribe({
        next: (datos) => {
          this.viviendas = datos;
          this.cargarReservasDeViviendas();
          this.cdr.detectChanges();
          setTimeout(() => this.iniciarMapa(), 100);
        },
        error: (err) => console.error('Error al cargar viviendas', err)
      });
    }
  }

  cargarReservas() {
    if (this.usuario.id) {
      this.reservaServicio.getReservasUsuario(this.usuario.id).subscribe({
        next: (datos) => {
          this.reservas = datos.filter(r => {
            const partes = r.fechaFin.split('-');
            const fin = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
            return fin >= new Date();
          });
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al cargar reservas', err)
      });
    }
  }

  cargarReservasDeViviendas() {
    this.reservasViviendas = [];
    this.viviendas.forEach(vivienda => {
      if (vivienda.id) {
        this.reservaServicio.getReservasVivienda(vivienda.id).subscribe({
          next: (datos) => {
            const activas = datos.filter(r => {
              const partes = r.fechaFin.split('-');
              const fin = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
              return fin >= new Date();
            });
            activas.filter(r => !r.visto).forEach(r => {
              const reservaVista = { ...r, visto: true };
              this.reservaServicio.updateReserva(r.id!, reservaVista).subscribe();
            });
            this.reservasViviendas = [...this.reservasViviendas, ...activas];
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error al cargar reservas de vivienda', err)
        });
      }
    });
  }

  async obtenerCoordenadas(direccion: string, ciudad: string, pais: string): Promise<{ lat: number, lon: number } | null> {
    const intentos = [
      `${direccion}, ${ciudad}, ${pais}`,
      `${ciudad}, ${pais}`,
      pais
    ];

    for (const query of intentos) {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'mi-app-daw' }
      }).then(r => r.json());

      if (res.length > 0) {
        return { lat: parseFloat(res[0].lat), lon: parseFloat(res[0].lon) };
      }
    }

    return null;
  }

  seSolapan(r1: Reserva, r2: Reserva): boolean {
    const inicio1 = new Date(r1.fechaInicio);
    const fin1 = new Date(r1.fechaFin);
    const inicio2 = new Date(r2.fechaInicio);
    const fin2 = new Date(r2.fechaFin);
    return inicio1 < fin2 && fin1 > inicio2;
  }

  aceptarReserva(reserva: Reserva) {
    const reservaAceptada = { ...reserva, estado: 'CONFIRMADA' };
    this.reservaServicio.updateReserva(reserva.id!, reservaAceptada).subscribe({
      next: () => {
        const solapadas = this.reservasViviendas.filter(r =>
          r.id !== reserva.id &&
          r.vivienda?.id === reserva.vivienda?.id &&
          r.estado === 'PENDIENTE' &&
          this.seSolapan(r, reserva)
        );
        solapadas.forEach(r => {
          const reservaRechazada = { ...r, estado: 'RECHAZADA' };
          this.reservaServicio.updateReserva(r.id!, reservaRechazada).subscribe({
            next: () => this.cargarReservasDeViviendas(),
            error: (err) => console.error('Error al rechazar reserva solapada', err)
          });
        });
        this.cargarReservasDeViviendas();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al aceptar reserva', err)
    });
  }

  rechazarReserva(reserva: Reserva) {
    const reservaRechazada = { ...reserva, estado: 'RECHAZADA' };
    this.reservaServicio.updateReserva(reserva.id!, reservaRechazada).subscribe({
      next: () => {
        this.cargarReservasDeViviendas();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al rechazar reserva', err)
    });
  }

  cancelarReserva(id: number | undefined) {
    if (!id) return;
    if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return;
    this.reservaServicio.deleteReserva(id).subscribe({
      next: () => {
        this.reservas = this.reservas.filter(r => r.id !== id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cancelar reserva', err)
    });
  }

  prepararEditar() {
    this.usuarioEditado = {
      nombre: this.usuario.nombre,
      apellidos: this.usuario.apellidos,
      telefono: this.usuario.telefono || '',
      email: this.usuario.email,
      rol: this.usuario.rol,
      verificado: this.usuario.verificado,
      password: this.usuario.password
    };
    this.formulario = !this.formulario;
  }

  editar() {
    if (!this.usuarioEditado.nombre) { this.errorEditar = 'El nombre es obligatorio.'; return; }
    if (!this.usuarioEditado.apellidos) { this.errorEditar = 'Los apellidos son obligatorios.'; return; }
    if (this.usuarioEditado.telefono && !/^[0-9]{9}$/.test(this.usuarioEditado.telefono)) { this.errorEditar = 'El teléfono debe tener 9 dígitos.'; return; }

    this.errorEditar = '';

    if (this.usuario.id) {
      this.usuarioServicio.updateUsuario(this.usuario.id, this.usuarioEditado).subscribe({
        next: () => {
          this.actualizarLocalStorage();
          this.formulario = false;
          this.exitoEditar = true;
          this.errorEditar = '';
          setTimeout(() => {
            this.exitoEditar = false;
            this.cdr.detectChanges();
          }, 3000);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al actualizar el usuario', err)
      });
    }
  }

  actualizarLocalStorage() {
    const usuarioActualizado = { ...this.usuario, ...this.usuarioEditado };
    this.servicioCompartido.setUsuario(usuarioActualizado);
    this.cargarUsuario();
  }

  cambiarPassword() {
    this.errorPassword = '';

    if (!this.passwordActual || !this.passwordNueva || !this.passwordNueva2) { this.errorPassword = 'Rellena todos los campos.'; return; }
    if (this.passwordNueva.length < 8) { this.errorPassword = 'La contraseña nueva debe tener al menos 8 caracteres.'; return; }
    if (this.passwordNueva !== this.passwordNueva2) { this.errorPassword = 'Las contraseñas nuevas no coinciden.'; return; }

    this.usuarioServicio.cambiarPassword(this.usuario.id!, this.passwordActual, this.passwordNueva).subscribe({
      next: () => {
        this.formularioCambiarPassword = false;
        this.passwordActual = '';
        this.passwordNueva = '';
        this.passwordNueva2 = '';
        this.exitoPassword = true;
        setTimeout(() => {
          this.exitoPassword = false;
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorPassword = 'La contraseña actual es incorrecta.';
        this.cdr.detectChanges();
      }
    });
  }

  prepararEditarVivienda(vivienda: Vivienda) {
    if (this.viviendaEditandoId === vivienda.id) {
      this.viviendaEditandoId = null;
      this.errorEditar = '';
      return;
    }
    this.viviendaEditandoId = vivienda.id ?? null;
    this.errorEditar = '';
    this.viviendaEditada = {
      titulo: vivienda.titulo,
      descripcion: vivienda.descripcion,
      direccion: vivienda.direccion,
      ciudad: vivienda.ciudad,
      pais: vivienda.pais,
      capacidad: vivienda.capacidad,
      precioNoche: vivienda.precioNoche,
      tipo: vivienda.tipo,
      activa: vivienda.activa,
      usuario: vivienda.usuario
    };
  }

  async guardarVivienda(vivienda: Vivienda) {
    this.errorEditar = '';

    if (!this.viviendaEditada.titulo) { this.errorEditar = 'El título es obligatorio.'; return; }
    if (!this.viviendaEditada.descripcion) { this.errorEditar = 'La descripción es obligatoria.'; return; }
    if (!this.viviendaEditada.direccion) { this.errorEditar = 'La dirección es obligatoria.'; return; }
    if (!this.viviendaEditada.ciudad) { this.errorEditar = 'La ciudad es obligatoria.'; return; }
    if (!this.viviendaEditada.pais) { this.errorEditar = 'El país es obligatorio.'; return; }
    if (!this.viviendaEditada.capacidad || this.viviendaEditada.capacidad < 1 || this.viviendaEditada.capacidad > 20) { this.errorEditar = 'La capacidad debe estar entre 1 y 20.'; return; }
    if (this.viviendaEditada.tipo === 'ALQUILER' && (!this.viviendaEditada.precioNoche || this.viviendaEditada.precioNoche <= 0)) { this.errorEditar = 'El precio por noche es obligatorio y debe ser mayor que 0.'; return; }
    if (!vivienda.id) return;

    if (this.viviendaEditada.tipo === 'INTERCAMBIO') {
      this.viviendaEditada.precioNoche = undefined;
    }

    const coords = await this.obtenerCoordenadas(this.viviendaEditada.direccion, this.viviendaEditada.ciudad, this.viviendaEditada.pais);
    if (coords) {
      this.viviendaEditada.latitud = coords.lat;
      this.viviendaEditada.longitud = coords.lon;
    }

    const viviendaActualizada: Vivienda = { ...this.viviendaEditada, id: vivienda.id } as Vivienda;
    this.viviendaServicio.updateVivienda(vivienda.id, viviendaActualizada).subscribe({
      next: () => {
        this.viviendaEditandoId = null;
        this.errorEditar = '';
        this.exitoEditarVivienda = true;
        this.cdr.detectChanges();
        this.cargarViviendas();
        setTimeout(() => {
          this.exitoEditarVivienda = false;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => console.error('Error al actualizar vivienda', err)
    });
  }
  rutaPrincipal() {
    this.route.navigate(['/principal']);
  }
  eliminarVivienda(id: number | undefined) {
    if (!id) return;
    if (!confirm('¿Seguro que quieres eliminar esta vivienda?')) return;
    this.viviendaServicio.deleteVivienda(id).subscribe({
      next: () => {
        this.viviendas = this.viviendas.filter(v => v.id !== id);
        this.cdr.detectChanges();

        if (this.viviendas.length > 0) {
          setTimeout(() => this.iniciarMapa(), 100);
        } else {
          if (this.mapa) {
            this.mapa.remove();
            this.mapa = null;
          }
        }
      },
      error: (err) => console.error('Error al eliminar vivienda', err)
    });
  }
  abrirFormularioNueva() {
    this.formularioNueva = !this.formularioNueva;
    this.errorNueva = '';
    this.nuevaVivienda = {
      titulo: '',
      descripcion: '',
      direccion: '',
      ciudad: '',
      pais: '',
      capacidad: 1,
      tipo: 'ALQUILER',
      activa: true,
      usuario: this.usuario
    };
  }

  async crearVivienda() {
    this.errorNueva = '';

    if (!this.nuevaVivienda.titulo) { this.errorNueva = 'El título es obligatorio.'; return; }
    if (!this.nuevaVivienda.descripcion) { this.errorNueva = 'La descripción es obligatoria.'; return; }
    if (!this.nuevaVivienda.direccion) { this.errorNueva = 'La dirección es obligatoria.'; return; }
    if (!this.nuevaVivienda.ciudad) { this.errorNueva = 'La ciudad es obligatoria.'; return; }
    if (!this.nuevaVivienda.pais) { this.errorNueva = 'El país es obligatorio.'; return; }
    if (!this.nuevaVivienda.capacidad || this.nuevaVivienda.capacidad < 1 || this.nuevaVivienda.capacidad > 20) { this.errorNueva = 'La capacidad debe estar entre 1 y 20.'; return; }
    if (this.nuevaVivienda.tipo === 'ALQUILER' && (!this.nuevaVivienda.precioNoche || this.nuevaVivienda.precioNoche <= 0)) { this.errorNueva = 'El precio por noche es obligatorio y debe ser mayor que 0.'; return; }
    if (this.nuevaVivienda.tipo === 'INTERCAMBIO') {
      this.nuevaVivienda.precioNoche = undefined;  // ← añadir esto
    }
    this.cargandoNueva = true;
    this.cdr.detectChanges();

    const coords = await this.obtenerCoordenadas(this.nuevaVivienda.direccion, this.nuevaVivienda.ciudad, this.nuevaVivienda.pais);
    if (coords) {
      this.nuevaVivienda.latitud = coords.lat;
      this.nuevaVivienda.longitud = coords.lon;
    }

    this.viviendaServicio.createVivienda(this.nuevaVivienda).subscribe({
      next: () => {
        this.cargandoNueva = false;
        this.formularioNueva = false;
        this.errorNueva = '';
        this.cargarViviendas();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoNueva = false;
        console.error('Error al crear vivienda', err);
        this.cdr.detectChanges();
      }
    });
  }

  formatearFecha(fechaISO: string): string {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
  }

  rutaAdministracion() {
    this.route.navigate(['/administracion']);
  }

  obtenerInicial() {
    if (this.usuario?.nombre && this.usuario?.apellidos) {
      this.inicial = this.usuario.nombre.charAt(0).toUpperCase();
      this.inicial += this.usuario.apellidos.charAt(0).toUpperCase();
    }
  }

  cerrarSesion() {
    this.servicioCompartido.cerrarSesion();
    this.usuario = {} as Usuario;
    this.inicial = '';
    this.route.navigate(['/']);
  }

  verIntercambio(id: number | undefined) {
    if (!id) return;
    this.route.navigate(['/intercambio', id]);
  }

  valorar(reserva: Reserva) {
    if (this.puntuacion < 1 || this.puntuacion > 5) return;
    this.viviendaServicio.valorarVivienda(reserva.vivienda.id!, this.puntuacion).subscribe({
      next: () => {
        const reservaValorada = { ...reserva, valorado: true };
        this.reservaServicio.updateReserva(reserva.id!, reservaValorada).subscribe({
          next: () => {
            reserva.valorado = true;
            this.valorandoReservaId = null;
            this.puntuacion = 0;
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error al marcar reserva como valorada', err)
        });
      },
      error: (err) => console.error('Error al valorar', err)
    });
  }

  ActivaVivienda(vivienda: Vivienda) {
    const actualizada = { ...vivienda, activa: !vivienda.activa };
    this.viviendaServicio.updateVivienda(vivienda.id!, actualizada).subscribe({
      next: () => {
        vivienda.activa = !vivienda.activa;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cambiar estado vivienda', err)
    });
  }

}