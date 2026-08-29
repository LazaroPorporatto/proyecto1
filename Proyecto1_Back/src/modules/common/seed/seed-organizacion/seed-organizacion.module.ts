import { Module } from '@nestjs/common';
import { SeedOrganizacionService } from './seed-organizacion.service';
import { SeedOrganizacionController } from './seed-organizacion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from '../../../organizacion/empresa/domain/entities/empresa.entity';
import { Usuario } from '../../../gestion-usuario/usuario/domain/entities/usuario.entity';
import { Provincia } from '../../../gutil/provincia/domain/entities/provincia.entity';
import { Localidad } from '../../../gutil/localidad/domain/entities/localidad.entity';
import { ConfiguracionSistema } from '../../../gestion-sistema/configuracion-sistema/domain/entities/configuracion-sistema.entity';

import { Personal } from '../../../organizacion/personal/domain/entities/personal.entity';

import { Cliente } from '../../../organizacion/cliente/domain/entities/cliente.entity';
import { RolModule } from '../../../gestion-usuario/rol/rol.module';
import { CondicionIva } from '../../../gutil/condicion-iva/domain/entities/condicion-iva.entity';
import { Proveedor } from '../../../organizacion/proveedor/domain/entities/proveedor.entity';
import { AlicuotaIva } from '../../../gutil/alicuota-iva/domain/entities/alicuota-iva.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provincia,
      CondicionIva,
      Localidad,
      Empresa,
      Cliente,
      Proveedor,
      Usuario,
      ConfiguracionSistema,
      Personal,
      AlicuotaIva,
    ]),
    RolModule,
  ],
  controllers: [SeedOrganizacionController],
  providers: [SeedOrganizacionService],
  exports: [SeedOrganizacionService],
})
export class SeedOrganizacionModule { }
