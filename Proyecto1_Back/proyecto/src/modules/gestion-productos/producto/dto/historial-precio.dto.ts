export class HistorialPrecioDto {
  id: number;
  productoId: number;
  precioAnterior: number;
  precioNuevo: number;
  fecha: Date;
  motivo: string;
  usuarioId?: number;
}
