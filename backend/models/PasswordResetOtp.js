const mongoose = require('mongoose');

const passwordResetOtpSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        identifierType: {
            type: String,
            enum: ['email', 'phone'],
            required: true,
        },
        identifier: {
            type: String,
            required: true,
            index: true,
        },
        otpHash: {
            type: String,
            default: '',
        },
        attempts: {
            type: Number,
            default: 0,
        },
        maxAttempts: {
            type: Number,
            default: 3,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        resetTokenHash: {
            type: String,
            default: '',
        },
        resetTokenExpiresAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

passwordResetOtpSchema.index({ identifierType: 1, identifier: 1 }, { unique: true });
passwordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);
