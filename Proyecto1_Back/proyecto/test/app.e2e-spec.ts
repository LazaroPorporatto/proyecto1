import * as request from 'supertest';
import { BASE_URL } from './helpers/e2e-cliente';

describe('AppController (e2e contra backend real)', () => {
  it('GET /api -> 200 (Swagger UI del backend vivo)', async () => {
    const respuesta = await request(BASE_URL).get('/api').expect(200);
    expect(respuesta.text).toContain('swagger-ui');
  });
});