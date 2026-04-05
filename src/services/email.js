import { Resend } from 'resend';
import { config } from '../config/index.js';

let resend = null;

function getResend() {
  if (!resend && config.resendApiKey) {
    resend = new Resend(config.resendApiKey);
  }
  return resend;
}

export async function sendReportReadyEmail(to, userName, appUrl) {
  const r = getResend();
  if (!r) {
    console.log('Resend nao configurado, pulando email para:', to);
    return null;
  }

  try {
    const result = await r.emails.send({
      from: config.emailFrom,
      to: [to],
      subject: 'Seu relatorio comportamental esta pronto!',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-block;background:#4c6ef5;color:white;font-size:14px;font-weight:700;padding:8px 12px;border-radius:8px;margin-bottom:12px;">VR</div>
            <h2 style="color:#111827;font-size:20px;margin:0;">Vanessa Rocha</h2>
            <p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Analise Comportamental</p>
          </div>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;">
            <h1 style="color:#111827;font-size:22px;margin:0 0 12px 0;">Ola, ${userName.split(' ')[0]}!</h1>
            <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
              Seu relatorio de analise comportamental foi gerado e esta pronto para visualizacao.
            </p>
            <a href="${appUrl}/dashboard" style="display:inline-block;background:#4c6ef5;color:white;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
              Ver Meu Relatorio
            </a>
          </div>

          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">
            Vanessa Rocha - Analise Comportamental
          </p>
        </div>
      `,
    });

    console.log('Email enviado para:', to, result);
    return result;
  } catch (err) {
    console.error('Erro ao enviar email:', err.message);
    return null;
  }
}
