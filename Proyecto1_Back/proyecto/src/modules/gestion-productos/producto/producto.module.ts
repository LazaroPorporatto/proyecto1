import { forwardRef, Module } from '@nestjs/common';
import { ProductoController } from './application/controllers/producto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { Producto } from './domain/entities/producto.entity';
import { ProductoRepository } from './infraestructure/repositories/producto.repository';
import { LineaModule } from '../linea/linea.module';
import { MarcaModule } from '../marca/marca.module';
import { TypeOrmUnitOfWork } from 'src/modules/common/unit-of-work/type-orm-unit-of-works1';
import { DataSource } from 'typeorm';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { ProveedorModule } from 'src/modules/organizacion/proveedor/proveedor.module';
import { UsuarioModule } from 'src/modules/gestion-usuario/usuario/usuario.module';
import { CommonModule } from 'src/modules/common/common.module';
import { ProductoService } from './application/services/producto.service';
import { ProductoPersistenceAdapter } from './infraestructure/repositories/producto.persistence-adapters';
import { ProductoUniquenessValidator } from './infraestructure/validators/producto-uniqueness.validator.ts';
import { ProductoRelatedEntitiesValidator } from './infraestructure/validators/producto-related-entities.validator.ts';
import { ProductoValidationService } from './domain/services/producto-validation.service.ts';
import { ProductoIntrinsicValidationService } from './domain/services/producto-intrinsic-validation.service.ts';
import { ProductoDeletePolicy } from './application/policies/producto-delete.policy';
import { ProductoDenominacionService } from './domain/services/producto-denominacion.service';
import { MovimientoStock } from './domain/entities/movimiento-stock.entity';
import { MovimientoStockRepository } from './infraestructure/repositories/movimiento-stock.repository';
import { MovimientoStockPersistenceAdapter } from './infraestructure/repositories/movimiento-stock.persistence-adapter';
import { StockEventPublisher } from './infraestructure/events/stock-event-publisher';


@Module({
  imports: [
    TypeOrmModule.forFeature([Producto, MovimientoStock]),
    CommonModule,
    forwardRef(() => LineaModule),
    forwardRef(() => MarcaModule),
    ProveedorModule,
    UsuarioModule,
  ],

  controllers: [ProductoController],
  
  providers: [
    ProductoService,
    ProductoIntrinsicValidationService,
    ProductoValidationService,
    ProductoDenominacionService,
    ProductoRelatedEntitiesValidator,
    ProductoUniquenessValidator,
    ProductoDeletePolicy,

    {
      provide: 'IProductoRepository',
      useClass: ProductoRepository,
    },
    MovimientoStockRepository,
    MovimientoStockPersistenceAdapter,
    {
      provide: 'IMovimientoStockRepository',
      useClass: MovimientoStockRepository,
    },
    {
      provide: 'EventPublisher',
      useClass: StockEventPublisher,
    },
    {
      provide: 'UnitOfWork',
      useFactory: (dataSource: DataSource): IUnitOfWork => {
        return new TypeOrmUnitOfWork(dataSource);
      },
      inject: [DataSource],
    },
    NormalizeDenominacionPipe,
    ProductoPersistenceAdapter,
  ],
  
  exports: [
    TypeOrmModule,
    ProductoService,
    ProductoPersistenceAdapter,
    MovimientoStockRepository,
    'IProductoRepository',
    'IMovimientoStockRepository',
  ],
})
export class ProductoModule {}