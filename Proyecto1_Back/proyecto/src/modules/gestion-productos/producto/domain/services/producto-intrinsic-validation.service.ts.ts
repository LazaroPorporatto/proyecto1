// domain/services/producto-intrinsic-validation.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ProductoIntrinsicValidationService {
  /**
   * Valida todos los datos intrínsecos del producto
   */
  validarDatosBasicos(datos: {
    denominacion: string;
    marcaId: number;
    lineaId: number;
    alicuotaIva?: number;
    costo?: number;
    precio?: number;
  }): void {
    this.validarDenominacion(datos.denominacion);
    this.validarIds(datos.marcaId, datos.lineaId);
    this.validarPrecio(datos.costo, datos.precio);
    
    if (datos.alicuotaIva !== undefined) {
      this.validarAlicuotaIva(datos.alicuotaIva);
    }
  }

  private validarDenominacion(denominacion: string): void {
    if (!denominacion || denominacion.trim().length === 0) {
      throw new BadRequestException('La denominación es obligatoria');
    }
    if (denominacion.length > 200) {
      throw new BadRequestException(
        'La denominación no puede superar 200 caracteres',
      );
    }
  }

  private validarIds(
    marcaId: number,
    lineaId: number,
  ): void {
    if (!marcaId || marcaId <= 0) {
      throw new BadRequestException('Marca ID es requerido y debe ser válido');
    }
    if (!lineaId || lineaId <= 0) {
      throw new BadRequestException('Línea ID es requerido y debe ser válido');
    }

  }

  private validarPrecio(costo?: number, precio?: number): void {
    if (costo !== undefined && costo < 0) {
      throw new BadRequestException('El costo no puede ser negativo');
    }

    if (precio !== undefined && precio < 0) {
      throw new BadRequestException('El precio no puede ser negativo');
    }

    if (
      costo !== undefined &&
      precio !== undefined &&
      precio < costo
    ) {
      throw new BadRequestException(
        'El precio debe ser mayor o igual que el costo',
      );
    }
  }

  private validarAlicuotaIva(alicuotaIva: number): void {
    if (alicuotaIva < 0 || alicuotaIva > 100) {
      throw new BadRequestException(
        'La alícuota IVA debe estar entre 0 y 100',
      );
    }
  }
}
