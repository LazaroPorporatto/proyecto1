import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { MovimientoStock } from '../entities/movimiento-stock.entity';

export interface IMovimientoStockRepository {
  save(
    uow: IUnitOfWork,
    movimiento: MovimientoStock,
  ): Promise<MovimientoStock>;
  findByProductoId(productoId: number): Promise<MovimientoStock[]>;
}