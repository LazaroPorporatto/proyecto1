import { Injectable } from '@nestjs/common';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { MovimientoStock } from '../../domain/entities/movimiento-stock.entity';
import { IMovimientoStockRepository } from '../../domain/interfaces/movimiento-stock.repository-interface';
import { MovimientoStockPersistenceAdapter } from './movimiento-stock.persistence-adapter';

@Injectable()
export class MovimientoStockRepository implements IMovimientoStockRepository {
  constructor(
    private readonly persistenceService: MovimientoStockPersistenceAdapter,
  ) {}

  async save(
    uow: IUnitOfWork,
    movimiento: MovimientoStock,
  ): Promise<MovimientoStock> {
    return this.persistenceService.save(uow, movimiento);
  }

  async findByProductoId(productoId: number): Promise<MovimientoStock[]> {
    return this.persistenceService.findByProductoId(productoId);
  }
}