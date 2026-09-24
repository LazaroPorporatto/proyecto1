import * as mysql from 'mysql2/promise';
import { hashSync } from 'bcrypt';
import * as request from 'supertest';

export const BASE_URL = 'http://localhost:3000';

export type Pool = mysql.Pool;

const OPCIONES = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3310),
  user: process.env.DB_USERNAME ?? 'admin',
  password: process.env.DB_PASSWORD ?? 'admin',
  database: process.env.DB_DATABASE ?? 'proyecto',
  connectionLimit: 5,
};

export function crearPool(): Pool {
  return mysql.createPool(OPCIONES);
}

export async function crearUsuarioAdministrador(
  pool: Pool,
  sufijo: string,
): Promise<{ usuarioId: number; mail: string; contrasena: string }> {
  const mail = `e2e.admin.${sufijo}@test.com`;
  const contrasena = 'e2e-secret-1234';
  const [resultado] = await pool.execute(
    'INSERT INTO usuario (mail, contrasena, denominacion) VALUES (?, ?, ?)',
    [mail, hashSync(contrasena, 10), `E2E Admin ${sufijo}`],
  );
  const usuarioId = (resultado as mysql.ResultSetHeader).insertId;

  const [rolFilas] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT id FROM rol WHERE denominacion = 'Administrador' AND deletedAt IS NULL LIMIT 1",
  );
  if (!rolFilas[0]) {
    throw new Error('No existe el rol Administrador en la base de datos.');
  }
  await pool.execute('INSERT INTO usuarioRol (usuarioId, rolId) VALUES (?, ?)', [
    usuarioId,
    rolFilas[0].id,
  ]);

  return { usuarioId, mail, contrasena };
}

export async function insertarProducto(
  pool: Pool,
  datos: {
    denominacion?: string;
    costo: number;
    precio: number;
    porcentaje?: number;
    alicuotaIva?: number;
    stock: number;
    stockMinimo: number;
    utilizaStockMinimo?: boolean;
  },
): Promise<{ productoId: number; denominacion: string }> {
  const denominacion = datos.denominacion ?? `E2E ${Date.now()}`;
  const [resultado] = await pool.execute(
    `INSERT INTO producto
       (denominacion, alicuotaIva, stock, utilizaStockMinimo, stockMinimo, costo, precio, porcentaje)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      denominacion,
      datos.alicuotaIva ?? 21,
      datos.stock,
      datos.utilizaStockMinimo ?? true,
      datos.stockMinimo,
      datos.costo,
      datos.precio,
      datos.porcentaje ?? 0,
    ],
  );
  return { productoId: (resultado as mysql.ResultSetHeader).insertId, denominacion };
}

export async function login(
  mail: string,
  contrasena: string,
  empresaId = 1,
): Promise<string> {
  const respuesta = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ mail, contrasena, empresaId })
    .expect(201);
  return respuesta.body.accessToken as string;
}

export async function borrarProductos(pool: Pool, ids: number[]): Promise<void> {
  for (const id of ids) {
    await pool.execute('DELETE FROM producto WHERE id = ?', [id]);
  }
}

export async function limpiarUsuario(pool: Pool, usuarioId: number): Promise<void> {
  await pool.execute('DELETE FROM usuarioRol WHERE usuarioId = ?', [usuarioId]);
  await pool.execute('DELETE FROM usuario WHERE id = ?', [usuarioId]);
}