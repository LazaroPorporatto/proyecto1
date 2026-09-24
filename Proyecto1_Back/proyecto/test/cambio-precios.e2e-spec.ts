import * as request from 'supertest';
import * as mysql from 'mysql2/promise';
import {
  BASE_URL,
  crearPool,
  crearUsuarioAdministrador,
  insertarProducto,
  login,
  borrarProductos,
  limpiarUsuario,
  Pool,
} from './helpers/e2e-cliente';

describe('P1-69 / P1-73 - Cambio masivo de precios (e2e contra backend real)', () => {
  let pool: Pool;
  const sufijo = `${Date.now()}`;
  let autenticacion: { usuarioId: number; mail: string; contrasena: string };
  let token: string;
  let productoId: number;

  beforeAll(async () => {
    pool = crearPool();
    autenticacion = await crearUsuarioAdministrador(pool, sufijo);
    token = await login(autenticacion.mail, autenticacion.contrasena);

    const creado = await insertarProducto(pool, {
      denominacion: `E2E CAMBIO PRECIOS ${sufijo}`,
      precio: 100,
      costo: 80,
      porcentaje: 25,
      alicuotaIva: 21,
      stock: 10,
      stockMinimo: 2,
      utilizaStockMinimo: true,
    });
    productoId = creado.productoId;
  });

  afterAll(async () => {
    await borrarProductos(pool, [productoId]);
    await limpiarUsuario(pool, autenticacion.usuarioId);
    await pool.end();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('exige un token valido (401 sin autorizacion)', async () => {
    await request(BASE_URL)
      .get('/api/cambio-precios/search-productos-by')
      .query({ take: 10 })
      .expect(401);
  });

  it('busca los productos del ambito global (GET /cambio-precios/search-productos-by)', async () => {
    const respuesta = await request(BASE_URL)
      .get('/api/cambio-precios/search-productos-by')
      .query({ denominacion: `E2E CAMBIO PRECIOS ${sufijo}`, take: 10 })
      .set(auth())
      .expect(200);

    expect(respuesta.body.ambito).toBe('global');
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0]).toMatchObject({
      id: productoId,
      precio: 100,
      precioConIva: 121,
      costo: 80,
      porcentaje: 25,
    });
  });

  it('calcula el preview por porcentaje sin persistir (PATCH aplicar-cambios)', async () => {
    const respuesta = await request(BASE_URL)
      .patch('/api/cambio-precios/aplicar-cambios')
      .send({ tipo: 'porcentaje', valor: 10, items: [{ id: productoId }] })
      .set(auth())
      .expect(200);

    const item = respuesta.body[0];
    expect(item.nuevoPrecio).toBe(110);
    expect(item.nuevoPrecioConIva).toBe(133.1);
    // Precio = Costo + Margen, recalculado hacia atras
    expect(item.nuevoPorcentaje).toBe(37.5);
    expect(item.error).toBeNull();

    const [filas] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT precio FROM producto WHERE id = ?',
      [productoId],
    );
    expect(Number(filas[0].precio)).toBe(100);
  });

  it('calcula el preview por monto y no marca error si cae exacto al costo (PATCH aplicar-cambios)', async () => {
    const respuesta = await request(BASE_URL)
      .patch('/api/cambio-precios/aplicar-cambios')
      .send({ tipo: 'monto', valor: -20, items: [{ id: productoId }] })
      .set(auth())
      .expect(200);

    const item = respuesta.body[0];
    expect(item.nuevoPrecio).toBe(80);
    expect(item.nuevoPorcentaje).toBe(0);
    expect(item.error).toBeNull();
  });

  it('marca error cuando el descuento deja el precio por debajo del costo', async () => {
    const respuesta = await request(BASE_URL)
      .patch('/api/cambio-precios/aplicar-cambios')
      .send({ tipo: 'porcentaje', valor: -30, items: [{ id: productoId }] })
      .set(auth())
      .expect(200);

    const item = respuesta.body[0];
    expect(item.nuevoPrecio).toBe(70);
    expect(item.error).toContain('costo');
  });

  it('persiste con motivo y devuelve el historial (PATCH guardar-cambios)', async () => {
    const respuesta = await request(BASE_URL)
      .patch('/api/cambio-precios/guardar-cambios')
      .send({
        items: [{ id: productoId, nuevoPrecio: 110 }],
        motivo: `E2E aumento prueba ${sufijo}`,
        usuarioCreatedId: autenticacion.usuarioId,
      })
      .set(auth())
      .expect(200);

    expect(respuesta.body.mensaje).toContain('1 producto(s)');
    expect(respuesta.body.historial[0]).toMatchObject({
      productoId,
      precioAnterior: 100,
      precioNuevo: 110,
      motivo: `E2E aumento prueba ${sufijo}`,
      usuarioCreatedId: autenticacion.usuarioId,
    });
  });

  it('el precio queda persistido con el margen recalculado', async () => {
    const [filas] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT precio, porcentaje FROM producto WHERE id = ?',
      [productoId],
    );
    expect(Number(filas[0].precio)).toBeCloseTo(110, 5);
    expect(Number(filas[0].porcentaje)).toBeCloseTo(37.5, 2);
  });

  it('rechaza persistir un precio menor al costo (400)', async () => {
    const respuesta = await request(BASE_URL)
      .patch('/api/cambio-precios/guardar-cambios')
      .send({
        items: [{ id: productoId, nuevoPrecio: 70 }],
        motivo: `E2E descuento erroneo ${sufijo}`,
        usuarioCreatedId: autenticacion.usuarioId,
      })
      .set(auth())
      .expect(400);

    expect(respuesta.body.message).toContain('costo');
  });

  it('rechaza un tipo de ajuste invalido desde el pipe (400)', async () => {
    const respuesta = await request(BASE_URL)
      .patch('/api/cambio-precios/aplicar-cambios')
      .send({ tipo: 'otro', valor: 10, items: [{ id: productoId }] })
      .set(auth())
      .expect(400);

    // El filtro global normaliza el mensaje de validacion de class-validator
    expect(respuesta.body.message).toBeDefined();
  });
});