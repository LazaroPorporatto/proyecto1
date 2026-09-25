import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '../src/modules/gestion-usuario/auth/auth.guard';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { MarcaService } from '../src/modules/gestion-productos/marca/application/services/marca.service';
import { LineaService } from '../src/modules/gestion-productos/linea/application/services/linea.service';

describe('CR-005 - GET /api/producto/sugerir-denominacion (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      // Se mockean los servicios de Marca y Línea para no depender de datos reales en la base.
      .overrideProvider(MarcaService)
      .useValue({
        findEntityById: jest.fn().mockResolvedValue({
          id: 1,
          denominacion: 'Coca-Cola',
        }),
      })
      .overrideProvider(LineaService)
      .useValue({
        findEntityById: jest.fn().mockResolvedValue({
          id: 1,
          denominacion: 'Gaseosas',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('CP-CR005: genera la denominación combinando Marca + Línea + Presentación', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/producto/sugerir-denominacion')
      .query({
        marcaId: 1,
        lineaId: 1,
        unidadPresentacion: 'L',
        cantidadPresentacion: 1.5,
      })
      .expect(200);

    expect(response.body.denominacion).toBe('Coca-Cola Gaseosas 1.5L');
  });

  it('omite el sufijo de presentación cuando es UNIDAD x 1', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/producto/sugerir-denominacion')
      .query({
        marcaId: 1,
        lineaId: 1,
        unidadPresentacion: 'UNIDAD',
        cantidadPresentacion: 1,
      })
      .expect(200);

    expect(response.body.denominacion).toBe('Coca-Cola Gaseosas');
  });

  it('rechaza la solicitud si falta un parámetro obligatorio (marcaId)', async () => {
    await request(app.getHttpServer())
      .get('/api/producto/sugerir-denominacion')
      .query({
        lineaId: 1,
        unidadPresentacion: 'UNIDAD',
        cantidadPresentacion: 1,
      })
      .expect(400);
  });

  it('rechaza cantidadPresentacion negativa (IsPositive del DTO)', async () => {
    await request(app.getHttpServer())
      .get('/api/producto/sugerir-denominacion')
      .query({
        marcaId: 1,
        lineaId: 1,
        unidadPresentacion: 'UNIDAD',
        cantidadPresentacion: -1,
      })
      .expect(400);
  });

  it('rechaza unidadPresentacion fuera del catálogo cerrado', async () => {
    await request(app.getHttpServer())
      .get('/api/producto/sugerir-denominacion')
      .query({
        marcaId: 1,
        lineaId: 1,
        unidadPresentacion: 'TONELADA',
        cantidadPresentacion: 1,
      })
      .expect(400);
  });
});