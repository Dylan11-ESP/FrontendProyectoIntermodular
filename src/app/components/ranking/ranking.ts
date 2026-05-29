import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ViviendaService } from '../../services/vivienda-service';
import { Vivienda } from '../../models/vivienda';
import { ServicioCompartido } from '../../services/servicio-compartido';

@Component({
  selector: 'app-ranking',
  imports: [CommonModule],
  templateUrl: './ranking.html',
  styleUrl: './ranking.css'
})
export class Ranking {
  viviendas: Vivienda[] = [];

  constructor(private viviendaServicio: ViviendaService, private router: Router, private cdr: ChangeDetectorRef, private servicioCompartido: ServicioCompartido) { }

  ngOnInit() {
    const usuario = this.servicioCompartido.getUsuario();
    if (!usuario) {
      this.router.navigate(['/']);
      return;
    }
    this.viviendaServicio.getRanking().subscribe({
      next: (datos) => {
        this.viviendas = datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar ranking', err)
    });
  }

  volver() {
    this.router.navigate(['/principal']);
  }
}