import { PartialType } from '@nestjs/mapped-types';
import { CreateLineaDto } from './create-linea.dto';
import { IsNotEmpty, IsInt, IsBoolean } from 'class-validator';

export class UpdateLineaDto extends PartialType(CreateLineaDto) {

    @IsBoolean()
    utilizaStockMinimo: boolean;

    updatedAt: Date;

    @IsNotEmpty({ message: 'El superLineaId es obligatorio.' })
    @IsInt({ message: 'El superLineaId debe ser un número entero.' })
    superLineaId?: number;

    @IsNotEmpty({ message: 'El usuarioCreatedId es obligatorio.' })
    @IsInt({ message: 'El usuarioCreatedId debe ser un número entero.' })
    usuarioUpdatedId: number;
}
