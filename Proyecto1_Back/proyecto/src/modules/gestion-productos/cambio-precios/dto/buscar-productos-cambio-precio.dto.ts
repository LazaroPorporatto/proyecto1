import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class BuscarProductosCambioPrecioDto {
  @ApiPropertyOptional({
    description: 'Textos a buscar en la denominación del producto',
  })
  @IsOptional()
  @IsString()
  denominacion?: string;

  @ApiPropertyOptional({ description: 'ID de la marca' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  marcaId?: number;

  @ApiPropertyOptional({ description: 'ID de la línea' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lineaId?: number;

  @ApiPropertyOptional({ description: 'Cantidad de registros a omitir' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip: number = 0;

  @ApiPropertyOptional({ description: 'Cantidad de registros a traer' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take: number = 10;

  @ApiPropertyOptional({
    description: 'Indica si se deben filtrar productos con stock',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  conStock?: boolean;
}