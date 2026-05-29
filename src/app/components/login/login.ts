import { Component } from '@angular/core';
import { UsuarioService } from '../../services/usuario-service';
import { Usuario } from '../../models/usuario';
import { firstValueFrom } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioCompartido } from '../../services/servicio-compartido';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  modo: string = 'iniciar';

  usuarios: Usuario[] = [];
  usuario: Usuario = {} as Usuario;

  errorRegistro: string = "";
  errorLogin: string = "";

  cargandoRegistro: boolean = false;
  cargandoLogin: boolean = false;

  constructor(private usuarioServicio: UsuarioService, private cdr: ChangeDetectorRef, private route: Router, private servicioCompartido: ServicioCompartido) { }

  activar(id: string) {
    this.modo = id === 'registrar' ? 'registrar' : 'iniciar';
    this.cdr.detectChanges();
  }

  limpiarErrorLogin() {
    this.errorLogin = "";
  }

  limpiarErrorRegistro() {
    this.errorRegistro = "";
  }

  async inicioSesion() {
    if (this.cargandoLogin) return;
    this.errorLogin = "";

    const campoEmail = document.getElementById("emailSesion") as HTMLInputElement;
    const campoPassword = document.getElementById("password") as HTMLInputElement;

    if (!campoEmail || !campoPassword) {
      this.errorLogin = "Error al cargar el formulario";
      this.cdr.detectChanges();
      return;
    }

    const email = campoEmail.value;
    const password = campoPassword.value;

    if (!email || !password) {
      this.errorLogin = "Rellena todos los campos";
      this.cdr.detectChanges();
      return;
    }

    if (password.length < 8) {
      this.errorLogin = "La contraseña debe tener al menos 8 caracteres.";
      this.cdr.detectChanges();
      return;
    }

    if (!email.includes('@')) {
      this.errorLogin = "El formato del email no es válido.";
      this.cdr.detectChanges();
      return;
    }

    this.cargandoLogin = true;
    this.cdr.detectChanges();

    try {
      const usuarioValido = await firstValueFrom(this.usuarioServicio.login(email, password));
      this.servicioCompartido.setUsuario(usuarioValido);
      this.route.navigate(['/principal']);
    } catch (err) {

      this.errorLogin = "Email o contraseña incorrectos";

    } finally {

      this.cargandoLogin = false;
      this.cdr.detectChanges();

    }
  }

  async registro() {
    if (this.cargandoRegistro) return;
    this.errorRegistro = "";

    const nombre = (document.getElementById("nombreRegistro") as HTMLInputElement).value;
    const apellidos = (document.getElementById("apellidoRegistro") as HTMLInputElement).value;
    const email = (document.getElementById("emailRegistro") as HTMLInputElement).value;
    const password = (document.getElementById("passwordRegistro") as HTMLInputElement).value;
    const password2 = (document.getElementById("passwordRegistro2") as HTMLInputElement).value;
    const telefono = (document.getElementById("tlfRegistro") as HTMLInputElement).value;

    if (!nombre || !apellidos || !email || !password || !password2 || !telefono) {
      this.errorRegistro = "Por favor, rellena todos los campos.";
      this.cdr.detectChanges();
      return;
    }

    if (password !== password2) {
      this.errorRegistro = "Las contraseñas no coinciden.";
      this.cdr.detectChanges();
      return;
    }

    if (password.length < 8) {
      this.errorRegistro = "La contraseña debe tener al menos 8 caracteres.";
      this.cdr.detectChanges();
      return;
    }

    if (!email.includes('@')) {
      this.errorRegistro = "El formato del email no es válido.";
      this.cdr.detectChanges();
      return;
    }

    const tlf = /^[0-9]{9}$/;
    if (!tlf.test(telefono)) {
      this.errorRegistro = "El teléfono debe tener exactamente 9 números.";
      this.cdr.detectChanges();
      return;
    }

    const usuarios = await firstValueFrom(this.usuarioServicio.getUsuarios());
    const usuarioValido = usuarios?.find(u => u.email === email);
    if (usuarioValido) {
      this.errorRegistro = "El correo ya esta registrado";
      this.cdr.detectChanges();
      return;
    }

    this.cargandoRegistro = true;
    this.cdr.detectChanges();

    this.usuario.nombre = nombre;
    this.usuario.apellidos = apellidos;
    this.usuario.email = email;
    this.usuario.password = password;
    this.usuario.telefono = telefono;
    this.usuario.rol = "Usuario";
    this.usuario.verificado = false;

    this.usuarioServicio.createUsuario(this.usuario).subscribe({
      next: () => {
        this.cargandoRegistro = false;
        this.errorRegistro = "";
        this.activar('iniciar');
        const campoEmail = document.getElementById("emailSesion") as HTMLInputElement;
        const campoPassword = document.getElementById("password") as HTMLInputElement;
        campoEmail.value = this.usuario.email;
        campoPassword.value = this.usuario.password;
        this.inicioSesion();
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoRegistro = false;
        this.errorRegistro = "Hubo un fallo en el registro. Inténtalo de nuevo.";
        this.cdr.detectChanges();
      }
    });
  }

}