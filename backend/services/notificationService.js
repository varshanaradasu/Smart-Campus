const nodemailer = require('nodemailer');
const twilio = require('twilio');

let cachedTransporter = null;
let cachedFallbackTransporter = null;
let cachedTwilioClient = null;

const createSmtpTransporter = ({ port, secure }) => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port,
        secure,
        auth: { user, pass },
        family: 4,
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 45000,
    });
};

const getMailer = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        throw new Error('Email OTP is not configured. Set EMAIL_USER and EMAIL_PASS.');
    }

    if (!cachedTransporter) {
        cachedTransporter = createSmtpTransporter({ port: 587, secure: false });
    }

    return cachedTransporter;
};

const getFallbackMailer = () => {
    if (!cachedFallbackTransporter) {
        cachedFallbackTransporter = createSmtpTransporter({ port: 465, secure: true });
    }

    return cachedFallbackTransporter;
};

const getTwilioClient = () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
        throw new Error('SMS OTP is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }

    if (!cachedTwilioClient) {
        cachedTwilioClient = twilio(sid, token);
    }

    return cachedTwilioClient;
};

const sendOtpEmail = async ({ to, otp }) => {
    const transporter = getMailer();
    const from = process.env.EMAIL_USER;

    const message = {
        from,
        to,
        subject: 'Smart Campus - Password Reset OTP',
        text: `Your OTP for password reset is ${otp}. It is valid for 5 minutes.`,
        html: `<p>Your OTP for password reset is <strong>${otp}</strong>.</p><p>This OTP is valid for 5 minutes.</p>`,
    };

    try {
        await transporter.sendMail(message);
    } catch (error) {
        const isTimeout =
            error?.code === 'ETIMEDOUT' ||
            error?.code === 'ESOCKET' ||
            /timeout/i.test(String(error?.message || ''));

        if (!isTimeout) {
            throw error;
        }

        const fallbackTransporter = getFallbackMailer();
        await fallbackTransporter.sendMail(message);
    }
};

const sendOtpSms = async ({ to, otp }) => {
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!from) {
        throw new Error('SMS OTP is not configured. Set TWILIO_PHONE_NUMBER.');
    }

    const client = getTwilioClient();
    await client.messages.create({
        body: `Your Smart Campus password reset OTP is ${otp}. Valid for 5 minutes.`,
        from,
        to,
    });
};

module.exports = {
    sendOtpEmail,
    sendOtpSms,
};
