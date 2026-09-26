import { Injectable } from '@nestjs/common';
import { UnidadPresentacion } from '../../enums/unidad-presentacion.enum';

@Injectable()
export class ProductoDenominacionService {
  /**
   * Genera una denominación sugerida a partir de Marca + Línea + Presentación.
   * Regla de negocio del CR-005 (depende de CR-002).
   * El sufijo de presentación se omite si es UNIDAD x1 (caso "sin presentación especial").
   */
  generarDenominacionSugerida(
    marcaDenominacion: string,
    lineaDenominacion: string,
    unidadPresentacion?: UnidadPresentacion,
    cantidadPresentacion?: number,
    presentacionDenominacion?: string,
  ): string {
    const partes = [marcaDenominacion?.trim(), lineaDenominacion?.trim()].filter(
      (parte) => !!parte,
    );

    if (presentacionDenominacion && presentacionDenominacion.trim() !== '') {
      partes.push(presentacionDenominacion.trim());
    } else if (unidadPresentacion && cantidadPresentacion !== undefined) {
      const esPresentacionPorDefecto =
        unidadPresentacion === UnidadPresentacion.UNIDAD && cantidadPresentacion === 1;

      if (!esPresentacionPorDefecto) {
        const cantidadFormateada = String(cantidadPresentacion);
        partes.push(`${cantidadFormateada}${unidadPresentacion}`);
      }
    }

    return partes.join(' ');
  }
}