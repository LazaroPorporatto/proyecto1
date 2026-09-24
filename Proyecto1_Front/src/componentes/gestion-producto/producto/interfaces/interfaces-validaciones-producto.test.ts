import { describe, expect, it } from 'vitest';
import {
  schema,
  validarMotivoCambioPrecio,
} from './interfaces-validaciones-producto';

describe('CR-007 - validaciones de precio del formulario', () => {
  it('acepta un cambio de precio con motivo', () => {
    expect(validarMotivoCambioPrecio(1000, 1150, 'Actualizacion de costo')).toBeNull();
  });

  it.each([undefined, '', '   '])(
    'rechaza un cambio sin motivo: %s',
    (motivo) => {
      expect(validarMotivoCambioPrecio(1000, 1150, motivo)).toBe(
        'Debe indicar el motivo del cambio de precio.',
      );
    },
  );

  it('no exige motivo cuando el precio no cambia', () => {
    expect(validarMotivoCambioPrecio(1000, 1000)).toBeNull();
  });

  it('rechaza un precio menor al costo en el schema del formulario', async () => {
    await expect(
      schema(false, false, false).validate({
        denominacion: 'producto',
        costo: 1000,
        precio: 900,
        lineaId: 1,
        marcaId: 1,
        alicuotaIva: 21,
        unidadPresentacion: 'UNIDAD',
        cantidadPresentacion: 1,
      }),
    ).rejects.toThrow('El precio debe ser mayor o igual que el costo');
  });
});