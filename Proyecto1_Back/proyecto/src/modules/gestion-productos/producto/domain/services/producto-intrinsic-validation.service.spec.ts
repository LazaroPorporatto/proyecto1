import { BadRequestException } from '@nestjs/common';
import { ProductoIntrinsicValidationService } from './producto-intrinsic-validation.service.ts';

describe('ProductoIntrinsicValidationService', () => {
  let service: ProductoIntrinsicValidationService;

  beforeEach(() => {
    service = new ProductoIntrinsicValidationService();
  });

  const datosValidos = {
    denominacion: 'Producto de prueba',
    marcaId: 1,
    lineaId: 1,
    alicuotaIva: 21,
  };

  it('acepta un precio mayor que el costo', () => {
    expect(() =>
      service.validarDatosBasicos({
        ...datosValidos,
        costo: 100,
        precio: 150,
      }),
    ).not.toThrow();
  });

  it('acepta un precio igual al costo', () => {
    expect(() =>
      service.validarDatosBasicos({
        ...datosValidos,
        costo: 100,
        precio: 100,
      }),
    ).not.toThrow();
  });

  it('rechaza un precio menor que el costo', () => {
    expect(() =>
      service.validarDatosBasicos({
        ...datosValidos,
        costo: 100,
        precio: 80,
      }),
    ).toThrow(
      new BadRequestException('El precio debe ser mayor o igual que el costo'),
    );
  });

  it('rechaza un costo negativo', () => {
    expect(() =>
      service.validarDatosBasicos({
        ...datosValidos,
        costo: -1,
        precio: 100,
      }),
    ).toThrow(new BadRequestException('El costo no puede ser negativo'));
  });

  it('rechaza un precio negativo', () => {
    expect(() =>
      service.validarDatosBasicos({
        ...datosValidos,
        costo: 0,
        precio: -1,
      }),
    ).toThrow(new BadRequestException('El precio no puede ser negativo'));
  });
});
