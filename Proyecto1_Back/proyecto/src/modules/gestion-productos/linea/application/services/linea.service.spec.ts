import { Test, TestingModule } from '@nestjs/testing';
import { LineaService } from './linea.service';
import { PoliticaEliminacionLinea } from '../../domain/services/politica-eliminacion-linea.service';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { SuperLineaService } from '../../../superlinea/application/services/super-linea.service';

describe('LineaService', () => {
  let service: LineaService;

  const mockLineaRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    findByIdConAuditoria: jest.fn(),
    remove: jest.fn(),
  };

  const mockPoliticaEliminacionLinea = {
    validarEliminacion: jest.fn(),
  };

  const mockUsuarioService = {
    findOne: jest.fn(),
  };

  const mockSuperLineaService = {
    findEntityById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineaService,
        { provide: 'ILineaRepository', useValue: mockLineaRepository },
        { provide: PoliticaEliminacionLinea, useValue: mockPoliticaEliminacionLinea },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: SuperLineaService, useValue: mockSuperLineaService },
      ],
    }).compile();

    service = module.get<LineaService>(LineaService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });
});
