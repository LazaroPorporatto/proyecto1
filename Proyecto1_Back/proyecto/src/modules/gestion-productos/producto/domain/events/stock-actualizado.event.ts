import { DomainEvent } from './domain-event.interface';
import { TipoMovimiento } from '../../enums/tipo-movimiento.enum';

export class StockActualizadoEvent implements DomainEvent {
  readonly occurredOn: Date = new Date();

  constructor(
    public readonly productoId: number,
    public readonly stockAnterior: number,
    public readonly stockNuevo: number,
    public readonly tipoMovimiento: TipoMovimiento,
    public readonly motivo: string,
  ) {}
}