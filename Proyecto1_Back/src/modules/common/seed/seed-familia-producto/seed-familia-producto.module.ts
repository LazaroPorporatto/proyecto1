import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Linea } from '../../../gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from '../../../gestion-productos/marca/domain/entities/marca.entity';

import { SeedFamiliaProductoService } from './seed-familia-producto.service';
import { SeedFamiliaProductoController } from './seed-familia-producto.controller';
import { Producto } from '../../../gestion-productos/producto/domain/entities/producto.entity';
import { Usuario } from '../../../gestion-usuario/usuario/domain/entities/usuario.entity';

import { Proveedor } from '../../../organizacion/proveedor/domain/entities/proveedor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [ 
      Linea, 
      Marca,
      Producto,
      Usuario,
      Proveedor,

    
    ]), // Repositorios que se inyectarán
  ],
  controllers: [SeedFamiliaProductoController], // Agregar el controlador aquí
  providers: [SeedFamiliaProductoService], // Servicio disponible en el módulo
  exports: [SeedFamiliaProductoService], // Exportar si lo usas en otros módulos
})
export class SeedFamiliaProductoModule {}