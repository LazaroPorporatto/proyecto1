import { DomainEvent } from './domain-event.interface';

export class StockBajoEvent implements DomainEvent {
  readonly occurredOn: Date = new Date();

  constructor(
    public readonly productoId: number,
    public readonly denominacion: string,
    public readonly stockActual: number,
    public readonly stockMinimo: number,
  ) {}
}