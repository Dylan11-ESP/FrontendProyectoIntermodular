import { Usuario } from "./usuario";
import { Vivienda } from "./vivienda";
export interface Mensaje {
  id?: number;
  emisor: Usuario;
  receptor: Usuario;
  vivienda?: Vivienda;
  contenido: string;
  leido: boolean;
  enviadoEn?: string;
}