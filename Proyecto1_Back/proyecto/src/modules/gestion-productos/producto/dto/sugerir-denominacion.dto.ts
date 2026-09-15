import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsPositive } from 'class-validator';
import { UnidadPresentacion } from '../enums/unidad-presentacion.enum';

export class SugerirDenominacionDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  marcaId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  lineaId: number;

  @ApiProperty({ enum: UnidadPresentacion })
  @IsEnum(UnidadPresentacion)
  unidadPresentacion: UnidadPresentacion;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  cantidadPresentacion: number;
}