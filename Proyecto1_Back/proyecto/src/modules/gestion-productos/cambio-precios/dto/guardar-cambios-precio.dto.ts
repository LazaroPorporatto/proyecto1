import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ItemGuardarCambioPrecioDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsInt()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'Nuevo precio de venta (sin IVA)' })
  @IsNumber()
  nuevoPrecio: number;
}

export class GuardarCambiosPrecioDto {
  @ApiProperty({
    description: 'Motivo obligatorio de la actualización de precios',
  })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiProperty({ description: 'ID del usuario que realiza la actualización' })
  @IsInt()
  @IsPositive()
  usuarioCreatedId: number;

  @ApiProperty({ type: [ItemGuardarCambioPrecioDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemGuardarCambioPrecioDto)
  @IsNotEmpty()
  items: ItemGuardarCambioPrecioDto[];
}