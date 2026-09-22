import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '../src/modules/gestion-usuario/auth/auth.guard';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';

describe('Módulo SuperLíneas y Asociación con Líneas - CR-003 (e2e)', () => {
  let app: INestApplication;
  let createdSuperLineaId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('1. Pruebas para SuperLíneas (CR-003)', () => {
    it('Creación exitosa: Debería crear una nueva SuperLínea válida con código HTTP 201', async () => {
      const timestamp = Date.now();
      const payload = {
        denominacion: `SuperLinea Test ${timestamp}`,
        observacion: 'Observación de prueba e2e para SuperLínea',
        utilizaStockMinimo: false,
        stockMinimo: 0,
        usuarioCreatedId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/api/superlinea')
        .send(payload)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.mensaje).toBeDefined();

      // Se consulta la SuperLínea recién creada para recuperar su ID asignado en la BD
      const searchResponse = await request(app.getHttpServer())
        .get('/api/superlinea/search-by')
        .query({ denominacion: `SuperLinea Test ${timestamp}` })
        .expect(200);

      expect(searchResponse.body.data).toBeDefined();
      expect(searchResponse.body.data.length).toBeGreaterThan(0);
      createdSuperLineaId = searchResponse.body.data[0].id;
      expect(createdSuperLineaId).toBeDefined();
    });

    it('Validación de errores: Debería rechazar una SuperLínea con denominación vacía con código HTTP 400', async () => {
      const payloadInvalido = {
        denominacion: '', // Denominación vacía
        observacion: 'Prueba inválida',
        usuarioCreatedId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/api/superlinea')
        .send(payloadInvalido)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('2. Pruebas para la Asociación de Líneas (CR-003)', () => {
    let createdLineaId: number;

    it('Asociación exitosa: Debería crear una Línea asociada a una SuperLínea existente con código HTTP 201', async () => {
      const timestamp = Date.now();
      const payloadLinea = {
        denominacion: `Linea Test ${timestamp}`,
        superLineaId: createdSuperLineaId,
        utilizaStockMinimo: false,
        stockMinimo: 0,
        observacion: 'Asociación correcta a SuperLínea',
        usuarioCreatedId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/api/linea')
        .send(payloadLinea)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.mensaje).toBeDefined();

      // Recuperar el ID de la línea creada
      const searchResponse = await request(app.getHttpServer())
        .get('/api/linea/search-by')
        .query({ denominacion: `Linea Test ${timestamp}` })
        .expect(200);

      expect(searchResponse.body.data).toBeDefined();
      expect(searchResponse.body.data.length).toBeGreaterThan(0);
      createdLineaId = searchResponse.body.data[0].id;
      expect(createdLineaId).toBeDefined();
    });

    it('Rechazo por integridad referencial: Debería rechazar la creación de una Línea con un superLineaId inexistente', async () => {
      const timestamp = Date.now();
      const payloadInexistente = {
        denominacion: `Linea Invalida ${timestamp}`,
        superLineaId: 999999, // ID de SuperLínea que no existe en la BD
        utilizaStockMinimo: false,
        stockMinimo: 0,
        usuarioCreatedId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/api/linea')
        .send(payloadInexistente);

      // Espera 404 (NotFoundException) o 400 por validación de entidad referenciada
      expect([400, 404]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('Cadena Completa: Debería crear un Producto vinculado a la Línea recién creada que pertenece a la SuperLínea', async () => {
      const timestamp = Date.now();
      const payloadProducto = {
        denominacion: `Producto Cadena Test ${timestamp}`,
        observacion: 'Producto creado en la cadena SuperLínea -> Línea -> Producto',
        utilizaStockMinimo: false,
        stockMinimo: 0,
        unidadPresentacion: 'UNIDAD',
        lineaId: createdLineaId,
        marcaId: 1, // ID de marca por defecto o de sistema
        precio: 1500,
        alicuotaIva: 'ALICUOTA_21',
        usuarioCreatedId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/api/producto')
        .send(payloadProducto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.mensaje).toBeDefined();
    });
  });
});
