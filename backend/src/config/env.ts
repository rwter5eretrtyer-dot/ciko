import 'dotenv/config';
import path from 'node:path';

// Все настройки приложения получаем из переменных окружения, а не из кода.
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'postgres://ciko:ciko_local_only@localhost:5432/ciko',
  accessSecret: process.env.ACCESS_TOKEN_SECRET || '',
  refreshSecret: process.env.REFRESH_TOKEN_SECRET || '',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:8080,http://localhost:5173').split(',').map(s => s.trim()),
  secureCookie: process.env.COOKIE_SECURE === 'true',
  seedDemo: process.env.SEED_DEMO === 'true',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:8080'
};
export function assertSecrets(): void {
  if (env.accessSecret.length < 32 || env.refreshSecret.length < 32 || env.accessSecret === env.refreshSecret) {
    throw new Error('ACCESS_TOKEN_SECRET и REFRESH_TOKEN_SECRET должны быть разными и не короче 32 символов');
  }
}
