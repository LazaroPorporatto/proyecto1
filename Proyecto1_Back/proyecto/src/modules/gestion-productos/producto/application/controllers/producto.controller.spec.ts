import { Test, TestingModule } from '@nestjs/testing';

import { ProductoController } from './producto.controller';
import { ProductoService } from '../services/producto.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';

describe('ProductoController', () => {
  let controller: ProductoController;
  let service: {
    create: jest.Mock;
    update: jest.Mock;
    findDtoById: jest.Mock;
    remove: jest.Mock;
    obtenerHistorialPrecios: jest.Mock;
    findByIdConAuditoria: jest.Mock;
    buscarMarcaDesdeProducto: jest.Mock;
    buscarLineaDesdeProducto: jest.Mock;
    findByRapido: jest.Mock;
    findBy: jest.Mock;
    findAllForMarcas: jest.Mock;
    findAllForLineas: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      update: jest.fn(),
      findDtoById: jest.fn(),
      remove: jest.fn(),
      obtenerHistorialPrecios: jest.fn(),
      findByIdConAuditoria: jest.fn(),
      buscarMarcaDesdeProducto: jest.fn(),
      buscarLineaDesdeProducto: jest.fn(),
      findByRapido: jest.fn(),
      findBy: jest.fn(),
      findAllForMarcas: jest.fn(),
      findAllForLineas: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductoController],
      providers: [{ provide: ProductoService, useValue: service }],
    })
      // El controller aplica AuthGuard a nivel de clase; se reemplaza para no
      // arrastrar JwtService, ConfigService e IUsuarioRepository a la unidad.
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductoController>(ProductoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delega la creacion en el service', async () => {
      const dto = { denominacion: 'ACEITE' } as CreateProductoDto;

      await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findOne', () => {
    it('delega la busqueda en el service', async () => {
      service.findDtoById.mockResolvedValue({ id: 1 });

      await expect(controller.findOne(1)).resolves.toEqual({ id: 1 });
      expect(service.findDtoById).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('delega la actualizacion en el service', async () => {
      const dto = { denominacion: 'ACEITE' } as UpdateProductoDto;

      await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('delega la eliminacion en el service con el usuario del query', async () => {
      await controller.remove(1, 7);

      expect(service.remove).toHaveBeenCalledWith(1, 7);
    });
  });

  describe('historialPrecios', () => {
    it('delega con skip y take explicitos', async () => {
      service.obtenerHistorialPrecios.mockResolvedValue({ data: [], total: 0 });

      await expect(controller.historialPrecios(1, 0, 10)).resolves.toEqual({
        data: [],
        total: 0,
      });
      expect(service.obtenerHistorialPrecios).toHaveBeenCalledWith(1, 0, 10);
    });

    it('propaga los errores del service', async () => {
      service.obtenerHistorialPrecios.mockRejectedValue(
        new Error('Producto con ID 1 no encontrado.'),
      );

      await expect(controller.historialPrecios(1, 0, 10)).rejects.toThrow(
        'Producto con ID 1 no encontrado.',
      );
    });
  });

  describe('findByIdConAuditoria', () => {
    it('delega la consulta de auditoria en el service', async () => {
      service.findByIdConAuditoria.mockResolvedValue({ id: 1 });

      await expect(controller.findByIdConAuditoria(1)).resolves.toEqual({
        id: 1,
      });
      expect(service.findByIdConAuditoria).toHaveBeenCalledWith(1);
    });
  });

  describe('consultas de marca y linea', () => {
    it('getMarcaDelProducto delega en el service', async () => {
      await controller.getMarcaDelProducto(1);

      expect(service.buscarMarcaDesdeProducto).toHaveBeenCalledWith(1);
    });

    it('geLineaDelProducto delega en el service', async () => {
      await controller.geLineaDelProducto(1);

      expect(service.buscarLineaDesdeProducto).toHaveBeenCalledWith(1);
    });
  });

  describe('findAllMarcasFor', () => {
    it('usa cadena vacia por defecto', async () => {
      await controller.findAllMarcasFor({ denominacion: undefined } as never);

      expect(service.findAllForMarcas).toHaveBeenCalledWith('');
    });
  });

  describe('findAllLineasFor', () => {
    it('usa cadena vacia por defecto', async () => {
      await controller.findAllLineasFor({ denominacion: undefined } as never);

      expect(service.findAllForLineas).toHaveBeenCalledWith('');
    });
  });

  describe('searchRapido', () => {
    it('delega la busqueda rapida en el service', async () => {
      const dto = {
        codigo: 'ACE',
        exacto: true,
        skip: 0,
        take: 10,
      } as never;

      await controller.searchRapido(dto);

      expect(service.findByRapido).toHaveBeenCalledWith('ACE', true, 0, 10);
    });
  });

  describe('search', () => {
    it('delega la busqueda con los filtros recibidos', async () => {
      const dto = {
        denominacion: 'ACE',
        skip: 0,
        take: 20,
      } as never;

      await controller.search(dto);

      expect(service.findBy).toHaveBeenCalledWith(
        'ACE',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        0,
        20,
      );
    });
  });
});
