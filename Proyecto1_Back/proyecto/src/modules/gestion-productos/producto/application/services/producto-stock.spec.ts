import { BadRequestException } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { Producto } from '../../domain/entities/producto.entity';
import { MovimientoStock } from '../../domain/entities/movimiento-stock.entity';
import { StockBajoEvent } from '../../domain/events/stock-bajo.event';
import { StockActualizadoEvent } from '../../domain/events/stock-actualizado.event';
import { TipoMovimiento } from '../../enums/tipo-movimiento.enum';

describe('ProductoService - MovimientoStock y eventos de stock (P1-30 / P1-31)', () => {
  let service: ProductoService;
  const repository = {
    findOne: jest.fn(),
    updateEntity: jest.fn(),
  };
  const movimientoStockRepository = {
    save: jest.fn(),
    findByProductoId: jest.fn(),
  };
  const eventPublisher = {
    publish: jest.fn(),
  };

  const construir = (productoMock: any) => {
    jest.clearAllMocks();
    repository.findOne.mockResolvedValue({ ...productoMock });
    repository.updateEntity.mockResolvedValue(undefined);
    movimientoStockRepository.save.mockResolvedValue(undefined);

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
      {} as any,
      movimientoStockRepository as any,
      eventPublisher as any,
    );
  };

  it('registra un MovimientoStock dentro de la misma operacion', async () => {
    construir({ id: 10, stock: 5, denominacion: 'Test' });

    await service.incrementarStock({} as any, 10, 3, 'Compra');

    expect(movimientoStockRepository.save).toHaveBeenCalledTimes(1);
    const movimiento = movimientoStockRepository.save.mock.calls[0][1] as MovimientoStock;
    expect(movimiento).toBeInstanceOf(MovimientoStock);
    expect(movimiento.productoId).toBe(10);
    expect(movimiento.tipoMovimiento).toBe(TipoMovimiento.AJUSTE);
    expect(movimiento.cantidad).toBe(3);
    expect(movimiento.motivo).toBe('Compra');
    expect(movimiento.stockAnterior).toBe(5);
    expect(movimiento.stockNuevo).toBe(8);
  });

  it('propaga el tipo de movimiento enviado', async () => {
    construir({ id: 10, stock: 5, denominacion: 'Test' });

    await service.decrementarStock(
      {} as any,
      10,
      2,
      'Venta',
      TipoMovimiento.VENTA,
    );

    const movimiento = movimientoStockRepository.save.mock.calls[0][1] as MovimientoStock;
    expect(movimiento.tipoMovimiento).toBe(TipoMovimiento.VENTA);
    expect(movimiento.cantidad).toBe(-2);
  });

  it('publica StockActualizado despues del ajuste', async () => {
    construir({ id: 10, stock: 5, denominacion: 'Test' });

    await service.incrementarStock({} as any, 10, 3, 'Compra');

    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    const eventos = eventPublisher.publish.mock.calls[0][0];
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toBeInstanceOf(StockActualizadoEvent);
  });

  it('publica StockBajo cuando tras el ajuste queda en (o debajo del) minimo', async () => {
    construir({
      id: 10,
      stock: 8,
      denominacion: 'Coca-Cola 2L',
      stockMinimo: 5,
      utilizaStockMinimo: true,
    });

    await service.decrementarStock({} as any, 10, 3, 'Venta');

    const eventos = eventPublisher.publish.mock.calls[0][0];
    expect(eventos).toHaveLength(2);
    expect(eventos[0]).toBeInstanceOf(StockActualizadoEvent);
    expect(eventos[1]).toBeInstanceOf(StockBajoEvent);
    expect(eventos[1].productoId).toBe(10);
    expect(eventos[1].stockActual).toBe(5);
    expect(eventos[1].stockMinimo).toBe(5);
  });

  it('no publica StockBajo si el stock sigue por encima del minimo', async () => {
    construir({
      id: 10,
      stock: 10,
      denominacion: 'Coca-Cola 2L',
      stockMinimo: 5,
      utilizaStockMinimo: true,
    });

    await service.decrementarStock({} as any, 10, 3, 'Venta');

    const eventos = eventPublisher.publish.mock.calls[0][0];
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toBeInstanceOf(StockActualizadoEvent);
  });

  it('sigue rechazando un ajuste sin motivo (sin consultar ni persistir)', async () => {
    construir({ id: 10, stock: 5, denominacion: 'Test' });

    await expect(
      service.incrementarStock({} as any, 10, 1, '' as any),
    ).rejects.toThrow(
      new BadRequestException('El motivo del ajuste de stock es obligatorio.'),
    );

    expect(repository.findOne).not.toHaveBeenCalled();
    expect(repository.updateEntity).not.toHaveBeenCalled();
    expect(movimientoStockRepository.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('sigue rechazando un stock negativo sin persistir nada', async () => {
    construir({ id: 10, stock: 5, denominacion: 'Test' });

    await expect(
      service.decrementarStock({} as any, 10, 6, 'Venta'),
    ).rejects.toThrow(
      new BadRequestException('El stock no puede quedar negativo.'),
    );

    expect(repository.updateEntity).not.toHaveBeenCalled();
    expect(movimientoStockRepository.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });
});

describe('ProductoService - Stock inicial al crear (alta de producto)', () => {
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: { getRepository: jest.fn(() => ({ save: jest.fn() })) },
  };
  const dataSource = { createQueryRunner: jest.fn(() => queryRunner) } as any;

  const movimientoStockRepository = {
    save: jest.fn(),
    findByProductoId: jest.fn(),
  };

  const crearService = (repo: any) => {
    jest.clearAllMocks();
    dataSource.createQueryRunner.mockReturnValue(queryRunner);
    movimientoStockRepository.save.mockResolvedValue(undefined);

    return new ProductoService(
      repo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { validarDatosBasicos: jest.fn() } as any,
      { validarEntidadesRelacionadas: jest.fn() } as any,
      {} as any,
      {
        validarYObtenerEntidadesRelacionadas: jest.fn().mockResolvedValue({
          marca: {},
          linea: {},
        }),
      } as any,
      {
        validarDenominacionUnica: jest.fn().mockResolvedValue(undefined),
        validarCodigoProveedorUnico: jest.fn().mockResolvedValue(undefined),
      } as any,
      { validarUsuarioExiste: jest.fn().mockResolvedValue({}) } as any,
      {} as any,
      movimientoStockRepository as any,
      {} as any,
      dataSource as any,
    );
  };

  it('registra un MovimientoStock de "Stock inicial" cuando el alta trae stock', async () => {
    const repository = {
      create: jest.fn().mockResolvedValue({ id: 99, stock: 10, denominacion: 'Test' }),
    };
    const service = crearService(repository);

    await service.create({
      denominacion: 'Test',
      marcaId: 1,
      lineaId: 1,
      alicuotaIva: '21' as any,
      costo: 10,
      precio: 20,
      cantidadPresentacion: 1,
      usuarioCreatedId: 1,
      stock: 10,
    } as any);

    expect(movimientoStockRepository.save).toHaveBeenCalledTimes(1);
    const movimiento = movimientoStockRepository.save.mock.calls[0][1] as MovimientoStock;
    expect(movimiento).toBeInstanceOf(MovimientoStock);
    expect(movimiento.productoId).toBe(99);
    expect(movimiento.tipoMovimiento).toBe(TipoMovimiento.AJUSTE);
    expect(movimiento.motivo).toBe('Stock inicial');
    expect(movimiento.cantidad).toBe(10);
    expect(movimiento.stockAnterior).toBe(0);
    expect(movimiento.stockNuevo).toBe(10);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('no registra movimiento si el alta no trae stock', async () => {
    const repository = {
      create: jest.fn().mockResolvedValue({ id: 100, stock: 0, denominacion: 'Test' }),
    };
    const service = crearService(repository);

    await service.create({
      denominacion: 'Test',
      marcaId: 1,
      lineaId: 1,
      alicuotaIva: '21' as any,
      costo: 10,
      precio: 20,
      cantidadPresentacion: 1,
      usuarioCreatedId: 1,
      stock: undefined,
    } as any);

    expect(movimientoStockRepository.save).not.toHaveBeenCalled();
    expect(queryRunner.startTransaction).not.toHaveBeenCalled();
  });
});

describe('ProductoService - Regla Precio = Costo + Margen (P1-73) en alta y edicion', () => {
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: { getRepository: jest.fn(() => ({ save: jest.fn() })) },
  };
  const dataSource = { createQueryRunner: jest.fn(() => queryRunner) } as any;
  const movimientoStockRepository = {
    save: jest.fn(),
    findByProductoId: jest.fn(),
  };

  const validators = {
    validarDatosBasicos: jest.fn(),
    validarEntidadesRelacionadas: jest.fn(),
    validarYObtenerEntidadesRelacionadas: jest
      .fn()
      .mockResolvedValue({ marca: {}, linea: {} }),
    validarDenominacionUnica: jest.fn().mockResolvedValue(undefined),
    validarCodigoProveedorUnico: jest.fn().mockResolvedValue(undefined),
    validarUsuarioExiste: jest.fn().mockResolvedValue({}),
  };

  const crearServicio = (repo: any) =>
    new ProductoService(
      repo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { validarDatosBasicos: validators.validarDatosBasicos } as any,
      { validarEntidadesRelacionadas: validators.validarEntidadesRelacionadas } as any,
      {} as any,
      {
        validarYObtenerEntidadesRelacionadas:
          validators.validarYObtenerEntidadesRelacionadas,
      } as any,
      {
        validarDenominacionUnica: validators.validarDenominacionUnica,
        validarCodigoProveedorUnico: validators.validarCodigoProveedorUnico,
      } as any,
      { validarUsuarioExiste: validators.validarUsuarioExiste } as any,
      {} as any,
      movimientoStockRepository as any,
      {} as any,
      dataSource as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('en alta: si viene el margen, deriva el precio antes de persistir', async () => {
    const repository = { create: jest.fn().mockResolvedValue({ id: 1, denominacion: 'Test', stock: 0 }) };
    const service = crearServicio(repository);

    await service.create({
      denominacion: 'Test',
      costo: 1000,
      porcentaje: 15,
      cantidadPresentacion: 1,
      usuarioCreatedId: 1,
    } as any);

    const dtoPersistido = repository.create.mock.calls[0][0];
    expect(dtoPersistido.precio).toBe(1150);
    expect(dtoPersistido.porcentaje).toBe(15);
  });

  it('en alta: sin margen, con solo precio, recalcula el margen implicito', async () => {
    const repository = { create: jest.fn().mockResolvedValue({ id: 1, denominacion: 'Test', stock: 0 }) };
    const service = crearServicio(repository);

    await service.create({
      denominacion: 'Test',
      costo: 80,
      precio: 100,
      cantidadPresentacion: 1,
      usuarioCreatedId: 1,
    } as any);

    const dtoPersistido = repository.create.mock.calls[0][0];
    expect(dtoPersistido.precio).toBe(100);
    expect(dtoPersistido.porcentaje).toBe(25);
  });

  it('en alta: rechaza si no se indica margen ni precio', async () => {
    const repository = { create: jest.fn() };
    const service = crearServicio(repository);

    await expect(
      service.create({
        denominacion: 'Test',
        costo: 1000,
        cantidadPresentacion: 1,
        usuarioCreatedId: 1,
      } as any),
    ).rejects.toThrow(
      'Se debe indicar el margen (porcentaje) o el precio del producto.',
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('en edicion: si cambia el margen, re-deriva el precio antes de persistir', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(
        Object.assign(new Producto(), {
          id: 1,
          denominacion: 'Test',
          costo: 1000,
          porcentaje: 15,
          precio: 1150,
          lineaId: 1,
          marcaId: 1,
          alicuotaIva: 21,
          cantidadPresentacion: 1,
        }),
      ),
      update: jest.fn().mockResolvedValue({ id: 1, denominacion: 'Test' }),
    };
    const service = crearServicio(repository);

    await service.update(1, { porcentaje: 25 } as any);

    const dtoPersistido = repository.update.mock.calls[0][1];
    expect(dtoPersistido.precio).toBe(1250);
    expect(dtoPersistido.porcentaje).toBe(25);
  });

  it('en edicion: si cambia solo el precio, recalcula el margen implicito', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(
        Object.assign(new Producto(), {
          id: 1,
          denominacion: 'Test',
          costo: 1000,
          porcentaje: 15,
          precio: 1150,
          lineaId: 1,
          marcaId: 1,
          alicuotaIva: 21,
          cantidadPresentacion: 1,
        }),
      ),
      update: jest.fn().mockResolvedValue({ id: 1, denominacion: 'Test' }),
    };
    const service = crearServicio(repository);

    await service.update(1, { precio: 1250 } as any);

    const dtoPersistido = repository.update.mock.calls[0][1];
    expect(dtoPersistido.precio).toBe(1250);
    expect(dtoPersistido.porcentaje).toBe(25);
  });
});