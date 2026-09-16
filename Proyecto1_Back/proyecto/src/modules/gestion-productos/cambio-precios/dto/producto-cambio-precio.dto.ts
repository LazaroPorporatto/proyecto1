import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductoCambioPrecioDto {
  @ApiProperty({ description: 'ID del producto' })
  id: number;

  @ApiProperty({ description: 'Código de proveedor' })
  codigoProveedor: string;

  @ApiProperty({ description: 'Denominación del producto' })
  denominacion: string;

  @ApiProperty({ description: 'Observación del producto' })
  observacion: string;

  @ApiProperty({ description: 'Costo del producto (sin IVA)' })
  costo: number;

  @ApiProperty({ description: 'Stock actual del producto' })
  stock: number;

  @ApiProperty({ description: 'Precio de venta actual (sin IVA)' })
  precio: number;

  @ApiProperty({ description: 'Precio de venta actual con IVA (referencia)' })
  precioConIva: number;

  @ApiProperty({ description: 'Alícuota de IVA del producto' })
  alicuotaIva: number;

  @ApiProperty({ description: 'Margen actual en porcentaje' })
  porcentaje: number;

  @ApiPropertyOptional({ description: 'ID de la línea' })
  lineaId: number | null;

  @ApiPropertyOptional({ description: 'Denominación de la línea' })
  lineaDenominacion: string | null;

  @ApiPropertyOptional({
    description: 'Nuevo precio calculado (presente tras aplicar cambios / edición manual)',
  })
  nuevoPrecio: number | null;

  @ApiPropertyOptional({
    description: 'Nuevo margen implicito recalculado (presente tras aplicar cambios)',
  })
  nuevoPorcentaje: number | null;

  @ApiPropertyOptional({
    description: 'Nuevo precio con IVA calculado (presente tras aplicar cambios / edición manual)',
  })
  nuevoPrecioConIva: number | null;

  @ApiPropertyOptional({
    description: 'Mensaje de validación si el nuevo precio no cumple las reglas',
  })
  error: string | null;

  @ApiPropertyOptional({
    description: 'Indica si el producto fue modificado manualmente',
  })
  dirty: boolean;
}