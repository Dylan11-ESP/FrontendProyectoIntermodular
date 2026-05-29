import { Reserva } from "./reserva";
export interface IntercambioModelo {
  id?: number;
  reservaOrigen: Reserva;
  reservaDestino: Reserva;
  estado: string;
  creadoEn?: string;
}