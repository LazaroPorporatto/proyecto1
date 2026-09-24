import { Injectable, Logger } from '@nestjs/common';
import { EventPublisher } from '../../domain/interfaces/event-publisher.interface';
import { DomainEvent } from '../../domain/events/domain-event.interface';

@Injectable()
export class StockEventPublisher implements EventPublisher {
  private readonly logger = new Logger(StockEventPublisher.name);

  publish(eventos: DomainEvent[]): void {
    for (const evento of eventos) {
      this.logger.log(
        `[Evento de dominio: ${evento.constructor.name}] ${JSON.stringify(evento)}`,
      );
    }
  }
}