import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SuperLineaDto {
  @ApiProperty({ example: 1, description: 'ID de la SuperLínea' })
  @Type(() => Number)
  @IsInt()
  id: number;

  @ApiProperty({
    example: 'ALIMENTOS',
    description: 'Denominación o nombre de la SuperLínea',
  })
  @IsString()
  denominacion: string;

  @IsOptional()
  @IsInt()
  stockMinimo?: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  utilizaStockMinimo: boolean;

  @ApiProperty({
    example: '',
    description: 'Observaciones sobre la SuperLínea',
  })
  @IsString()
  observacion: string;

  @ApiProperty({
    example: 0,
    description: 'De sistema, no se puede editar ni eliminar si es 1',
  })
  @Type(() => Number)
  @IsInt()
  sistema: number;

  @ApiProperty({ example: null, description: 'Fecha de eliminación (null si está activa)', nullable: true })
  @IsOptional()
  deletedAt: string | null;
}
