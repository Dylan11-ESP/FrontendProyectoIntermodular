import { Component, ChangeDetectorRef } from '@angular/core';
import { Usuario } from '../../models/usuario';
import { Vivienda } from '../../models/vivienda';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario-service';
import { ViviendaService } from '../../services/vivienda-service';
import { ServicioCompartido } from '../../services/servicio-compartido';

@Component({
  selector: 'app-administracion',
  imports: [CommonModule, FormsModule],
  templateUrl: './administracion.html',
  styleUrl: './administracion.css',
})
export class Administracion {

  usuarios: Usuario[] = [];
  viviendas: Vivienda[] = [];
  seccion: string = 'usuarios';

  formularioNuevoUsuario: boolean = false;
  errorNuevoUsuario: string = '';

  nuevoUsuario = {
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    telefono: '',
    rol: 'Usuario',
    verificado: false
  };

  usuarioEditando: Usuario | null = null;
  usuarioEditandoOriginal: Usuario | null = null;
  errorEditarUsuario: string = '';

  viviendaEditando: Vivienda | null = null;
  viviendaEditandoOriginal: Vivienda | null = null;
  errorEditarVivienda: string = '';

  constructor(private route: Router, private usuarioService: UsuarioService, private viviendaService: ViviendaService, private cdr: ChangeDetectorRef, private servicioCompartido: ServicioCompartido) { }

  ngOnInit() {
    this.comprobarAdmin();
    this.cargarUsuarios();
    this.cargarViviendas();
  }

  comprobarAdmin() {
    const usuario = this.servicioCompartido.getUsuario();
    if (!usuario) { this.route.navigate(['/']); return; }
    this.usuarioService.getUsuario(usuario.id!).subscribe({
      next: (u) => {
        if (u.rol !== 'Admin') this.route.navigate(['/principal']);
      }
    });
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe({
      next: (datos) => { this.usuarios = datos; this.cdr.detectChanges(); },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  cargarViviendas() {
    this.viviendaService.getViviendas().subscribe({
      next: (datos) => { this.viviendas = datos; this.cdr.detectChanges(); },
      error: (err) => console.error('Error al cargar viviendas', err)
    });
  }

  totalUsuarios(): number {
    return this.usuarios.length;
  }

  totalAdmins(): number {
    return this.usuarios.filter(u => u.rol === 'Admin').length;
  }

  totalViviendas(): number {
    return this.viviendas.length;
  }

  viviendasActivas(): number {
    return this.viviendas.filter(v => v.activa).length;
  }

  viviendasAlquiler(): number {
    return this.viviendas.filter(v => v.tipo === 'ALQUILER').length;
  }

  viviendasIntercambio(): number {
    return this.viviendas.filter(v => v.tipo === 'INTERCAMBIO').length;
  }

  abrirFormularioNuevoUsuario() {
    this.formularioNuevoUsuario = !this.formularioNuevoUsuario;
    this.errorNuevoUsuario = '';
    this.usuarioEditando = null;
    this.nuevoUsuario = {
      nombre: '',
      apellidos: '',
      email: '',
      password: '',
      telefono: '',
      rol: 'Usuario',
      verificado: false
    };
  }

  crearUsuario() {
    this.errorNuevoUsuario = '';

    if (!this.nuevoUsuario.nombre) { this.errorNuevoUsuario = 'El nombre es obligatorio.'; return; }
    if (!this.nuevoUsuario.apellidos) { this.errorNuevoUsuario = 'Los apellidos son obligatorios.'; return; }
    if (!this.nuevoUsuario.email) { this.errorNuevoUsuario = 'El email es obligatorio.'; return; }
    if (!this.nuevoUsuario.email.includes('@')) { this.errorNuevoUsuario = 'El email no tiene un formato válido.'; return; }
    if (this.usuarios.some(u => u.email === this.nuevoUsuario.email)) { this.errorNuevoUsuario = 'Ya existe un usuario con ese email.'; return; }
    if (!this.nuevoUsuario.password) { this.errorNuevoUsuario = 'La contraseña es obligatoria.'; return; }
    if (this.nuevoUsuario.password.length < 8) { this.errorNuevoUsuario = 'La contraseña debe tener al menos 8 caracteres.'; return; }
    if (!this.nuevoUsuario.telefono) { this.errorNuevoUsuario = 'El teléfono es obligatorio.'; return; }
    if (!/^[0-9]{9}$/.test(this.nuevoUsuario.telefono)) { this.errorNuevoUsuario = 'El teléfono debe tener 9 dígitos.'; return; }

    this.usuarioService.createUsuario(this.nuevoUsuario as any).subscribe({
      next: () => {
        this.formularioNuevoUsuario = false;
        this.errorNuevoUsuario = '';
        this.cargarUsuarios();
      },
      error: (err) => console.error('Error al crear usuario', err)
    });
  }

  abrirEditarUsuario(usuario: Usuario) {
    this.formularioNuevoUsuario = false;
    this.errorEditarUsuario = '';
    this.usuarioEditandoOriginal = usuario;
    this.usuarioEditando = { ...usuario };
  }

  cancelarEditarUsuario() {
    this.usuarioEditando = null;
    this.usuarioEditandoOriginal = null;
    this.errorEditarUsuario = '';
  }

  guardarEditarUsuario() {
    if (!this.usuarioEditando) return;
    this.errorEditarUsuario = '';

    if (!this.usuarioEditando.nombre) { this.errorEditarUsuario = 'El nombre es obligatorio.'; return; }
    if (!this.usuarioEditando.apellidos) { this.errorEditarUsuario = 'Los apellidos son obligatorios.'; return; }
    if (!this.usuarioEditando.email) { this.errorEditarUsuario = 'El email es obligatorio.'; return; }
    if (!this.usuarioEditando.email.includes('@')) { this.errorEditarUsuario = 'El email no tiene un formato válido.'; return; }
    if (this.usuarios.some(u => u.email === this.usuarioEditando!.email && u.id !== this.usuarioEditando!.id)) {
      this.errorEditarUsuario = 'Ya existe otro usuario con ese email.'; return;
    }
    if (this.usuarioEditando.telefono && !/^[0-9]{9}$/.test(this.usuarioEditando.telefono)) {
      this.errorEditarUsuario = 'El teléfono debe tener 9 dígitos.'; return;
    }

    this.usuarioService.updateUsuario(this.usuarioEditando.id!, this.usuarioEditando).subscribe({
      next: () => {
        this.cancelarEditarUsuario();
        this.cargarUsuarios();
      },
      error: (err) => console.error('Error al editar usuario', err)
    });
  }

  eliminarUsuario(id: number | undefined) {
    if (!id) return;
    if (!confirm('¿Seguro que quieres eliminar este usuario?')) return;
    this.usuarioService.deleteUsuario(id).subscribe({
      next: () => { this.cargarUsuarios(); this.cdr.detectChanges(); },
      error: (err) => console.error('Error al eliminar usuario', err)
    });
  }

  abrirEditarVivienda(vivienda: Vivienda) {
    this.errorEditarVivienda = '';
    this.viviendaEditandoOriginal = vivienda;
    this.viviendaEditando = { ...vivienda };
  }

  cancelarEditarVivienda() {
    this.viviendaEditando = null;
    this.viviendaEditandoOriginal = null;
    this.errorEditarVivienda = '';
  }

  guardarEditarVivienda() {
    if (!this.viviendaEditando) return;
    this.errorEditarVivienda = '';

    if (!this.viviendaEditando.titulo) { this.errorEditarVivienda = 'El título es obligatorio.'; return; }
    if (!this.viviendaEditando.ciudad) { this.errorEditarVivienda = 'La ciudad es obligatoria.'; return; }
    if (!this.viviendaEditando.pais) { this.errorEditarVivienda = 'El país es obligatorio.'; return; }
    if (!this.viviendaEditando.direccion) { this.errorEditarVivienda = 'La dirección es obligatoria.'; return; }
    if (!this.viviendaEditando.capacidad || this.viviendaEditando.capacidad < 1) {
      this.errorEditarVivienda = 'La capacidad debe ser mayor que 0.'; return;
    }
    if (this.viviendaEditando.tipo === 'ALQUILER' && (!this.viviendaEditando.precioNoche || this.viviendaEditando.precioNoche <= 0)) {
      this.errorEditarVivienda = 'Las viviendas de alquiler deben tener un precio por noche.'; return;
    }

    if (this.viviendaEditando.tipo === 'INTERCAMBIO') {
      this.viviendaEditando.precioNoche = undefined;
    }

    this.viviendaService.updateVivienda(this.viviendaEditando.id!, this.viviendaEditando).subscribe({
      next: () => {
        this.cancelarEditarVivienda();
        this.cargarViviendas();
      },
      error: (err) => console.error('Error al editar vivienda', err)
    });
  }
  eliminarVivienda(id: number | undefined) {
    if (!id) return;
    if (!confirm('¿Seguro que quieres eliminar esta vivienda?')) return;
    this.viviendaService.deleteVivienda(id).subscribe({
      next: () => { this.cargarViviendas(); this.cdr.detectChanges(); },
      error: (err) => console.error('Error al eliminar vivienda', err)
    });
  }

  navegarPrincipal() {
    this.route.navigate(['/principal']);
  }
}