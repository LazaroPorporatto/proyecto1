import { Test, TestingModule } from '@nestjs/testing';
import { ProductoController } from './producto.controller';
import { ProductoService } from '../services/producto.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

describe('ProductoController', () => {
  let controller: ProductoController;

  const mockProductoService = {
    create: jest.fn(),
    findBy: jest.fn(),
    findDtoById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByIdConAuditoria: jest.fn(),
    sugerirDenominacion: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductoController],
      providers: [
        {
          provide: ProductoService,
          useValue: mockProductoService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductoController>(ProductoController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });
});
