const { Resend } = require('resend');
const twilio = require('twilio');

let cachedResendClient = null;
let cachedTwilioClient = null;

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        throw new Error('Email OTP is not configured. Set RESEND_API_KEY.');
    }

    if (!cachedResendClient) {
        cachedResendClient = new Resend(apiKey);
    }

    return cachedResendClient;
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
    const resend = getResendClient();
    const from = process.env.RESEND_FROM || 'Smart Campus <onboarding@resend.dev>';

    try {
        const result = await resend.emails.send({
            from,
            to,
            subject: 'Password Reset OTP',
            html: `<h2>Your OTP is: ${otp}</h2>`,
        });

        if (result?.error) {
            throw new Error(result.error.message || 'Failed to send email via Resend.');
        }
    } catch (error) {
        throw new Error(error?.message || 'Failed to send email via Resend.');
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
