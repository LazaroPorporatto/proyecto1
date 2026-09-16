import { BadRequestException } from '@nestjs/common';
import { ProductoService } from './producto.service';

describe('ProductoService', () => {
  let service: ProductoService;
  const repository = {
    findOne: jest.fn(),
    updateEntity: jest.fn(),
  };
  const producto = { id: 1, stock: 5 };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findOne.mockResolvedValue({ ...producto });
    repository.updateEntity.mockResolvedValue(undefined);

    service = new ProductoService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('incrementa el stock cuando el ajuste es válido', async () => {
    await expect(
      service.incrementarStock({} as any, producto.id, 3, 'Compra'),
    ).resolves.toBe(8);

    expect(repository.updateEntity).toHaveBeenCalledTimes(1);
    expect(repository.updateEntity.mock.calls[0][1].stock).toBe(8);
  });

  it('permite decrementar el stock hasta cero', async () => {
    await expect(
      service.decrementarStock({} as any, producto.id, 5, 'Venta'),
    ).resolves.toBe(0);

    expect(repository.updateEntity).toHaveBeenCalledTimes(1);
    expect(repository.updateEntity.mock.calls[0][1].stock).toBe(0);
  });

  it('rechaza un ajuste que deja el stock negativo', async () => {
    await expect(
      service.decrementarStock({} as any, producto.id, 6, 'Venta'),
    ).rejects.toThrow(
      new BadRequestException('El stock no puede quedar negativo.'),
    );

    expect(repository.updateEntity).not.toHaveBeenCalled();
  });

  it.each([undefined, '', '   '])(
    'rechaza un ajuste sin motivo: %p',
    async (motivo) => {
      await expect(
        service.incrementarStock({} as any, producto.id, 1, motivo as any),
      ).rejects.toThrow(
        new BadRequestException('El motivo del ajuste de stock es obligatorio.'),
      );

      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.updateEntity).not.toHaveBeenCalled();
    },
  );
});
