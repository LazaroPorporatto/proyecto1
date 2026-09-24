import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { MovimientoStock } from '../../domain/entities/movimiento-stock.entity';
import { IMovimientoStockRepository } from '../../domain/interfaces/movimiento-stock.repository-interface';

@Injectable()
export class MovimientoStockPersistenceAdapter
  implements IMovimientoStockRepository
{
  private readonly logger = new Logger(MovimientoStockPersistenceAdapter.name);

  constructor(
    @InjectRepository(MovimientoStock)
    private readonly repository: Repository<MovimientoStock>,
  ) {}

  async save(
    uow: IUnitOfWork,
    movimiento: MovimientoStock,
  ): Promise<MovimientoStock> {
    const repo = uow.getRepository(MovimientoStock);
    return repo.save(movimiento);
  }

  async findByProductoId(productoId: number): Promise<MovimientoStock[]> {
    return this.repository.find({
      where: { productoId },
      order: { createdAt: 'DESC' },
    });
  }
}