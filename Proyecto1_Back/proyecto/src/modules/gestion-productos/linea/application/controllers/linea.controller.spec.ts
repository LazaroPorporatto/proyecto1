import { Test, TestingModule } from '@nestjs/testing';
import { LineaController } from './linea.controller';
import { LineaService } from '../services/linea.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

describe('LineaController', () => {
  let controller: LineaController;

  const mockLineaService = {
    create: jest.fn(),
    findBy: jest.fn(),
    findDtoById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByIdConAuditoria: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LineaController],
      providers: [
        {
          provide: LineaService,
          useValue: mockLineaService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LineaController>(LineaController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });
});
