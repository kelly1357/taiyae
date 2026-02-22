import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        ciphers: 'SSLv3',
    },
});

const EMAIL_FROM = process.env.EMAIL_FROM || 'Horizon Wolves <no-reply@horizonwolves.com>';
const APP_URL = process.env.APP_URL || 'https://www.horizonwolves.com';

function emailWrapper(title: string, bodyContent: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: system-ui, -apple-system, Helvetica, Arial, sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
<tr><td style="padding: 40px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="520" align="center" style="max-width: 520px; width: 100%; background-color: #ffffff; border: 1px solid #d1d5db;">

<!-- Header -->
<tr>
<td style="background-color: #2f3a2f; padding: 20px 32px; text-align: center;">
    <span style="font-family: Baskerville, 'Times New Roman', Georgia, serif; font-size: 28px; letter-spacing: 6px; color: #ffffff; text-transform: uppercase;">HORIZON</span>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding: 32px 32px 24px 32px;">
${bodyContent}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding: 0 32px 32px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="border-top: 1px solid #d1d5db; padding-top: 20px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">&copy; ${new Date().getFullYear()} Horizon. All rights reserved.</p>
        <p style="margin: 0; font-size: 11px; color: #9ca3af;">This is an automated message. Please do not reply to this email.</p>
    </td></tr>
    </table>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendConfirmationEmail(email: string, token: string): Promise<void> {
    const confirmUrl = `${APP_URL}/confirm-email?token=${token}`;

    const bodyContent = `
    <h1 style="margin: 0 0 16px 0; font-family: Baskerville, 'Times New Roman', Georgia, serif; font-size: 22px; font-weight: normal; color: #111827;">Welcome to Horizon!</h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #374151;">Thanks for registering. Please verify your email address to complete your account setup.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 24px auto;">
    <tr>
    <td style="background-color: #2f3a2f; border-radius: 4px;">
        <a href="${confirmUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; font-family: system-ui, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">Verify Email</a>
    </td>
    </tr>
    </table>
    <p style="margin: 0 0 16px 0; font-size: 12px; color: #6b7280;">This link expires in 24 hours.</p>
    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="margin: 0; font-size: 12px; word-break: break-all;"><a href="${confirmUrl}" style="color: #617eb3; text-decoration: underline;">${confirmUrl}</a></p>`;

    await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'Verify your Horizon account',
        html: emailWrapper('Verify your Horizon account', bodyContent),
    });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    const bodyContent = `
    <h1 style="margin: 0 0 16px 0; font-family: Baskerville, 'Times New Roman', Georgia, serif; font-size: 22px; font-weight: normal; color: #111827;">Password Reset Request</h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #374151;">We received a request to reset your password. Click the button below to choose a new one.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 24px auto;">
    <tr>
    <td style="background-color: #2f3a2f; border-radius: 4px;">
        <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; font-family: system-ui, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">Reset Password</a>
    </td>
    </tr>
    </table>
    <p style="margin: 0 0 16px 0; font-size: 12px; color: #6b7280;">This link expires in 1 hour.</p>
    <p style="margin: 0 0 16px 0; font-size: 12px; color: #6b7280;">If you didn't request this, you can safely ignore this email. Your password will not be changed.</p>
    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="margin: 0; font-size: 12px; word-break: break-all;"><a href="${resetUrl}" style="color: #617eb3; text-decoration: underline;">${resetUrl}</a></p>`;

    await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'Reset your Horizon password',
        html: emailWrapper('Reset your Horizon password', bodyContent),
    });
}
