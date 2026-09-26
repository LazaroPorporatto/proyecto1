import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/modules/common/filters/global-exception.filters';

/**
 * CR-007 - Historial de precios (E2E)
 *
 * Requiere el entorno real levantado: MySQL con la migracion aplicada
 * (tabla `historial_precio`) y las variables de entorno del backend.
 *
 * La aplicacion de prueba replica la configuracion de `src/main.ts`
 * (prefijo global, ValidationPipe y filtro de excepciones) porque
 * NestApplicationFactory no ejecuta ese bootstrap.
 */
describe('CR-007 Historial de precios (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let usuarioId: number;

  const MAIL = `e2e-cr007-${Date.now()}@test.com`;
  const CONTRASENA = 'E2ePassword123';
  const ROL_ADMINISTRADOR = 1;
  const EMPRESA_ID = 1;
  const PRODUCTO_ID = 1;
  const PRODUCTO_INEXISTENTE = 999999;

  const auth = () => ({ Authorization: `Bearer ${accessToken}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    const registro = await request(app.getHttpServer())
      .post('/api/auth/registrar')
      .send({
        mail: MAIL,
        contrasena: CONTRASENA,
        rolId: ROL_ADMINISTRADOR,
        denominacion: 'Usuario E2E CR-007',
      })
      .expect(201);

    expect(registro.body).toBeTruthy();

    // El alta de usuario no persiste la relacion con el rol, por lo que se
    // asigna explicitamente para poder ejercitar el AuthGuard y los @Roles.
    const dataSource = app.get(DataSource);
    const usuarios: any[] = await dataSource.query(
      'SELECT id FROM usuario WHERE mail = ?',
      [MAIL],
    );
    usuarioId = usuarios[0].id;
    await dataSource.query(
      'INSERT IGNORE INTO usuarioRol (usuarioId, rolId) VALUES (?, ?)',
      [usuarioId, ROL_ADMINISTRADOR],
    );

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ mail: MAIL, contrasena: CONTRASENA, empresaId: EMPRESA_ID })
      .expect(201);

    accessToken = login.body.accessToken;
    expect(accessToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/producto/:id/historial-precios', () => {
    it('rechaza la consulta sin token (401)', async () => {
      await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}/historial-precios`)
        .expect(401);
    });

    it('devuelve el historial paginado y ordenado de un producto existente', async () => {
      const respuesta = await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}/historial-precios?skip=0&take=10`)
        .set(auth())
        .expect(200);

      expect(respuesta.body).toHaveProperty('data');
      expect(respuesta.body).toHaveProperty('total');
      expect(Array.isArray(respuesta.body.data)).toBe(true);

      const fechas = respuesta.body.data.map((registro: any) =>
        new Date(registro.fecha).getTime(),
      );
      const ordenDescendente = [...fechas].sort((a: number, b: number) => b - a);
      expect(fechas).toEqual(ordenDescendente);
    });

    it('devuelve 404 para un producto inexistente', async () => {
      await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_INEXISTENTE}/historial-precios`)
        .set(auth())
        .expect(404);
    });
  });

  describe('PUT /api/producto/:id (cambio de precio con motivo)', () => {
    const payloadValido = (precio: number, motivo?: string) => ({
      denominacion: 'ACEITE',
      marcaId: 2,
      lineaId: 1,
      alicuotaIva: 21,
      utilizaStockMinimo: false,
      utilizaPack: false,
      precio,
      usuarioUpdatedId: usuarioId,
      ...(motivo !== undefined ? { motivoPrecio: motivo } : {}),
    });

    it('registra el cambio de precio y crea el historial con los cuatro datos', async () => {
      const antes = await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}/historial-precios?skip=0&take=1`)
        .set(auth())
        .expect(200);

      const totalAntes = antes.body.total;
      const precioAnterior = antes.body.data[0]?.precioNuevo ?? 1200;
      const precioNuevo = precioAnterior + 150;

      await request(app.getHttpServer())
        .put(`/api/producto/${PRODUCTO_ID}`)
        .set(auth())
        .send(payloadValido(precioNuevo, 'Actualizacion de costo E2E'))
        .expect(200);

      const despues = await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}/historial-precios?skip=0&take=1`)
        .set(auth())
        .expect(200);

      expect(despues.body.total).toBe(totalAntes + 1);

      const registro = despues.body.data[0];
      expect(Number(registro.precioAnterior)).toBe(Number(precioAnterior));
      expect(Number(registro.precioNuevo)).toBe(Number(precioNuevo));
      expect(registro.motivo).toBe('Actualizacion de costo E2E');
      expect(registro.fecha).toBeTruthy();
    });

    it('rechaza un precio no positivo (400) y no crea historial', async () => {
      const antes = await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}/historial-precios?skip=0&take=1`)
        .set(auth())
        .expect(200);

      await request(app.getHttpServer())
        .put(`/api/producto/${PRODUCTO_ID}`)
        .set(auth())
        .send(payloadValido(0, 'Precio invalido E2E'))
        .expect(400);

      const despues = await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}/historial-precios?skip=0&take=1`)
        .set(auth())
        .expect(200);

      expect(despues.body.total).toBe(antes.body.total);
    });

    it('rechaza un cambio de precio sin motivo (400) y no crea historial', async () => {
      const antes = await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}/historial-precios?skip=0&take=1`)
        .set(auth())
        .expect(200);

      await request(app.getHttpServer())
        .put(`/api/producto/${PRODUCTO_ID}`)
        .set(auth())
        .send(payloadValido(9999))
        .expect(400);

      await request(app.getHttpServer())
        .put(`/api/producto/${PRODUCTO_ID}`)
        .set(auth())
        .send(payloadValido(9999, '   '))
        .expect(400);

      const despues = await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}/historial-precios?skip=0&take=1`)
        .set(auth())
        .expect(200);

      expect(despues.body.total).toBe(antes.body.total);
    });

    it('no crea historial redundante cuando el precio no cambia', async () => {
      const actual = await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}`)
        .set(auth())
        .expect(200);

      const antes = await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}/historial-precios?skip=0&take=1`)
        .set(auth())
        .expect(200);

      await request(app.getHttpServer())
        .put(`/api/producto/${PRODUCTO_ID}`)
        .set(auth())
        .send(payloadValido(Number(actual.body.precio), 'Sin cambio real E2E'))
        .expect(200);

      const despues = await request(app.getHttpServer())
        .get(`/api/producto/${PRODUCTO_ID}/historial-precios?skip=0&take=1`)
        .set(auth())
        .expect(200);

      expect(despues.body.total).toBe(antes.body.total);
    });
  });
});
