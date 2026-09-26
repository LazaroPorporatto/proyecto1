import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator';
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

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  presentacionId?: number;

  @ApiProperty({ enum: UnidadPresentacion, required: false })
  @IsOptional()
  @IsEnum(UnidadPresentacion)
  unidadPresentacion?: UnidadPresentacion;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  cantidadPresentacion?: number;
}