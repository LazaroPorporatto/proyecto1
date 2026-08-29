import {config} from 'dotenv';
import { DataSource } from 'typeorm';


config({
  path: `.env`,
  override: true,
});

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3310', 10),
  username: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_DATABASE || 'proyecto',

  entities: [__dirname + '/src/**/*.entity.ts'],
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],

  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: true,
});