import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProductoDto } from './update-producto.dto';

describe('UpdateProductoDto', () => {
  it('rechaza un precio cero', async () => {
    const dto = plainToInstance(UpdateProductoDto, {
      denominacion: 'producto',
      usuarioUpdatedId: 1,
      precio: 0,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'precio')).toBe(true);
  });

  it('acepta un precio positivo', async () => {
    const dto = plainToInstance(UpdateProductoDto, {
      denominacion: 'producto',
      usuarioUpdatedId: 1,
      precio: 100,
      motivoPrecio: 'Actualizacion de costo',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'precio')).toBe(false);
  });
});
