import { DomainEvent } from '../events/domain-event.interface';

/**
 * Puerto de publicacion de eventos de dominio.
 * El dominio genera los eventos; la capa de aplicacion los despacha a traves
 * de este puerto sin conocer a quienes los escuchan.
 */
export interface EventPublisher {
  publish(eventos: DomainEvent[]): void;
}