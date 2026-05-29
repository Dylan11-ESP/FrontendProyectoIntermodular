import { Usuario } from "./usuario";
export interface Vivienda {
  id?: number;
  usuario: Usuario;
  titulo: string;
  descripcion: string;
  direccion: string;
  ciudad: string;
  pais: string;
  latitud?: number;
  longitud?: number;
  capacidad: number;
  precioNoche?: number;
  tipo: string;
  activa: boolean;
  puntuacionMedia?: number;
  creadoEn?: string;
  numValoraciones?: number;
}