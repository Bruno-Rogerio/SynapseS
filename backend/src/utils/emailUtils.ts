// src/utils/emailUtils.ts
import nodemailer from 'nodemailer';

// Configuração do transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async (to: string, subject: string, htmlBody: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: htmlBody
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`E-mail real enviado com sucesso para ${to}`);
  } catch (error) {
    console.error('Erro ao enviar e-mail real:', error);
    throw error;
  }
};

export const sendEmailDev = async (to: string, subject: string, htmlBody: string): Promise<void> => {
  console.log(`[DEV] Simulando envio de e-mail para ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log(`Corpo HTML: ${htmlBody}`);
};

export const sendEmailWrapper = async (to: string, subject: string, htmlBody: string): Promise<void> => {
  if (process.env.USE_REAL_EMAIL === 'true') {
    console.log('Tentando enviar e-mail real...');
    await sendEmail(to, subject, htmlBody);
  } else {
    console.log('Usando modo de simulação de e-mail...');
    await sendEmailDev(to, subject, htmlBody);
  }
};

export const logEmailStatus = (): void => {
  if (process.env.USE_REAL_EMAIL === 'true') {
    console.log('Envio de e-mails reais está ATIVADO');
  } else {
    console.log('Envio de e-mails reais está DESATIVADO. Usando modo de simulação.');
  }
};
