import { Test, TestingModule } from '@nestjs/testing';
import { SuperLineaController } from './super-linea.controller';
import { SuperLineaService } from '../services/super-linea.service';
import { CreateSuperLineaDto } from '../../dto/create-super-linea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-super-linea.dto';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

describe('SuperLineaController (Unitaria)', () => {
  let controller: SuperLineaController;
  let service: SuperLineaService;

  const mockSuperLineaService = {
    create: jest.fn(),
    findByDenominacionFiltered: jest.fn(),
    findDtoById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByIdConAuditoria: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuperLineaController],
      providers: [
        {
          provide: SuperLineaService,
          useValue: mockSuperLineaService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SuperLineaController>(SuperLineaController);
    service = module.get<SuperLineaService>(SuperLineaService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería llamar a service.create y retornar el resultado', async () => {
      const dto: CreateSuperLineaDto = {
        denominacion: 'Lácteos',
        observacion: 'Prueba',
        utilizaStockMinimo: false,
        stockMinimo: 0,
        usuarioCreatedId: 1,
        deletedAt: null,
      };

      const expectedResponse = { mensaje: 'SuperLínea Lácteos creada' };
      mockSuperLineaService.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findByDenominacionFiltered', () => {
    it('debería retornar el listado paginado', async () => {
      const paginationDto = { denominacion: 'Lácteos', skip: 0, take: 10 };
      const expectedResult = { data: [], total: 0 };
      mockSuperLineaService.findByDenominacionFiltered.mockResolvedValue(expectedResult);

      const result = await controller.findByDenominacionFiltered(paginationDto);
      expect(service.findByDenominacionFiltered).toHaveBeenCalledWith('Lácteos', 0, 10, undefined);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('debería buscar una SuperLínea por id', async () => {
      const expectedResult = { id: 1, denominacion: 'Lácteos' };
      mockSuperLineaService.findDtoById.mockResolvedValue(expectedResult);

      const result = await controller.findOne(1);
      expect(service.findDtoById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('debería actualizar una SuperLínea', async () => {
      const dto: UpdateSuperLineaDto = {
        denominacion: 'Lácteos Editado',
        usuarioUpdatedId: 1,
        updatedAt: new Date(),
      };
      const expectedResponse = { mensaje: 'SuperLínea Lácteos Editado editada' };
      mockSuperLineaService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(1, dto);
      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('remove', () => {
    it('debería eliminar una SuperLínea', async () => {
      const expectedResponse = { mensaje: 'SuperLínea eliminada' };
      mockSuperLineaService.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(1, 1);
      expect(service.remove).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findByIdConAuditoria', () => {
    it('debería retornar datos de auditoría', async () => {
      const auditResult = { id: 1, detalle: 'SuperLínea Lácteos' };
      mockSuperLineaService.findByIdConAuditoria.mockResolvedValue(auditResult);

      const result = await controller.findByIdConAuditoria(1);
      expect(service.findByIdConAuditoria).toHaveBeenCalledWith(1);
      expect(result).toEqual(auditResult);
    });
  });
});
