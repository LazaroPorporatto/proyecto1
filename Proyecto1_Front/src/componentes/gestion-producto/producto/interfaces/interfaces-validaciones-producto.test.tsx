import { describe, it, expect } from 'vitest';
import { schema } from './interfaces-validaciones-producto';
import { UnidadPresentacion } from '../../../../interfaces/gestion-producto/producto/interfaces-producto';

describe('CR-002: validación de Presentación (schema de Yup)', () => {
  const datosBase = {
    denominacion: 'coca cola 1.5l',
    costo: 1000,
    precio: 1050,
    marcaId: 1,
    lineaId: 1,
    presentacionId: 1,
    alicuotaIva: 21,
  };

  it('valida correctamente con unidad UNIDAD y cantidad 1 (caso por defecto)', async () => {
    const validationSchema = schema(false, false, false);
    const datos = {
      ...datosBase,
      unidadPresentacion: UnidadPresentacion.UNIDAD,
      cantidadPresentacion: 1,
    };

    await expect(validationSchema.validate(datos)).resolves.toBeTruthy();
  });

  it('valida correctamente con unidad LITRO y cantidad decimal (1.5)', async () => {
    const validationSchema = schema(false, false, false);
    const datos = {
      ...datosBase,
      unidadPresentacion: UnidadPresentacion.LITRO,
      cantidadPresentacion: 1.5,
    };

    await expect(validationSchema.validate(datos)).resolves.toBeTruthy();
  });

  it('rechaza cantidadPresentacion igual a 0', async () => {
    const validationSchema = schema(false, false, false);
    const datos = {
      ...datosBase,
      unidadPresentacion: UnidadPresentacion.UNIDAD,
      cantidadPresentacion: 0,
    };

    await expect(validationSchema.validate(datos)).rejects.toThrow(
      /mayor a 0/i,
    );
  });

  it('rechaza cantidadPresentacion negativa', async () => {
    const validationSchema = schema(false, false, false);
    const datos = {
      ...datosBase,
      unidadPresentacion: UnidadPresentacion.UNIDAD,
      cantidadPresentacion: -3,
    };

    await expect(validationSchema.validate(datos)).rejects.toThrow(
      /mayor a 0/i,
    );
  });

  it('rechaza si cantidadPresentacion no se envía (campo obligatorio en el front)', async () => {
    const validationSchema = schema(false, false, false);
    const { cantidadPresentacion, ...datosSinCantidad } = {
      ...datosBase,
      unidadPresentacion: UnidadPresentacion.UNIDAD,
      cantidadPresentacion: 1,
    };

    await expect(validationSchema.validate(datosSinCantidad)).rejects.toThrow(
      /obligatoria/i,
    );
  });

  it('rechaza una unidadPresentacion fuera del catálogo cerrado', async () => {
    const validationSchema = schema(false, false, false);
    const datos = {
      ...datosBase,
      unidadPresentacion: 'TONELADA',
      cantidadPresentacion: 1,
    };

    await expect(validationSchema.validate(datos)).rejects.toThrow(
      /inválida/i,
    );
  });
});