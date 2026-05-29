import { Usuario } from "./usuario";
import { Vivienda } from "./vivienda";
export interface Reserva {
  id?: number;
  vivienda: Vivienda;
  usuario: Usuario;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  precioTotal?: number;
  tipo: string;
  creadoEn?: string;
  valorado?: boolean;
  visto?: boolean;
}