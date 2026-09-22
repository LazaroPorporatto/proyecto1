import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseConnectionException } from 'src/modules/common/exceptions/database-connection.exception';
import { EntityNotFoundException } from 'src/modules/common/exceptions/entity-notFound-exceptions';
import { Repository, DataSource } from 'typeorm';
import { CreateSuperLineaDto } from '../../dto/create-super-linea.dto';
import { SuperLinea } from '../../domain/entities/super-linea.entity';
import { ISuperLineaRepository } from '../../domain/interfaces/super-linea.repository.interface';
import { UpdateSuperLineaDto } from '../../dto/update-super-linea.dto';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { Transactional } from 'src/modules/common/decorators/transactional.decoratos';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { FechaUtils } from 'src/modules/common/utils/date/fecha-utils';
import { QueryBuilderHelper } from 'src/modules/common/query-builders/query-builder-helpers';
import { BasePersistenceAdapter } from 'src/modules/common/persistence/base-persistence.adapter';
import { handleDatabaseError } from 'src/modules/common/query-builders/database-error.helper';

@Injectable()
export class SuperLineaPersistenceAdapter
  extends BasePersistenceAdapter<SuperLinea>
  implements ISuperLineaRepository
{
  private readonly logger = new Logger(SuperLineaPersistenceAdapter.name);

  protected readonly ALIAS = 'super_linea';

  constructor(
    @InjectRepository(SuperLinea)
    repository: Repository<SuperLinea>,

    private readonly dataSource: DataSource,
    @Inject('UnitOfWork') public readonly uow: IUnitOfWork,
  ) {
    super(repository);
  }

  @Transactional()
  async create(data: CreateSuperLineaDto): Promise<SuperLinea> {
    const repo = this.uow.getRepository(SuperLinea);

    try {
      const nuevaEntity = repo.create({
        denominacion: data.denominacion,
        utilizaStockMinimo: data.utilizaStockMinimo,
        stockMinimo: data.stockMinimo,
        usuarioCreatedId: data.usuarioCreatedId,
        observacion: data.observacion,
      });

      const entityGuardada = await repo.save(nuevaEntity);
      return entityGuardada;
    } catch (error) {
      this.logger.error(`Error al conectar con la base de datos: ${error}`);
      throw new DatabaseConnectionException(
        'Error al guardar en la base de datos.',
      );
    }
  }

  @Transactional()
  async update(
    id: number,
    data: UpdateSuperLineaDto,
  ): Promise<SuperLinea> {
    const repo = this.uow.getRepository(SuperLinea);

    const entity = await repo.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(`SuperLínea con ID ${id} no encontrada`);
    }

    entity.denominacion = data.denominacion ?? entity.denominacion;
    entity.utilizaStockMinimo = data.utilizaStockMinimo ?? entity.utilizaStockMinimo;
    entity.stockMinimo = data.stockMinimo ?? 0;
    entity.usuarioUpdatedId = data.usuarioUpdatedId;
    entity.observacion = data.observacion ?? entity.observacion;

    const entityActualizada = await repo.save(entity);
    return entityActualizada;
  }

  async findOne(id: number): Promise<SuperLinea | null> {
    try {
      const entity = await this.repository
        .createQueryBuilder('super_linea')
        .where('super_linea.id = :id', { id })
        .andWhere('super_linea.deletedAt IS NULL')
        .getOne();

      if (!entity) {
        throw new EntityNotFoundException('Entidad no encontrada');
      }

      return entity;
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }

      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async findAllListado(): Promise<SuperLinea[]> {
    try {
      const query = this.baseQuery();
      QueryBuilderHelper.applyOrder(query, this.ALIAS, 'denominacion', 'ASC');
      return await query.getMany();
    } catch (error) {
      handleDatabaseError(this.logger, 'findAllListado', error);
    }
  }

  async findByDenominacion(denominacion: string): Promise<SuperLinea | null> {
    try {
      const entity = await this.repository
        .createQueryBuilder('super_linea')
        .where('super_linea.denominacion = :denominacion', { denominacion })
        .andWhere('super_linea.deletedAt IS NULL')
        .getOne();

      return entity;
    } catch (error) {
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async findByDenominacionWith(denominacion: string): Promise<SuperLinea | null> {
    try {
      const normalizada = denominacion.trim().toUpperCase();

      const entity = await this.repository
        .createQueryBuilder('super_linea')
        .withDeleted()
        .where('UPPER(super_linea.denominacion) = :denominacion', {
          denominacion: normalizada,
        })
        .getOne();

      return entity;
    } catch (error) {
      handleDatabaseError(this.logger, 'findByDenominacionWith', error);
    }
  }

  async findByDenominacionFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
    incluirEliminados = false,
  ): Promise<{ data: SuperLinea[]; total: number }> {
    try {
      const query = this.baseQuery(incluirEliminados);

      if (denominacion) {
        query.andWhere(`UPPER(${this.ALIAS}.denominacion) LIKE :denominacion`, {
          denominacion: `%${denominacion.toUpperCase()}%`,
        });
      }

      QueryBuilderHelper.applyOrder(query, this.ALIAS, 'denominacion', 'ASC');
      QueryBuilderHelper.applyPagination(query, skip, take);

      const [data, total] = await query.getManyAndCount();
      return { data, total };
    } catch (error) {
      handleDatabaseError(this.logger, 'findBy', error);
    }
  }

  async findAllFor(denominacion: string): Promise<SuperLinea[]> {
    try {
      const query = this.baseQuery();
      if (denominacion && denominacion.trim() !== '') {
        query.andWhere('UPPER(super_linea.denominacion) LIKE :denominacion', {
          denominacion: `%${denominacion.toUpperCase()}%`,
        });
      }

      QueryBuilderHelper.applyOrder(query, this.ALIAS, 'denominacion', 'ASC');
      return await query.getMany();
    } catch (error) {
      handleDatabaseError(this.logger, 'findAllFor', error);
    }
  }

  async findAllSinSistemaFor(denominacion: string): Promise<SuperLinea[]> {
    try {
      const query = this.repository
        .createQueryBuilder('super_linea')
        .where('super_linea.deletedAt IS NULL')
        .andWhere('super_linea.sistema = :sistema', { sistema: 0 });
      if (denominacion && denominacion.trim() !== '') {
        query.andWhere('UPPER(super_linea.denominacion) LIKE :denominacion', {
          denominacion: `%${denominacion.toUpperCase()}%`,
        });
      }

      return await query.orderBy('super_linea.denominacion', 'ASC').getMany();
    } catch (error) {
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async findByIdConAuditoria(id: number): Promise<AuditoriaDto | null> {
    try {
      const raw = await this.repository
        .createQueryBuilder('super_linea')
        .leftJoin(
          'usuario',
          'usuarioCreated',
          'usuarioCreated.id = super_linea.usuarioCreatedId',
        )
        .leftJoin(
          'usuario',
          'usuarioUpdated',
          'usuarioUpdated.id = super_linea.usuarioUpdatedId',
        )
        .leftJoin(
          'usuario',
          'usuarioDeleted',
          'usuarioDeleted.id = super_linea.usuarioDeletedId',
        )
        .addSelect([
          'super_linea.id as super_linea_id',
          'super_linea.denominacion as super_linea_denominacion',
          'super_linea.createdAt as super_linea_createdAt',
          'super_linea.updatedAt as super_linea_updatedAt',
          'super_linea.deletedAt as super_linea_deletedAt',
          'usuarioCreated.denominacion as usuarioCreated_nombre',
          'usuarioUpdated.denominacion as usuarioUpdated_nombre',
          'usuarioDeleted.denominacion as usuarioDeleted_nombre',
        ])
        .where('super_linea.id = :id', { id })
        .getRawOne();

      if (!raw) return null;

      return {
        id: raw.super_linea_id ?? 0,
        detalle: raw.super_linea_denominacion
          ? `SuperLínea ${raw.super_linea_denominacion}`
          : 'SuperLínea (sin denominación)',
        createdAt: raw.super_linea_createdAt
          ? FechaUtils.formatFechaHora(raw.super_linea_createdAt)
          : '',
        updatedAt: raw.super_linea_updatedAt
          ? FechaUtils.formatFechaHora(raw.super_linea_updatedAt)
          : '',
        deletedAt: raw.super_linea_deletedAt
          ? FechaUtils.formatFechaHora(raw.super_linea_deletedAt)
          : '',
        usuarioCreated: raw.usuarioCreated_nombre ?? '',
        usuarioUpdated: raw.usuarioUpdated_nombre ?? '',
        usuarioDeleted: raw.usuarioDeleted_nombre ?? '',
      };
    } catch (error) {
      this.logger.error(`Error en findByIdConAuditoria: ${error}`);
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async remove(entity: SuperLinea, usuario: Usuario): Promise<SuperLinea> {
    if (entity.deletedAt) {
      throw new NotFoundException('Entidad ya eliminada.');
    }

    try {
      entity.deletedAt = new Date();
      entity.usuarioDeletedId = usuario.id;
      return await this.repository.save(entity);
    } catch (error) {
      throw new DatabaseConnectionException(
        'Error al guardar en la base de datos.',
      );
    }
  }
}
