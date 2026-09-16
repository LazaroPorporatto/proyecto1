import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsNotEmpty, IsInt, IsPositive, ValidateNested } from 'class-validator';

export type TipoAjustePrecio = 'porcentaje' | 'monto';

export class ItemAplicarCambioPrecioDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsInt()
  @IsPositive()
  id: number;
}

export class AplicarCambiosPrecioDto {
  @ApiProperty({
    enum: ['porcentaje', 'monto'],
    description:
      'Tipo de ajuste: porcentaje (10 para 10%) o monto ($). Admite valores negativos para bajar precios.',
  })
  @IsIn(['porcentaje', 'monto'])
  tipo: TipoAjustePrecio;

  @ApiProperty({
    description: 'Valor del ajuste. Porcentaje o monto según "tipo".',
    example: 10,
  })
  @IsNumber()
  valor: number;

  @ApiProperty({ type: [ItemAplicarCambioPrecioDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemAplicarCambioPrecioDto)
  @IsNotEmpty()
  items: ItemAplicarCambioPrecioDto[];
}