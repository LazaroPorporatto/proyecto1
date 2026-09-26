import { Test, TestingModule } from '@nestjs/testing';
import { SuperLineaService } from './super-linea.service';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { CreateSuperLineaDto } from '../../dto/create-super-linea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-super-linea.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PoliticaEliminacionSuperLinea } from '../../domain/services/politica-eliminacion-super-linea.service';

describe('SuperLineaService (Unitaria)', () => {
  let service: SuperLineaService;
  let repository: any;
  let usuarioService: any;
  let validacionesService: any;

  const mockRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    findByDenominacionWith: jest.fn(),
    findByDenominacionFiltered: jest.fn(),
    findAllFor: jest.fn(),
    findAllListado: jest.fn(),
    findByIdConAuditoria: jest.fn(),
    remove: jest.fn(),
  };

  const mockUsuarioService = {
    findOne: jest.fn(),
  };

  const mockValidacionesService = {
    tieneLineasActivasParaSuperLinea: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperLineaService,
        {
          provide: 'ISuperLineaRepository',
          useValue: mockRepository,
        },
        {
          provide: UsuarioService,
          useValue: mockUsuarioService,
        },
        {
          provide: PoliticaEliminacionSuperLinea,
          useValue: mockValidacionesService,
        },
      ],
    }).compile();

    service = module.get<SuperLineaService>(SuperLineaService);
    repository = module.get('ISuperLineaRepository');
    usuarioService = module.get<UsuarioService>(UsuarioService);
    validacionesService = module.get<PoliticaEliminacionSuperLinea>(PoliticaEliminacionSuperLinea);

    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear una SuperLínea si la denominación no está en uso', async () => {
      const dto: CreateSuperLineaDto = {
        denominacion: 'Bebidas',
        utilizaStockMinimo: false,
        stockMinimo: 0,
        usuarioCreatedId: 1,
        deletedAt: null,
      };

      mockRepository.findByDenominacionWith.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ id: 1, denominacion: 'Bebidas' });

      const result = await service.create(dto);
      expect(mockRepository.findByDenominacionWith).toHaveBeenCalledWith('BEBIDAS');
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(result).toBeDefined();
      expect(result.mensaje).toContain('creada');
    });

    it('debería lanzar ConflictException si la denominación ya existe', async () => {
      const dto: CreateSuperLineaDto = {
        denominacion: 'Bebidas',
        usuarioCreatedId: 1,
        deletedAt: null,
      };

      mockRepository.findByDenominacionWith.mockResolvedValue({ id: 2, denominacion: 'Bebidas' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('debería actualizar una SuperLínea no perteneciente al sistema', async () => {
      const dto: UpdateSuperLineaDto = {
        denominacion: 'Bebidas V2',
        usuarioUpdatedId: 1,
        updatedAt: new Date(),
      };

      const existingEntity = { id: 1, denominacion: 'Bebidas', sistema: 0 };
      mockRepository.findOne.mockResolvedValue(existingEntity);
      mockRepository.findByDenominacionWith.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({ id: 1, denominacion: 'Bebidas V2' });

      const result = await service.update(1, dto);
      expect(result.mensaje).toContain('editada');
    });
  });

  describe('findByDenominacionFiltered', () => {
    it('debería retornar el resultado del repositorio paginado', async () => {
      mockRepository.findByDenominacionFiltered.mockResolvedValue({
        data: [{ id: 1, denominacion: 'Bebidas' }],
        total: 1,
      });

      const result = await service.findByDenominacionFiltered('Bebidas', 0, 10, false);
      expect(result.total).toBe(1);
      expect(result.data.length).toBe(1);
    });
  });

  describe('findByIdConAuditoria', () => {
    it('debería retornar los datos de auditoría si existen', async () => {
      const auditData = { id: 1, detalle: 'SuperLínea Bebidas' };
      mockRepository.findByIdConAuditoria.mockResolvedValue(auditData);

      const result = await service.findByIdConAuditoria(1);
      expect(result).toEqual(auditData);
    });

    it('debería lanzar NotFoundException si no se encuentra la auditoría', async () => {
      mockRepository.findByIdConAuditoria.mockResolvedValue(null);
      await expect(service.findByIdConAuditoria(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debería lanzar ConflictException si la súper línea tiene líneas asociadas', async () => {
      const existingEntity = { id: 1, denominacion: 'Bebidas', sistema: 0 };
      mockRepository.findOne.mockResolvedValue(existingEntity);
      mockUsuarioService.findOne.mockResolvedValue({ id: 1, denominacion: 'Admin' });
      mockValidacionesService.tieneLineasActivasParaSuperLinea.mockResolvedValue(true);

      await expect(service.remove(1, 1)).rejects.toThrow(ConflictException);
    });

    it('debería eliminar la súper línea si no tiene líneas asociadas', async () => {
      const existingEntity = { id: 1, denominacion: 'Bebidas', sistema: 0 };
      mockRepository.findOne.mockResolvedValue(existingEntity);
      mockUsuarioService.findOne.mockResolvedValue({ id: 1, denominacion: 'Admin' });
      mockValidacionesService.tieneLineasActivasParaSuperLinea.mockResolvedValue(false);
      mockRepository.remove.mockResolvedValue(existingEntity);

      const result = await service.remove(1, 1);
      expect(result.mensaje).toContain('eliminada');
    });
  });
});
