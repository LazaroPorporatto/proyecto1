import { Test, TestingModule } from '@nestjs/testing';
import { MarcaService } from './marca.service';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { ConflictException } from '@nestjs/common';
import { PoliticaEliminacionMarca } from '../../domain/services/politica-eliminacion-marca.service';

describe('MarcaService (Unitaria)', () => {
  let service: MarcaService;

  const mockMarcaRepository = {
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

  const mockPoliticaEliminacionMarca = {
    tieneProductosActivosParaMarca: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcaService,
        { provide: 'IMarcaRepository', useValue: mockMarcaRepository },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: PoliticaEliminacionMarca, useValue: mockPoliticaEliminacionMarca },
      ],
    }).compile();

    service = module.get<MarcaService>(MarcaService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear una Marca correctamente', async () => {
      mockMarcaRepository.findByDenominacionWith.mockResolvedValue(null);
      mockMarcaRepository.create.mockResolvedValue({ id: 1, denominacion: 'Nike' });

      const dto = { denominacion: 'Nike', usuarioCreatedId: 1 };
      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.mensaje).toContain('creada');
    });

    it('debería lanzar conflicto si la denominación ya existe', async () => {
      mockMarcaRepository.findByDenominacionWith.mockResolvedValue({ id: 2, denominacion: 'Nike' });

      const dto = { denominacion: 'Nike', usuarioCreatedId: 1 };
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
