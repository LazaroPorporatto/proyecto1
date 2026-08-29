import { Module } from '@nestjs/common';
import { SeedAllService } from './seed-all.service';
import { SeedAllController } from './seed-all.controller';
import { SeedOrganizacionService } from '../seed-organizacion/seed-organizacion.service';
import { SeedFamiliaProductoService } from '../seed-familia-producto/seed-familia-producto.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Linea } from '../../../gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from '../../../gestion-productos/marca/domain/entities/marca.entity';
import { Producto } from '../../../gestion-productos/producto/domain/entities/producto.entity';
import { Empresa } from '../../../organizacion/empresa/domain/entities/empresa.entity';
import { Usuario } from '../../../gestion-usuario/usuario/domain/entities/usuario.entity';
import { SeedUsuarioService } from '../seed-usuario/seed-usuario.service';
import { Rol } from '../../../gestion-usuario/rol/domain/entities/rol.entity';
import { Provincia } from '../../../gutil/provincia/domain/entities/provincia.entity';
import { Localidad } from '../../../gutil/localidad/domain/entities/localidad.entity';
import { ConfiguracionSistema } from '../../../gestion-sistema/configuracion-sistema/domain/entities/configuracion-sistema.entity';

import { Personal } from '../../../organizacion/personal/domain/entities/personal.entity';
;
import { Cliente } from '../../../organizacion/cliente/domain/entities/cliente.entity';
import { CondicionIva } from '../../../gutil/condicion-iva/domain/entities/condicion-iva.entity';
import { Proveedor } from '../../../organizacion/proveedor/domain/entities/proveedor.entity';
import { AlicuotaIva } from '../../../gutil/alicuota-iva/domain/entities/alicuota-iva.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provincia,
      CondicionIva,
      Localidad, 

      Linea,
      Marca,
      Producto,
      Empresa,
      Cliente,
      Proveedor,
      Usuario,
      Rol,
      ConfiguracionSistema,

      Personal,

      AlicuotaIva,

    ]), // Repositorios que se inyectarán
  ],
  controllers: [SeedAllController],
  providers: [SeedAllService,
    SeedUsuarioService,
    SeedOrganizacionService,
    SeedFamiliaProductoService,

  ],
})
export class SeedAllModule { }
