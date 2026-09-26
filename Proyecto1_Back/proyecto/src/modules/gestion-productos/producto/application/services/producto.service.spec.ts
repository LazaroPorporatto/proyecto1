import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ProductoService } from './producto.service';
import { LineaService } from 'src/modules/gestion-productos/linea/application/services/linea.service';
import { MarcaService } from 'src/modules/gestion-productos/marca/application/services/marca.service';
import { ProveedorService } from 'src/modules/organizacion/proveedor/application/services/proveedor.service';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { UsuarioValidator } from 'src/modules/common/utils/validation/usuario-validator';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';
import { ProductoValidationService } from '../../domain/services/producto-validation.service.ts';
import { ProductoRelatedEntitiesValidator } from '../../infraestructure/validators/producto-related-entities.validator.ts';
import { ProductoUniquenessValidator } from '../../infraestructure/validators/producto-uniqueness.validator.ts';
import { ProductoDeletePolicy } from '../policies/producto-delete.policy';
import { Producto } from '../../domain/entities/producto.entity';

const buildProducto = (overrides: Partial<Producto> = {}): Producto =>
  ({
    id: 1,
    denominacion: 'ACEITE',
    marcaId: 2,
    lineaId: 1,
    linea: { id: 1, denominacion: 'Linea' },
    marca: { id: 2, denominacion: 'Marca' },
    alicuotaIva: 21,
    precio: 1200,
    stock: 10,
    sistema: 0,
    ...overrides,
  }) as Producto;

describe('ProductoService', () => {
  let service: ProductoService;

  let repository: {
    create: jest.Mock;
    update: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    findHistorialPrecios: jest.Mock;
    updateEntity: jest.Mock;
  };
  let intrinsicValidationService: { validarDatosBasicos: jest.Mock };
  let uniquenessValidator: {
    validarDenominacionUnica: jest.Mock;
    validarCodigoProveedorUnico: jest.Mock;
  };
  let relatedEntitiesValidator: {
    validarYObtenerEntidadesRelacionadas: jest.Mock;
  };
  let validationService: { validarEntidadesRelacionadas: jest.Mock };
  let usuarioValidator: { validarUsuarioExiste: jest.Mock };
  let usuarioService: { findOne: jest.Mock };
  let productoDeletePolicy: Record<string, jest.Mock>;

  const marca = { id: 2, denominacion: 'Marca' } as never;
  const linea = { id: 1, denominacion: 'Linea' } as never;
  const usuario = { id: 7, denominacion: 'Usuario' } as never;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      findHistorialPrecios: jest.fn(),
      updateEntity: jest.fn(),
    };
    intrinsicValidationService = { validarDatosBasicos: jest.fn() };
    uniquenessValidator = {
      validarDenominacionUnica: jest.fn(),
      validarCodigoProveedorUnico: jest.fn(),
    };
    relatedEntitiesValidator = {
      validarYObtenerEntidadesRelacionadas: jest.fn().mockResolvedValue({
        marca,
        linea,
      }),
    };
    validationService = { validarEntidadesRelacionadas: jest.fn() };
    usuarioValidator = {
      validarUsuarioExiste: jest.fn().mockResolvedValue(usuario),
    };
    usuarioService = { findOne: jest.fn().mockResolvedValue(usuario) };
    productoDeletePolicy = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoService,
        { provide: 'IProductoRepository', useValue: repository },
        { provide: LineaService, useValue: { findEntityById: jest.fn() } },
        { provide: MarcaService, useValue: { findEntityById: jest.fn() } },
        { provide: ProveedorService, useValue: {} },
        { provide: UsuarioService, useValue: usuarioService },
        {
          provide: ProductoIntrinsicValidationService,
          useValue: intrinsicValidationService,
        },
        { provide: ProductoValidationService, useValue: validationService },
        {
          provide: ProductoRelatedEntitiesValidator,
          useValue: relatedEntitiesValidator,
        },
        {
          provide: ProductoUniquenessValidator,
          useValue: uniquenessValidator,
        },
        { provide: UsuarioValidator, useValue: usuarioValidator },
        { provide: ProductoDeletePolicy, useValue: productoDeletePolicy },
      ],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findEntityById', () => {
    it('devuelve la entidad cuando existe', async () => {
      const producto = buildProducto();
      repository.findOne.mockResolvedValue(producto);

      await expect(service.findEntityById(1)).resolves.toBe(producto);
      expect(repository.findOne).toHaveBeenCalledWith(1);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findEntityById(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findDtoById', () => {
    it('mapea la entidad a DTO', async () => {
      repository.findOne.mockResolvedValue(buildProducto({ precio: 1350 }));

      const dto = await service.findDtoById(1);

      expect(dto.id).toBe(1);
      expect(dto.denominacion).toBe('ACEITE');
      expect(dto.precio).toBe(1350);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findDtoById(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('obtenerHistorialPrecios', () => {
    it('devuelve el historial convertido a numero', async () => {
      repository.findOne.mockResolvedValue(buildProducto());
      const fecha = new Date('2026-09-22T00:00:00.000Z');
      repository.findHistorialPrecios.mockResolvedValue({
        data: [
          {
            id: 1,
            productoId: 1,
            precioAnterior: '1200.00000',
            precioNuevo: '1350.00000',
            fecha,
            motivo: 'Actualizacion de costo',
            usuarioId: 7,
          },
        ],
        total: 1,
      });

      const resultado = await service.obtenerHistorialPrecios(1, 0, 10);

      expect(resultado.total).toBe(1);
      expect(resultado.data[0].precioAnterior).toBe(1200);
      expect(resultado.data[0].precioNuevo).toBe(1350);
      expect(resultado.data[0].motivo).toBe('Actualizacion de costo');
      expect(resultado.data[0].usuarioId).toBe(7);
      expect(resultado.data[0].fecha).toBe(fecha);
    });

    it('lanza NotFoundException si el producto no existe y no consulta el historial', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.obtenerHistorialPrecios(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.findHistorialPrecios).not.toHaveBeenCalled();
    });

    it('usa skip=0 y take=10 por defecto', async () => {
      repository.findOne.mockResolvedValue(buildProducto());
      repository.findHistorialPrecios.mockResolvedValue({ data: [], total: 0 });

      await service.obtenerHistorialPrecios(1);

      expect(repository.findHistorialPrecios).toHaveBeenCalledWith(1, 0, 10);
    });
  });

  describe('create', () => {
    it('valida y delega la creacion al repositorio', async () => {
      const dto = {
        denominacion: 'ACEITE',
        marcaId: 2,
        lineaId: 1,
        alicuotaIva: 21,
        usuarioCreatedId: 7,
      } as never;
      repository.create.mockResolvedValue({ denominacion: 'ACEITE' });

      await service.create(dto);

      expect(intrinsicValidationService.validarDatosBasicos).toHaveBeenCalled();
      expect(
        uniquenessValidator.validarDenominacionUnica,
      ).toHaveBeenCalledWith('ACEITE');
      expect(
        relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas,
      ).toHaveBeenCalledWith(2, 1);
      expect(validationService.validarEntidadesRelacionadas).toHaveBeenCalled();
      expect(usuarioValidator.validarUsuarioExiste).toHaveBeenCalledWith(7);
      expect(repository.create).toHaveBeenCalledWith(
        dto,
        linea,
        marca,
        usuario,
      );
    });
  });

  describe('update', () => {
    const dto = {
      denominacion: 'ACEITE',
      usuarioUpdatedId: 7,
    } as never;

    it('valida y delega la actualizacion al repositorio', async () => {
      repository.findOne.mockResolvedValue(buildProducto());
      repository.update.mockResolvedValue({ denominacion: 'ACEITE' });

      await service.update(1, dto);

      expect(
        uniquenessValidator.validarDenominacionUnica,
      ).toHaveBeenCalledWith('ACEITE', 1);
      expect(repository.update).toHaveBeenCalledWith(1, dto, linea, marca, usuario);
    });

    it('lanza NotFoundException si el producto no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(99, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('lanza InternalServerErrorException si el producto no tiene linea ni marca', async () => {
      repository.findOne.mockResolvedValue(
        buildProducto({
          lineaId: null,
          marcaId: null,
        } as unknown as Partial<Producto>),
      );

      await expect(service.update(1, dto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina el producto con el usuario indicado', async () => {
      const producto = buildProducto();
      repository.findOne.mockResolvedValue(producto);

      await service.remove(1, 7);

      expect(usuarioService.findOne).toHaveBeenCalledWith(7);
      expect(repository.remove).toHaveBeenCalledWith(producto, usuario);
    });

    it('lanza NotFoundException si el producto no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(99, 7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza ForbiddenException si el producto pertenece al sistema', async () => {
      repository.findOne.mockResolvedValue(buildProducto({ sistema: 1 }));

      await expect(service.remove(1, 7)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      repository.findOne.mockResolvedValue(buildProducto());
      usuarioService.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('ajuste de stock', () => {
    const uow = {} as never;

    it('incrementarStock suma la cantidad', async () => {
      const producto = buildProducto({ stock: 10 });
      repository.findOne.mockResolvedValue(producto);

      const stock = await service.incrementarStock(uow, 1, 5, 'venta');

      expect(stock).toBe(15);
      expect(producto.stock).toBe(15);
      expect(repository.updateEntity).toHaveBeenCalledWith(uow, producto);
    });

    it('decrementarStock resta la cantidad', async () => {
      const producto = buildProducto({ stock: 10 });
      repository.findOne.mockResolvedValue(producto);

      const stock = await service.decrementarStock(uow, 1, 3, 'merma');

      expect(stock).toBe(7);
    });

    it('lanza error si el producto no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.incrementarStock(uow, 99, 1)).rejects.toThrow(
        'Producto con ID 99 no encontrado',
      );
    });
  });
});
