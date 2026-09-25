import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";


export class PresentacionDto  {
  @ApiProperty({ example: 123, description: 'ID de la presentación' })
  @Type(() => Number)
  @IsInt()
  id: number;

  @ApiProperty({ example: 'bolsas x300', description: 'Denominación de la presentación' })
  @IsString()
  denominacion: string;

  @ApiProperty({ example: '', description: 'Observaciones varias sobre la presentación' })
  @IsString()
  observacion: string;

  @ApiProperty({ example: 1, description: 'de sistema no se puede editar ni eliminar' })
  @Type(() => Number)
  @IsInt()
  sistema: number;

  @ApiProperty({ example: null, description: 'Fecha de eliminación (null si está activa)', nullable: true })
  @IsOptional()
  deletedAt: string | null;
}