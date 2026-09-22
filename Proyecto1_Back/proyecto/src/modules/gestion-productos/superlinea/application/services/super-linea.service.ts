import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { ensureNotSistemaEntity } from 'src/modules/common/utils/atrituto-sistema';
import { PaginacionUtils } from 'src/modules/common/utils/pagination/paginacion-utils';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';
import { ISuperLineaRepository } from '../../domain/interfaces/super-linea.repository.interface';
import { CreateSuperLineaDto } from '../../dto/create-super-linea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-super-linea.dto';
import { SuperLineaDto } from '../../dto/super-linea.dto';
import { SuperLineaMapper } from '../../mappers/super-linea.mapper';
import { SuperLinea } from '../../domain/entities/super-linea.entity';

@Injectable()
export class SuperLineaService {
  private readonly logger = new Logger(SuperLineaService.name);

  constructor(
    @Inject('ISuperLineaRepository')
    private readonly repository: ISuperLineaRepository,
    private readonly usuarioService: UsuarioService,
  ) {}

  private readonly ENTITY_NAME = 'SuperLínea';

  async create(dto: CreateSuperLineaDto) {
    this.logger.log(
      `Creando un nuevo ${this.ENTITY_NAME} con denominación: ${dto.denominacion}`,
    );
    await this.checkDenominacionExists(dto.denominacion, 0);

    const entity = await this.repository.create(dto);

    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'creada',
    );
  }

  async update(id: number, dto: UpdateSuperLineaDto) {
    this.logger.log(`Actualizando ${this.ENTITY_NAME} con ID: ${id}`);

    const superLinea = await this.findEntityById(id);
    ensureNotSistemaEntity(superLinea, 'SuperLínea');
    if (dto.denominacion)
      await this.checkDenominacionExists(dto.denominacion, id);

    const entity = await this.repository.update(id, dto);
    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'editada',
    );
  }

  async findByDenominacionFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
    incluirEliminados = false,
  ): Promise<{ data: SuperLineaDto[]; total: number }> {
    const result = await this.repository.findByDenominacionFiltered(
      denominacion,
      skip,
      take,
      incluirEliminados,
    );
    const data: SuperLineaDto[] = result.data.map((item) =>
      SuperLineaMapper.toDto(item),
    );
    return {
      data,
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async findAllFor(
    denominacion: string,
  ): Promise<{ data: SuperLineaDto[]; total: number }> {
    const result = await this.repository.findAllFor(denominacion);
    const data: SuperLineaDto[] = result.map((item) => SuperLineaMapper.toDto(item));

    return {
      data,
      total: 1,
    };
  }

  async findDtoById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    return SuperLineaMapper.toDto(entity);
  }

  async findEntityById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    return entity;
  }

  async remove(id: number, usuarioId: number) {
    const entity = await this.repository.findOne(id);

    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }

    ensureNotSistemaEntity(entity, 'SuperLínea');

    const usuario = await this.usuarioService.findOne(usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    await this.repository.remove(entity, usuario);
    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'eliminada',
    );
  }

  private async checkDenominacionExists(denominacion: string, id: number) {
    const denominacionNormalizada = denominacion.trim().toUpperCase();

    const exists = await this.repository.findByDenominacionWith(
      denominacionNormalizada,
    );

    if (exists && exists.id !== id) {
      throw new ConflictException('Denominación ya en uso o está eliminada.');
    }
  }

  async findAllListado(): Promise<SuperLinea[]> {
    return this.repository.findAllListado();
  }

  async findByIdConAuditoria(id: number) {
    const data = await this.repository.findByIdConAuditoria(id);
    if (!data) {
      throw new NotFoundException(
        `Auditoría de ${this.ENTITY_NAME} con ID ${id} no encontrada.`,
      );
    }
    return data;
  }
}
