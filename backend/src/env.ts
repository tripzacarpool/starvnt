import dotenv from 'dotenv';

dotenv.config();

const clientOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'mongodb://127.0.0.1:27017/starvnt',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-starvnt-secret',
  clientOrigins,
};
