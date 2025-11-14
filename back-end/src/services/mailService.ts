import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Asegurar que las variables de entorno estén cargadas antes de crear el transporter
dotenv.config();

export class MailService {
  private static getTransporter(overrides?: Partial<{ host: string; port: number; secure: boolean; requireTLS: boolean }>) {
    const user = process.env.SMTP_USERNAME;
    const pass = process.env.SMTP_PASSWORD;
    if (!user || !pass) {
      throw new Error('Credenciales SMTP no configuradas');
    }
    const host = overrides?.host ?? process.env.SMTP_HOST ?? 'smtp.gmail.com';
    const port = overrides?.port ?? Number(process.env.SMTP_PORT ?? 587);
    const secureFlag = (process.env.SMTP_SECURE ?? 'false').toLowerCase();
    const secure = overrides?.secure ?? (secureFlag === 'true' || secureFlag === '1');
    const requireTLSFlag = (process.env.SMTP_REQUIRE_TLS ?? (secure ? 'true' : 'false')).toLowerCase();
    const requireTLS = overrides?.requireTLS ?? (requireTLSFlag === 'true' || requireTLSFlag === '1');
    const connTimeout = Number(process.env.SMTP_CONNECTION_TIMEOUT ?? 15000);
    const sockTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT ?? 15000);
    return nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS,
      auth: { user, pass },
      connectionTimeout: connTimeout,
      socketTimeout: sockTimeout,
    });
  }

  static async sendResetCode(email: string, code: string): Promise<void> {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME || '';
    const html = `<div style="font-family: Arial, sans-serif; color: #111;"><h2>Restablecer contraseña</h2><p>Tu código de verificación es:</p><div style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</div><p>Este código expira en 10 minutos.</p><p>Si no solicitaste este cambio, ignora este correo.</p></div>`;
    const primary = this.getTransporter();
    try {
      const info = await primary.sendMail({ from: `InnovaTube <${fromEmail}>`, to: email, subject: 'Código para restablecer tu contraseña', html });
      if ((process.env.NODE_ENV || 'development') === 'development') {
        console.log('Mail enviado:', info.messageId, 'para', email, 'código:', code);
      }
      return;
    } catch (err: any) {
      const fbHost = process.env.SMTP_FALLBACK_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
      const fbPort = Number(process.env.SMTP_FALLBACK_PORT || 2525);
      const fallback = this.getTransporter({ host: fbHost, port: fbPort, secure: false, requireTLS: false });
      const info = await fallback.sendMail({ from: `InnovaTube <${fromEmail}>`, to: email, subject: 'Código para restablecer tu contraseña', html });
      if ((process.env.NODE_ENV || 'development') === 'development') {
        console.log('Mail enviado (fallback):', info.messageId, 'para', email, 'código:', code);
      }
    }
  }
}