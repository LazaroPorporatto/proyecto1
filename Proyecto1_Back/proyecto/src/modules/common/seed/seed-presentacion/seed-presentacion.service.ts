import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Presentacion } from 'src/modules/gestion-productos/presentacion/domain/entities/presentacion.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';

@Injectable()
export class SeedPresentacionService {
  private readonly logger = new Logger(SeedPresentacionService.name);

  constructor(
    @InjectRepository(Presentacion)
    private readonly presentacionRepository: Repository<Presentacion>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async seedPresentaciones() {
    const entryData = [
      { denominacion: 'UNIDAD', observacion: 'Venta por unidad' },
      { denominacion: 'CAJA x12', observacion: 'Caja de 12 unidades' },
      { denominacion: 'PACK x6', observacion: 'Pack de 6 unidades' },
      { denominacion: 'BIDON 5L', observacion: 'Bidón de 5 litros' },
    ];

    for (const data of entryData) {
      const exists = await this.presentacionRepository.findOneBy({
        denominacion: data.denominacion,
      });

      if (exists) {
        this.logger.log(`Presentacion "${data.denominacion}" ya existe.`);
        continue;
      }

      const usuarioCreated = await this.usuarioRepository.findOneBy({ id: 1 });
      if (!usuarioCreated) {
        this.logger.warn(
          'No se encontro el usuario "1". Ejecuta primero el seed de usuario.',
        );
        return;
      }

      const presentacion = this.presentacionRepository.create({
        denominacion: data.denominacion,
        observacion: data.observacion,
        usuarioCreatedId: usuarioCreated.id,
        sistema: 0,
      });

      await this.presentacionRepository.save(presentacion);
      this.logger.log(`Presentacion "${data.denominacion}" creada.`);
    }
  }

  async runAllSeeds() {
    this.logger.log('Iniciando seeds de presentaciones...');
    await this.seedPresentaciones();
    this.logger.log('Seeds de presentaciones completados.');
  }
}
