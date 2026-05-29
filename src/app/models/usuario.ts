export interface Usuario {
  id?: number;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  telefono?: string;
  fotoPerfil?: string;
  verificado: boolean;
  rol: string;
  creadoEn?: string;
}