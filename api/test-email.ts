import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load settings from local.settings.json
const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf-8'));
const env = settings.Values;

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
    tls: {
        minVersion: 'TLSv1.2',
    },
    debug: true,
    logger: true,
});

const EMAIL_FROM = env.EMAIL_FROM || 'Horizon Wolves <no-reply@horizonwolves.com>';

async function testEmail() {
    const testRecipient = process.argv[2];
    if (!testRecipient) {
        console.error('Usage: npx ts-node test-email.ts <recipient-email>');
        process.exit(1);
    }

    console.log('--- SMTP Config ---');
    console.log('Host:', env.SMTP_HOST);
    console.log('Port:', env.SMTP_PORT);
    console.log('User:', env.SMTP_USER);
    console.log('From:', EMAIL_FROM);
    console.log('To:', testRecipient);
    console.log('-------------------\n');

    // Step 1: Verify SMTP connection
    console.log('Verifying SMTP connection...');
    try {
        await transporter.verify();
        console.log('SMTP connection successful!\n');
    } catch (err) {
        console.error('SMTP connection FAILED:', err);
        process.exit(1);
    }

    // Step 2: Send test email
    console.log('Sending test email...');
    try {
        const info = await transporter.sendMail({
            from: EMAIL_FROM,
            to: testRecipient,
            subject: 'Horizon - Test Email',
            html: '<h1>Test Email</h1><p>If you received this, email sending is working correctly.</p>',
        });
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (err) {
        console.error('Failed to send email:', err);
        process.exit(1);
    }
}

testEmail();
