import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AplicarCambiosPrecioDto } from './aplicar-cambios-precio.dto';
import { GuardarCambiosPrecioDto } from './guardar-cambios-precio.dto';

describe('DTOs de cambio de precios (US-006: validacion de payload)', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  const pasarPipe = async (dto: object, metatype: any) =>
    pipe.transform(dto, { type: 'body', metatype });

  describe('AplicarCambiosPrecioDto', () => {
    it('acepta un payload valido', async () => {
      const resultado = await pasarPipe(
        { tipo: 'monto', valor: -10, items: [{ id: 1 }] },
        AplicarCambiosPrecioDto,
      );
      expect(resultado.tipo).toBe('monto');
      expect(resultado.items[0].id).toBe(1);
    });

    it('rechaza un tipo de ajuste invalido', async () => {
      await expect(
        pasarPipe(
          { tipo: 'descuento', valor: 10, items: [{ id: 1 }] },
          AplicarCambiosPrecioDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un valor no numerico', async () => {
      await expect(
        pasarPipe(
          { tipo: 'monto', valor: 'mucho', items: [{ id: 1 }] },
          AplicarCambiosPrecioDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza propiedades no declaradas (forbidNonWhitelisted)', async () => {
      await expect(
        pasarPipe(
          { tipo: 'porcentaje', valor: 10, items: [{ id: 1 }], extra: 1 },
          AplicarCambiosPrecioDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GuardarCambiosPrecioDto (E4: motivo obligatorio)', () => {
    it('acepta un payload valido', async () => {
      const resultado = await pasarPipe(
        {
          items: [{ id: 1, nuevoPrecio: 110 }],
          motivo: 'Aumento por inflacion',
          usuarioCreatedId: 7,
        },
        GuardarCambiosPrecioDto,
      );
      expect(resultado.motivo).toBe('Aumento por inflacion');
    });

    it('rechaza el guardado sin motivo (E4)', async () => {
      await expect(
        pasarPipe(
          { items: [{ id: 1, nuevoPrecio: 110 }], motivo: '', usuarioCreatedId: 7 },
          GuardarCambiosPrecioDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});