import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-starvnt-secret',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
};
