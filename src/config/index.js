import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

function optionalEnv(name) {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : null;
}

const jwtSecret = optionalEnv('JWT_SECRET') || 'temporary-production-secret-change-immediately';

if (isProduction && !optionalEnv('JWT_SECRET')) {
  console.warn('ALERTA: JWT_SECRET nao configurado. Configure uma variavel segura no ambiente de producao.');
}

if (isProduction && jwtSecret.length < 32) {
  console.warn('ALERTA: JWT_SECRET com menos de 32 caracteres. Use um segredo mais forte em producao.');
}

if (isProduction && !optionalEnv('DATABASE_URL')) {
  console.warn('ALERTA: DATABASE_URL nao configurado. A aplicacao pode falhar ao acessar o banco.');
}

export const config = {
  hotmartHottok: process.env.HOTMART_HOTTOK,
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
