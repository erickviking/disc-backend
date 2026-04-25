import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

const jwtSecret = isProduction
  ? requiredEnv('JWT_SECRET')
  : process.env.JWT_SECRET || 'dev-only-change-me';

if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres em producao');
}

if (isProduction) {
  requiredEnv('DATABASE_URL');
}

export const config = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',
  isProduction,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Vanessa Rocha <onboarding@resend.dev>',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
};
