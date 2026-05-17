// CommonJS config for TypeORM CLI migrations
const { DataSource } = require('typeorm');
require('dotenv/config');

const migrationConfig = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/src/migrations/*.js'],
  synchronize: false,
});

module.exports = migrationConfig;
