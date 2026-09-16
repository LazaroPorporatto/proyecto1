import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { Roles } from 'src/modules/gestion-usuario/auth/roles.decorator';
import { CambioPreciosService } from '../services/cambio-precios.service';
import { BuscarProductosCambioPrecioDto } from '../../dto/buscar-productos-cambio-precio.dto';
import { AplicarCambiosPrecioDto } from '../../dto/aplicar-cambios-precio.dto';
import { GuardarCambiosPrecioDto } from '../../dto/guardar-cambios-precio.dto';

@ApiTags('Cambio Precios')
@Controller('cambio-precios')
@UseGuards(AuthGuard)
export class CambioPreciosController {
  constructor(private readonly service: CambioPreciosService) {}

  @Get('search-productos-by')
  @Roles('Root', 'Administrador', 'Empleado', 'Vendedor', 'Repartidor', 'Repositor')
  buscarProductos(@Query() dto: BuscarProductosCambioPrecioDto) {
    return this.service.buscarProductos(dto);
  }

  @Patch('aplicar-cambios')
  @Roles('Root', 'Administrador', 'Empleado')
  aplicarCambios(@Body() dto: AplicarCambiosPrecioDto) {
    return this.service.aplicarCambios(dto);
  }

  @Patch('guardar-cambios')
  @Roles('Root', 'Administrador', 'Empleado')
  guardarCambios(@Body() dto: GuardarCambiosPrecioDto) {
    return this.service.guardarCambios(dto);
  }
}