import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '../src/modules/gestion-usuario/auth/auth.guard';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';

describe('CR-004: Búsqueda Avanzada de Productos por Denominación con Prefijo (e2e)', () => {
  let app: INestApplication;
  let superLineaId: number;
  let lineaId: number;
  let marcaId: number;
  const uniquePrefix = `PREFIX${Date.now()}`;

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

    const timestamp = Date.now();

    // 1. Crear SuperLínea de prueba
    await request(app.getHttpServer())
      .post('/api/superlinea')
      .send({
        denominacion: `SL Prefijo ${timestamp}`,
        usuarioCreatedId: 1,
      });

    const slRes = await request(app.getHttpServer())
      .get('/api/superlinea/search-by')
      .query({ denominacion: `SL Prefijo ${timestamp}` });
    superLineaId = slRes.body.data[0]?.id ?? 1;

    // 2. Crear Línea de prueba
    await request(app.getHttpServer())
      .post('/api/linea')
      .send({
        denominacion: `Linea Prefijo ${timestamp}`,
        superLineaId,
        utilizaStockMinimo: false,
        usuarioCreatedId: 1,
      });

    const lRes = await request(app.getHttpServer())
      .get('/api/linea/search-by')
      .query({ denominacion: `Linea Prefijo ${timestamp}` });
    lineaId = lRes.body.data[0]?.id ?? 1;

    // 3. Crear Marca de prueba
    await request(app.getHttpServer())
      .post('/api/marca')
      .send({
        denominacion: `Marca Prefijo ${timestamp}`,
        usuarioCreatedId: 1,
      });

    const mRes = await request(app.getHttpServer())
      .get('/api/marca/search-by')
      .query({ denominacion: `Marca Prefijo ${timestamp}` });
    marcaId = mRes.body.data[0]?.id ?? 1;

    // 4. Crear productos de prueba con el prefijo único y uno con un prefijo distinto
    await request(app.getHttpServer())
      .post('/api/producto')
      .send({
        denominacion: `${uniquePrefix} PRODUCTO A`,
        lineaId,
        marcaId,
        utilizaStockMinimo: false,
        unidadPresentacion: 'UNIDAD',
        alicuotaIva: 21,
        precio: 1500,
        usuarioCreatedId: 1,
      });

    await request(app.getHttpServer())
      .post('/api/producto')
      .send({
        denominacion: `${uniquePrefix} PRODUCTO B`,
        lineaId,
        marcaId,
        utilizaStockMinimo: false,
        unidadPresentacion: 'UNIDAD',
        alicuotaIva: 21,
        precio: 1600,
        usuarioCreatedId: 1,
      });

    await request(app.getHttpServer())
      .post('/api/producto')
      .send({
        denominacion: `OTRO ${uniquePrefix} PRODUCTO C`,
        lineaId,
        marcaId,
        utilizaStockMinimo: false,
        unidadPresentacion: 'UNIDAD',
        alicuotaIva: 21,
        precio: 1700,
        usuarioCreatedId: 1,
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Búsqueda por Prefijo de Denominación (CR-004)', () => {
    it('Debería retornar productos cuya denominación inicie estrictamente con el prefijo enviado (LIKE "PREFIX%")', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/producto/search-by')
        .query({ denominacion: uniquePrefix, skip: 0, take: 10 })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Verificación estricta: todos los elementos retornados deben comenzar con el prefijo buscado
      response.body.data.forEach((producto: any) => {
        expect(
          producto.denominacion
            .toUpperCase()
            .startsWith(uniquePrefix.toUpperCase()),
        ).toBe(true);
      });
    });

    it('Debería ser insensible a mayúsculas y minúsculas al buscar por prefijo', async () => {
      const lowerPrefix = uniquePrefix.toLowerCase();

      const response = await request(app.getHttpServer())
        .get('/api/producto/search-by')
        .query({ denominacion: lowerPrefix, skip: 0, take: 10 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      response.body.data.forEach((producto: any) => {
        expect(
          producto.denominacion
            .toUpperCase()
            .startsWith(uniquePrefix.toUpperCase()),
        ).toBe(true);
      });
    });

    it('Debería retornar una lista vacía y total 0 al buscar por un prefijo inexistente', async () => {
      const nonExistentPrefix = `INEXISTENTE_${Date.now()}_XYZ`;

      const response = await request(app.getHttpServer())
        .get('/api/producto/search-by')
        .query({ denominacion: nonExistentPrefix, skip: 0, take: 10 })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });
});
