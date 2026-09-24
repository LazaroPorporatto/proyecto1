import * as request from 'supertest';
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

describe('P1-74 - Stock bajo (estaBajoMinimo / enStockBajo) (e2e contra backend real)', () => {
  let pool: Pool;
  const sufijo = `${Date.now()}`;
  const prefijo = `E2E STOCK BAJO ${sufijo}`;
  let autenticacion: { usuarioId: number; mail: string; contrasena: string };
  let token: string;
  let productoBajoId: number;
  let productoOkId: number;

  beforeAll(async () => {
    pool = crearPool();
    autenticacion = await crearUsuarioAdministrador(pool, sufijo);
    token = await login(autenticacion.mail, autenticacion.contrasena);

    const bajo = await insertarProducto(pool, {
      denominacion: `${prefijo} BAJO`,
      precio: 100,
      costo: 80,
      porcentaje: 25,
      alicuotaIva: 21,
      stock: 0,
      stockMinimo: 2,
      utilizaStockMinimo: true,
    });
    const ok = await insertarProducto(pool, {
      denominacion: `${prefijo} OK`,
      precio: 100,
      costo: 80,
      porcentaje: 25,
      alicuotaIva: 21,
      stock: 50,
      stockMinimo: 2,
      utilizaStockMinimo: true,
    });
    productoBajoId = bajo.productoId;
    productoOkId = ok.productoId;
  });

  afterAll(async () => {
    await borrarProductos(pool, [productoBajoId, productoOkId]);
    await limpiarUsuario(pool, autenticacion.usuarioId);
    await pool.end();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('proyecta enStockBajo=true solo para el producto en alerta (GET /producto/search-by)', async () => {
    const respuesta = await request(BASE_URL)
      .get('/api/producto/search-by')
      .query({ denominacion: prefijo, take: 50 })
      .set(auth())
      .expect(200);

    const bajo = respuesta.body.data.find((p: any) => p.id === productoBajoId);
    const ok = respuesta.body.data.find((p: any) => p.id === productoOkId);

    expect(bajo).toBeDefined();
    expect(ok).toBeDefined();
    expect(bajo.enStockBajo).toBe(true);
    expect(ok.enStockBajo).toBe(false);
  });

  it('con soloStockBajo=true filtra por la regla (stock <= stockMinimo) (GET /producto/search-by)', async () => {
    const respuesta = await request(BASE_URL)
      .get('/api/producto/search-by')
      .query({ denominacion: prefijo, take: 50, soloStockBajo: 'true' })
      .set(auth())
      .expect(200);

    const ids = (respuesta.body.data as any[]).map((p) => p.id);
    expect(ids).toContain(productoBajoId);
    expect(ids).not.toContain(productoOkId);
    for (const p of respuesta.body.data as any[]) {
      expect(p.enStockBajo).toBe(true);
    }
  });

  it('el filtro reduce el conjunto total devuelto por la busqueda', async () => {
    const total = await request(BASE_URL)
      .get('/api/producto/search-by')
      .query({ denominacion: prefijo, take: 50 })
      .set(auth())
      .expect(200);

    const filtrado = await request(BASE_URL)
      .get('/api/producto/search-by')
      .query({ denominacion: prefijo, take: 50, soloStockBajo: 'true' })
      .set(auth())
      .expect(200);

    expect(filtrado.body.data.length).toBeLessThan(total.body.data.length);
    expect(filtrado.body.data.length).toBeGreaterThan(0);
  });
});