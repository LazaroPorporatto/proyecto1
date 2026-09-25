import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '../src/modules/gestion-usuario/auth/auth.guard';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';
import { ProductoRelatedEntitiesValidator } from '../src/modules/gestion-productos/producto/infraestructure/validators/producto-related-entities.validator.ts';
import { ProductoUniquenessValidator } from '../src/modules/gestion-productos/producto/infraestructure/validators/producto-uniqueness.validator.ts';
import { ProductoValidationService } from '../src/modules/gestion-productos/producto/domain/services/producto-validation.service.ts';
import { UsuarioValidator } from '../src/modules/common/utils/validation/usuario-validator';

describe('CR-002 - POST /api/producto (e2e)', () => {
  let app: INestApplication;

  // Payload base válido, reutilizado y mutado en cada test.
  const payloadValido = () => ({
    denominacion: 'coca cola gaseosas 1.5l',
    utilizaStockMinimo: false,
    unidadPresentacion: 'L',
    cantidadPresentacion: 1.5,
    lineaId: 1,
    marcaId: 1,
    alicuotaIva: 21,
    usuarioCreatedId: 1,
    precio: 8500,
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // No autenticamos de verdad: el guard siempre deja pasar.
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      // Se mockea todo lo que toca la base de datos, para no persistir nada real.
      .overrideProvider('IProductoRepository')
      .useValue({
        create: jest.fn().mockResolvedValue({
          id: 999,
          denominacion: 'coca cola gaseosas 1.5l',
        }),
      })
      .overrideProvider(ProductoRelatedEntitiesValidator)
      .useValue({
        validarYObtenerEntidadesRelacionadas: jest.fn().mockResolvedValue({
          marca: { id: 1, denominacion: 'Coca-Cola' },
          linea: { id: 1, denominacion: 'Gaseosas' },
        }),
      })
      .overrideProvider(ProductoValidationService)
      .useValue({
        validarEntidadesRelacionadas: jest.fn(),
      })
      .overrideProvider(ProductoUniquenessValidator)
      .useValue({
        validarDenominacionUnica: jest.fn().mockResolvedValue(undefined),
        validarCodigoProveedorUnico: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(UsuarioValidator)
      .useValue({
        validarUsuarioExiste: jest.fn().mockResolvedValue({ id: 1 }),
      })
      .compile();

    app = moduleFixture.createNestApplication();

    // Misma configuración que main.ts, para que el comportamiento sea idéntico al real.
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

  describe('Presentación válida', () => {
    it('CP-CR002-01: acepta un producto con presentación válida (unidad LITRO, cantidad decimal)', () => {
      return request(app.getHttpServer())
        .post('/api/producto')
        .send(payloadValido())
        .expect(201);
    });

    it('CP-CR002-08 (regresión): acepta unidadPresentacion="L", el bug del @Transform no debe reaparecer', () => {
      const payload = { ...payloadValido(), unidadPresentacion: 'L' };

      return request(app.getHttpServer())
        .post('/api/producto')
        .send(payload)
        .expect(201);
    });

    it('acepta un producto con presentación PACK y cantidad entera', () => {
      const payload = {
        ...payloadValido(),
        unidadPresentacion: 'PACK',
        cantidadPresentacion: 6,
      };

      return request(app.getHttpServer())
        .post('/api/producto')
        .send(payload)
        .expect(201);
    });
  });

  describe('Presentación inválida', () => {
    it('CP-CR002-04: rechaza cantidadPresentacion = 0 (regla de negocio del domain service)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/producto')
        .send({ ...payloadValido(), cantidadPresentacion: 0 })
        .expect(400);

      // El detalle exacto del mensaje ya se verifica en el test unitario de Jest
      // (producto-intrinsic-validation.service.spec.ts). Acá solo confirmamos
      // que el flujo HTTP completo rechaza la solicitud.
      expect(response.body.statusCode).toBe(400);
    });

    it('CP-CR002-05: rechaza cantidadPresentacion negativa', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/producto')
        .send({ ...payloadValido(), cantidadPresentacion: -3 })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('CP-CR002-07: rechaza unidadPresentacion fuera del catálogo cerrado (validación de DTO, antes de llegar al service)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/producto')
        .send({ ...payloadValido(), unidadPresentacion: 'TONELADA' })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('rechaza si falta unidadPresentacion (campo obligatorio)', async () => {
      const { unidadPresentacion, ...payloadSinUnidad } = payloadValido();

      await request(app.getHttpServer())
        .post('/api/producto')
        .send(payloadSinUnidad)
        .expect(400);
    });
  });

  describe('Regresión de reglas previas a CR-002', () => {
    it('sigue rechazando una denominación vacía', async () => {
      await request(app.getHttpServer())
        .post('/api/producto')
        .send({ ...payloadValido(), denominacion: '' })
        .expect(400);
    });

    it('rechaza propiedades no declaradas en el DTO (whitelist activo)', async () => {
      await request(app.getHttpServer())
        .post('/api/producto')
        .send({ ...payloadValido(), campoInventado: 'no debería existir' })
        .expect(400);
    });
  });
});