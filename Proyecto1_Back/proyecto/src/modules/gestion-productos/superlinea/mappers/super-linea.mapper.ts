import { Logger } from '@nestjs/common';
import { SuperLinea } from '../domain/entities/super-linea.entity';
import { SuperLineaDto } from '../dto/super-linea.dto';

export class SuperLineaMapper {
  private static readonly logger = new Logger(SuperLineaMapper.name);

  static toDto(entity: SuperLinea): SuperLineaDto {
    return {
      id: entity.id,
      denominacion: entity.denominacion,
      stockMinimo: entity.stockMinimo,
      utilizaStockMinimo: entity.utilizaStockMinimo,
      observacion: entity.observacion ?? '',
      sistema: entity.sistema,
      deletedAt: entity.deletedAt ? entity.deletedAt.toISOString() : null,
    };
  }
}
