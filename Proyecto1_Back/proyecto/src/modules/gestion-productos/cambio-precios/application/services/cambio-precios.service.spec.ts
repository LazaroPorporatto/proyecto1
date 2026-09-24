import { BadRequestException } from '@nestjs/common';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';
import { CambioPreciosService } from './cambio-precios.service';
import { Producto } from '../../../producto/domain/entities/producto.entity';

const crearProducto = (overrides: Partial<Producto> = {}): Producto =>
  Object.assign(new Producto(), {
    id: 1,
    denominacion: 'Producto Test',
    precio: 100,
    costo: 80,
    porcentaje: 25,
    alicuotaIva: 21,
    deletedAt: null,
    lineaId: 1,
    ...overrides,
  });

describe('CambioPreciosService (US-006: ajuste masivo de precios)', () => {
  const crearQueryRunnerMock = (): QueryRunner => {
    const saveMock = jest.fn().mockImplementation((entity) =>
      Promise.resolve(entity),
    );
    const manager = {
      getRepository: jest.fn().mockReturnValue({ save: saveMock }),
    } as unknown as EntityManager;

    const queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager,
    } as unknown as QueryRunner;

    return queryRunner;
  };

  const setup = (overrides: {
    findByIds?: Producto[];
    usuario?: any;
    findByResult?: { data: Producto[]; total: number };
  }) => {
    const repository = {
      findBy: jest.fn().mockResolvedValue(
        overrides.findByResult ?? { data: [], total: 0 },
      ),
      findByIds: jest.fn().mockResolvedValue(overrides.findByIds ?? []),
      updateEntity: jest.fn().mockImplementation((_uow, entity) =>
        Promise.resolve(entity),
      ),
    };

    const queryRunner = crearQueryRunnerMock();
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;

    const usuarioService = {
      findOne: jest
        .fn()
        .mockResolvedValue(overrides.usuario === undefined ? { id: 1 } : overrides.usuario),
    };

    const service = new CambioPreciosService(
      repository as any,
      dataSource,
      usuarioService as any,
    );

    return { service, repository, dataSource, queryRunner, usuarioService };
  };

  describe('E1 - Ajuste global por porcentaje exitoso', () => {
    it('buscarProductos devuelve el ambito global y el resumen de precios', async () => {
      const { service } = setup({
        findByResult: { data: [crearProducto()], total: 1 },
      });

      const resultado = await service.buscarProductos({ skip: 0, take: 10 });

      expect(resultado.total).toBe(1);
      expect(resultado.ambito).toBe('global');
      expect(resultado.data[0]).toMatchObject({
        id: 1,
        precio: 100,
        precioConIva: 121,
        costo: 80,
      });
    });

    it('aplicarCambios calcula el preview por porcentaje (nuevoPrecio, nuevoMargen e IVA) sin persistir', async () => {
      const { service, repository } = setup({
        findByIds: [crearProducto()],
      });

      const resultado = await service.aplicarCambios({
        tipo: 'porcentaje',
        valor: 10,
        items: [{ id: 1 }],
      });

      expect(resultado[0].nuevoPrecio).toBe(110);
      expect(resultado[0].nuevoPorcentaje).toBe(37.5);
      expect(resultado[0].nuevoPrecioConIva).toBe(133.1);
      expect(resultado[0].error).toBeNull();
      expect(repository.updateEntity).not.toHaveBeenCalled();
    });

    it('guardarCambios persiste en una sola operacion y devuelve el historial con el motivo', async () => {
      const { service, queryRunner, repository } = setup({
        findByIds: [crearProducto()],
        usuario: { id: 7 },
      });

      const resultado = await service.guardarCambios({
        items: [{ id: 1, nuevoPrecio: 110 }],
        motivo: 'Aumento por inflacion',
        usuarioCreatedId: 7,
      });

      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(repository.updateEntity).toHaveBeenCalledTimes(1);
      expect(resultado.mensaje).toContain('1 producto');
      expect(resultado.historial[0]).toMatchObject({
        productoId: 1,
        precioAnterior: 100,
        precioNuevo: 110,
        motivo: 'Aumento por inflacion',
        usuarioCreatedId: 7,
      });
    });
  });

  describe('E2 - Ajuste por monto restringido a una Linea', () => {
    it('buscarProductos con lineaId devuelve el ambito linea', async () => {
      const { service } = setup({ findByResult: { data: [], total: 0 } });

      const resultado = await service.buscarProductos({
        lineaId: 5,
        skip: 0,
        take: 10,
      });

      expect(resultado.ambito).toBe('linea');
    });

    it('aplicarCambios calcula el preview por monto', async () => {
      const { service } = setup({ findByIds: [crearProducto()] });

      const resultado = await service.aplicarCambios({
        tipo: 'monto',
        valor: -10,
        items: [{ id: 1 }],
      });

      expect(resultado[0].nuevoPrecio).toBe(90);
      expect(resultado[0].nuevoPorcentaje).toBe(12.5);
    });
  });

  describe('E3 - Rechazo por precios resultantes invalidos', () => {
    it('aplicarCambios marca error por producto cuando el resultado queda por debajo del costo', async () => {
      const { service } = setup({ findByIds: [crearProducto()] });

      const resultado = await service.aplicarCambios({
        tipo: 'porcentaje',
        valor: -30,
        items: [{ id: 1 }],
      });

      expect(resultado[0].error).toContain('costo');
    });

    it('guardarCambios rechaza un nuevo precio invalido y hace rollback sin persistir nada', async () => {
      const { service, queryRunner, repository } = setup({
        findByIds: [crearProducto()],
        usuario: { id: 7 },
      });

      await expect(
        service.guardarCambios({
          items: [{ id: 1, nuevoPrecio: 70 }],
          motivo: 'Descuento erroneo',
          usuarioCreatedId: 7,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(repository.updateEntity).not.toHaveBeenCalled();
    });
  });

  describe('E5 - Guardado parcial con advertencia', () => {
    it('persiste solo los items recibidos (validos) y deja el resto del catalogo intacto', async () => {
      const { service, repository } = setup({
        findByIds: [crearProducto({ id: 1 }), crearProducto({ id: 2 })],
        usuario: { id: 7 },
      });

      const resultado = await service.guardarCambios({
        items: [{ id: 1, nuevoPrecio: 110 }],
        motivo: 'Ajuste trimestral',
        usuarioCreatedId: 7,
      });

      expect(repository.updateEntity).toHaveBeenCalledTimes(1);
      expect(resultado.mensaje).toContain('1 producto');
      expect(resultado.historial).toHaveLength(1);
      expect(resultado.historial[0].productoId).toBe(1);
    });
  });

  describe('Regla dura - El preview se calcula en el servicio (server-authoritative)', () => {
    it('aplicarCambios ignora cualquier precio enviado por el cliente', async () => {
      const { service } = setup({ findByIds: [crearProducto({ precio: 100 })] });

      const resultado = await service.aplicarCambios({
        tipo: 'porcentaje',
        valor: 10,
        items: [{ id: 1, precio: 999 } as any],
      });

      expect(resultado[0].nuevoPrecio).toBe(110);
    });
  });
});