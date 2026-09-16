import { Module } from '@nestjs/common';
import { ProductoModule } from '../producto/producto.module';
import { CambioPreciosService } from './application/services/cambio-precios.service';
import { CambioPreciosController } from './application/controllers/cambio-precios.controller';

@Module({
  imports: [ProductoModule],
  controllers: [CambioPreciosController],
  providers: [CambioPreciosService],
  exports: [CambioPreciosService],
})
export class CambioPreciosModule {}