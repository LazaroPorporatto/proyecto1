import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Producto } from '../../domain/entities/producto.entity';
import { HistorialPrecio } from '../../domain/entities/historial-precio.entity';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { ProductoPersistenceAdapter } from './producto.persistence-adapters';

describe('ProductoPersistenceAdapter - CR-007', () => {
  const usuario = { id: 7 } as any;
  const linea = { id: 2 } as any;
  const marca = { id: 3 } as any;

  const createAdapter = (producto: Producto) => {
    const productoRepository = {
      save: jest.fn(async (entity) => entity),
    };
    const historialRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(async (entity) => entity),
    };
    const queryRunner = {
      manager: {
        getRepository: jest.fn((target) =>
          target === Producto ? productoRepository : historialRepository,
        ),
      },
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    const dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as DataSource;

    const adapter = new ProductoPersistenceAdapter(
      {} as any,
      dataSource,
      {} as any,
    );

    jest.spyOn(adapter, 'findOne').mockResolvedValue(producto);

    return {
      adapter,
      productoRepository,
      historialRepository,
      queryRunner,
    };
  };

  it('registra precio anterior, precio nuevo, motivo y usuario', async () => {
    const producto = { id: 11, precio: 1000 } as Producto;
    const { adapter, productoRepository, historialRepository } =
      createAdapter(producto);

    await adapter.update(
      11,
      {
        denominacion: 'Producto de prueba',
        usuarioUpdatedId: usuario.id,
        precio: 1150,
        motivoPrecio: 'Actualizacion de costo',
      } as UpdateProductoDto,
      linea,
      marca,
      usuario,
    );

    expect(productoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ precio: 1150 }),
    );
    expect(historialRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productoId: 11,
        precioAnterior: 1000,
        precioNuevo: 1150,
        motivo: 'Actualizacion de costo',
        usuarioId: 7,
      }),
    );
    expect(historialRepository.save).toHaveBeenCalledTimes(1);
  });

  it.each([0, -1])(
    'rechaza un precio nuevo no positivo: %s',
    async (precio) => {
      const producto = { id: 11, precio: 1000 } as Producto;
      const { adapter, productoRepository, historialRepository } =
        createAdapter(producto);

      await expect(
        adapter.update(
          11,
          {
            denominacion: 'Producto de prueba',
            usuarioUpdatedId: usuario.id,
            precio,
            motivoPrecio: 'Motivo valido',
          } as UpdateProductoDto,
          linea,
          marca,
          usuario,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(productoRepository.save).not.toHaveBeenCalled();
      expect(historialRepository.save).not.toHaveBeenCalled();
    },
  );

  it('rechaza un cambio sin motivo o con espacios', async () => {
    const producto = { id: 11, precio: 1000 } as Producto;
    const { adapter, productoRepository, historialRepository } =
      createAdapter(producto);

    await expect(
      adapter.update(
        11,
        {
          denominacion: 'Producto de prueba',
          usuarioUpdatedId: usuario.id,
          precio: 1150,
          motivoPrecio: '   ',
        } as UpdateProductoDto,
        linea,
        marca,
        usuario,
      ),
    ).rejects.toThrow('El motivo del cambio de precio es obligatorio.');

    expect(productoRepository.save).not.toHaveBeenCalled();
    expect(historialRepository.save).not.toHaveBeenCalled();
  });

  it('no crea historial cuando el precio no cambia', async () => {
    const producto = { id: 11, precio: 1000 } as Producto;
    const { adapter, historialRepository } = createAdapter(producto);

    await adapter.update(
      11,
      {
        denominacion: 'Producto de prueba',
        usuarioUpdatedId: usuario.id,
        precio: 1000,
      } as UpdateProductoDto,
      linea,
      marca,
      usuario,
    );

    expect(historialRepository.save).not.toHaveBeenCalled();
  });
});