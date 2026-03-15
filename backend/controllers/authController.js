const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Timetable = require('../models/Timetable');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const { sendOtpEmail, sendOtpSms } = require('../services/notificationService');

const REG_NO_PATTERN = /\b\d{2}[A-Z]{2}\d{5}\b/i;
const NAME_PREFIX_PATTERN = /^(DR|MR|MRS|MS|MISS|PROF)\.?\s+/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 3;

const normalizeNameToken = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '');

const normalizeDisplayName = (value) => String(value || '').trim();

const normalizeNameForEmail = (value) =>
    normalizeDisplayName(value)
        .replace(NAME_PREFIX_PATTERN, '')
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const detectRegistrationNumber = (...values) => {
    for (const value of values) {
        const text = String(value || '').trim();
        const match = text.match(REG_NO_PATTERN);
        if (match) {
            return match[0].toUpperCase();
        }
    }
    return '';
};

const buildFacultyEmail = ({ name, existingEmail, registrationNumber }) => {
    const email = String(existingEmail || '').trim().toLowerCase();
    if (email) return email;

    const regNo = detectRegistrationNumber(registrationNumber, name);
    if (regNo) {
        return `${regNo}@gmail.com`;
    }

    const localPart = normalizeNameToken(normalizeNameForEmail(name)) || 'faculty';
    return `${localPart}@gmail.com`;
};

const buildPhoneNumber = (seedValue) => {
    const seed = String(seedValue || 'faculty');
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index += 1) {
        hash ^= seed.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    const normalizedHash = Math.abs(hash >>> 0);
    const prefixes = ['9', '8', '7', '6'];
    const prefix = prefixes[normalizedHash % prefixes.length];
    const suffix = String((normalizedHash * 48271) % 1000000000).padStart(9, '0');
    return `${prefix}${suffix}`;
};

const sanitizePhoneNumber = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (/^[6-9]\d{9}$/.test(digits)) {
        return digits;
    }
    return '';
};

const normalizePhoneForLookup = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return digits;
    if (digits.length > 10) return digits.slice(-10);
    return '';
};

const toSmsNumber = (value) => {
    const raw = String(value || '').trim();
    if (raw.startsWith('+')) {
        return raw.replace(/\s+/g, '');
    }

    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10) {
        return `+91${digits}`;
    }
    if (digits.length > 10) {
        return `+${digits}`;
    }

    return '';
};

const parseForgotIdentifier = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;

    if (EMAIL_PATTERN.test(raw)) {
        return {
            identifierType: 'email',
            identifier: raw.toLowerCase(),
            smsTo: '',
        };
    }

    const phoneLookup = normalizePhoneForLookup(raw);
    if (!phoneLookup) return null;

    return {
        identifierType: 'phone',
        identifier: phoneLookup,
        smsTo: toSmsNumber(raw),
    };
};

const findUserByIdentifier = async ({ identifierType, identifier }) => {
    if (identifierType === 'email') {
        const userByEmail = await User.findOne({ email: identifier });
        if (userByEmail) return userByEmail;

        const facultyByEmail = await Faculty.findOne({ email: identifier });
        if (!facultyByEmail) return null;

        const possibleNames = [facultyByEmail.name, normalizeNameForEmail(facultyByEmail.name)]
            .map((name) => normalizeDisplayName(name))
            .filter(Boolean);

        return User.findOne({
            role: 'faculty',
            $or: [
                { email: identifier },
                { name: { $in: possibleNames } },
            ],
        });
    }

    const userByPhone = await User.findOne({
        $or: [
            { phone: identifier },
            { phone: new RegExp(`${identifier}$`) },
        ],
    });
    if (userByPhone) return userByPhone;

    const facultyByPhone = await Faculty.findOne({
        phone: new RegExp(`${identifier}$`),
    });
    if (!facultyByPhone) return null;

    const possibleFacultyEmail = String(facultyByPhone.email || '').trim().toLowerCase();
    const possibleNames = [facultyByPhone.name, normalizeNameForEmail(facultyByPhone.name)]
        .map((name) => normalizeDisplayName(name))
        .filter(Boolean);

    return User.findOne({
        role: 'faculty',
        $or: [
            ...(possibleFacultyEmail ? [{ email: possibleFacultyEmail }] : []),
            { name: { $in: possibleNames } },
        ],
    });
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const isValidFacultyName = (value) => {
    const text = normalizeDisplayName(value);
    if (!text) return false;
    if (text.length < 3) return false;
    if (/^[^a-zA-Z]+$/.test(text)) return false;
    if (/^\d+$/.test(text)) return false;
    if (detectRegistrationNumber(text)) return false;
    return true;
};

const enrichFacultyRecord = (entry) => {
    const name = normalizeDisplayName(entry.name);
    const registrationNumber = detectRegistrationNumber(entry.registrationNumber, entry.regNo, entry.shortCode, name);
    const email = buildFacultyEmail({
        name,
        existingEmail: entry.email,
        registrationNumber,
    });
    const phone = sanitizePhoneNumber(entry.phone) || buildPhoneNumber(`${name}|${registrationNumber}`);

    return {
        ...entry,
        name,
        department: entry.department || 'CSE',
        subjects: Array.isArray(entry.subjects) ? entry.subjects : [],
        assignedSections: Array.isArray(entry.assignedSections) ? entry.assignedSections : [],
        email,
        phone,
        phoneNumber: phone,
        registrationNumber,
    };
};

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    const token = generateToken(user._id);

    res.json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
        },
    });
};

const forgotPassword = async (req, res) => {
    console.info('[auth][forgot-password] Request received');

    const { emailOrPhone, identifier } = req.body || {};
    const lookupValue = String(emailOrPhone || identifier || '').trim();
    const parsed = parseForgotIdentifier(lookupValue);

    if (!parsed) {
        console.warn('[auth][forgot-password] Invalid identifier payload');
        res.status(400);
        throw new Error('Enter a valid registered email.');
    }

    console.info(`[auth][forgot-password] Looking up user by ${parsed.identifierType}`);

    const userByDirectMatch = await User.findOne(
        parsed.identifierType === 'email'
            ? { email: parsed.identifier }
            : {
                $or: [
                    { phone: parsed.identifier },
                    { phone: new RegExp(`${parsed.identifier}$`) },
                ],
            }
    );

    const user = userByDirectMatch || (await findUserByIdentifier(parsed));
    if (!user) {
        console.warn('[auth][forgot-password] No matching user found');
        res.status(404);
        throw new Error('No account found with this email.');
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const otpRecord = await PasswordResetOtp.findOneAndUpdate(
        { identifierType: parsed.identifierType, identifier: parsed.identifier },
        {
            user: user._id,
            identifierType: parsed.identifierType,
            identifier: parsed.identifier,
            otpHash,
            attempts: 0,
            maxAttempts: MAX_OTP_ATTEMPTS,
            expiresAt,
            verified: false,
            resetTokenHash: '',
            resetTokenExpiresAt: null,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.info(`[auth][forgot-password] OTP generated for user ${user._id}`);

    if (parsed.identifierType === 'email') {
        try {
            await sendOtpEmail({ to: parsed.identifier, otp });
            console.info('[auth][forgot-password] OTP sent by email');
        } catch (error) {
            console.error('[auth][forgot-password] Failed to send OTP email', error.message);
            res.status(502);
            throw new Error('Failed to send OTP email. Please try again later.');
        }
    } else {
        const phoneFromUser = toSmsNumber(user.phone || '');
        const smsTo = phoneFromUser || parsed.smsTo;
        if (!smsTo) {
            console.warn('[auth][forgot-password] Invalid phone for SMS delivery');
            res.status(400);
            throw new Error('Registered phone number is invalid for SMS delivery.');
        }

        try {
            await sendOtpSms({ to: smsTo, otp });
            console.info('[auth][forgot-password] OTP sent by SMS');
        } catch (error) {
            console.error('[auth][forgot-password] Failed to send OTP SMS', error.message);
            res.status(502);
            throw new Error('Failed to send OTP SMS. Please try again later.');
        }
    }

    res.status(200).json({
        success: true,
        message: 'OTP sent successfully.',
        otpSessionId: otpRecord._id,
        identifier: parsed.identifier,
        identifierType: parsed.identifierType,
        expiresAt,
    });
};

const verifyOtp = async (req, res) => {
    const { identifier, otp, otpSessionId } = req.body || {};
    const parsed = parseForgotIdentifier(identifier);

    if (!parsed || !otp) {
        res.status(400);
        throw new Error('Identifier and OTP are required.');
    }

    const query = { identifierType: parsed.identifierType, identifier: parsed.identifier };
    if (otpSessionId) {
        query._id = otpSessionId;
    }

    const otpRecord = await PasswordResetOtp.findOne(query);
    if (!otpRecord) {
        res.status(404);
        throw new Error('OTP session not found. Please request a new OTP.');
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
        await otpRecord.deleteOne();
        res.status(400);
        throw new Error('OTP has expired. Please resend OTP.');
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
        res.status(429);
        throw new Error('Maximum OTP attempts reached. Please resend OTP.');
    }

    const isValidOtp = await bcrypt.compare(String(otp), otpRecord.otpHash || '');
    if (!isValidOtp) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        const attemptsLeft = Math.max(otpRecord.maxAttempts - otpRecord.attempts, 0);
        if (attemptsLeft <= 0) {
            res.status(429);
            throw new Error('Maximum OTP attempts reached. Please resend OTP.');
        }

        res.status(400);
        throw new Error(`Invalid OTP. ${attemptsLeft} attempt(s) remaining.`);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    otpRecord.verified = true;
    otpRecord.otpHash = '';
    otpRecord.attempts = 0;
    otpRecord.expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    otpRecord.resetTokenHash = hashResetToken(resetToken);
    otpRecord.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await otpRecord.save();

    res.json({
        success: true,
        message: 'OTP verified successfully.',
        resetToken,
        identifier: parsed.identifier,
        identifierType: parsed.identifierType,
    });
};

const resetPassword = async (req, res) => {
    const { identifier, resetToken, newPassword } = req.body || {};
    const parsed = parseForgotIdentifier(identifier);

    if (!parsed || !resetToken || !newPassword) {
        res.status(400);
        throw new Error('Identifier, reset token and new password are required.');
    }

    if (String(newPassword).length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters long.');
    }

    const otpRecord = await PasswordResetOtp.findOne({
        identifierType: parsed.identifierType,
        identifier: parsed.identifier,
    });

    if (!otpRecord || !otpRecord.verified || !otpRecord.resetTokenHash) {
        res.status(400);
        throw new Error('Reset session is invalid. Verify OTP again.');
    }

    if (!otpRecord.resetTokenExpiresAt || otpRecord.resetTokenExpiresAt.getTime() < Date.now()) {
        await otpRecord.deleteOne();
        res.status(400);
        throw new Error('Reset session expired. Please request a new OTP.');
    }

    const providedTokenHash = hashResetToken(String(resetToken));
    if (providedTokenHash !== otpRecord.resetTokenHash) {
        res.status(400);
        throw new Error('Invalid reset token. Please verify OTP again.');
    }

    const user = await User.findById(otpRecord.user);
    if (!user) {
        await otpRecord.deleteOne();
        res.status(404);
        throw new Error('Account not found for password reset.');
    }

    user.password = newPassword;
    await user.save();

    await otpRecord.deleteOne();

    res.json({
        success: true,
        message: 'Password reset successful. Please login again.',
    });
};

const profile = async (req, res) => {
    res.json({ success: true, user: req.user });
};

const listFaculty = async (_req, res) => {
    const [userFaculty, masterFaculty, timetables] = await Promise.all([
        User.find({ role: 'faculty' }).select('-password'),
        Faculty.find(),
        Timetable.find().select('sectionCode facultyDetails timetable days').populate('faculty', 'name email'),
    ]);

    const facultyMap = new Map();

    (masterFaculty || []).forEach((entry) => {
        if (!isValidFacultyName(entry.name)) return;
        facultyMap.set(entry.name, {
            id: String(entry._id),
            name: entry.name,
            department: entry.department || 'CSE',
            subjects: Array.isArray(entry.subjects) ? entry.subjects : [],
            email: entry.email || '',
            phone: entry.phone || '',
            assignedSections: Array.isArray(entry.assignedSections) ? entry.assignedSections : [],
        });
    });

    (userFaculty || []).forEach((entry) => {
        if (!isValidFacultyName(entry.name)) return;
        const existing = facultyMap.get(entry.name) || {
            id: String(entry._id),
            name: entry.name,
            department: entry.department || 'CSE',
            subjects: [],
            email: '',
            phone: '',
            assignedSections: [],
        };

        existing.email = existing.email || entry.email || '';
        existing.department = existing.department || entry.department || 'CSE';
        facultyMap.set(entry.name, existing);
    });

    (timetables || []).forEach((doc) => {
        const section = doc.sectionCode || '-';
        (doc.facultyDetails || []).forEach((detail) => {
            const subject = String(detail?.subject || '').trim();
            const names = Array.isArray(detail?.faculty)
                ? detail.faculty
                : String(detail?.faculty || '')
                    .split(',')
                    .map((name) => name.trim())
                    .filter(Boolean);

            names.forEach((name) => {
                if (!isValidFacultyName(name)) return;
                const entry = facultyMap.get(name) || {
                    id: name,
                    name,
                    department: 'CSE',
                    subjects: [],
                    email: '',
                    phone: '',
                    assignedSections: [],
                };

                if (subject && !entry.subjects.includes(subject)) {
                    entry.subjects.push(subject);
                }
                if (section && !entry.assignedSections.includes(section)) {
                    entry.assignedSections.push(section);
                }

                facultyMap.set(name, entry);
            });
        });
    });

    const data = Array.from(facultyMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    res.json({ success: true, data: data.map((item) => enrichFacultyRecord(item)) });
};

const createFaculty = async (req, res) => {
    const { name, email, password, department, registrationNumber } = req.body;

    if (!name || !password || !department) {
        res.status(400);
        throw new Error('Name, password and department are required');
    }

    const generatedEmail = buildFacultyEmail({ name, existingEmail: email, registrationNumber });

    const exists = await User.findOne({ email: generatedEmail });
    if (exists) {
        res.status(409);
        throw new Error('User already exists with this email');
    }

    const user = await User.create({
        name,
        email: generatedEmail,
        password,
        department,
        role: 'faculty',
    });

    res.status(201).json({
        success: true,
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
        },
    });
};

const updateFaculty = async (req, res) => {
    const { name, email, department, password, registrationNumber } = req.body;
    const faculty = await User.findOne({ _id: req.params.id, role: 'faculty' });

    if (!faculty) {
        res.status(404);
        throw new Error('Faculty not found');
    }

    faculty.name = name ?? faculty.name;
    faculty.email = buildFacultyEmail({
        name: faculty.name,
        existingEmail: email ?? faculty.email,
        registrationNumber,
    });
    faculty.department = department ?? faculty.department;
    if (password) {
        faculty.password = password;
    }

    const saved = await faculty.save();
    res.json({
        success: true,
        data: {
            id: saved._id,
            name: saved.name,
            email: saved.email,
            role: saved.role,
            department: saved.department,
        },
    });
};

const deleteFaculty = async (req, res) => {
    const faculty = await User.findOne({ _id: req.params.id, role: 'faculty' });
    if (!faculty) {
        res.status(404);
        throw new Error('Faculty not found');
    }

    await faculty.deleteOne();
    res.json({ success: true, message: 'Faculty deleted successfully' });
};

module.exports = {
    login,
    forgotPassword,
    verifyOtp,
    resetPassword,
    profile,
    listFaculty,
    createFaculty,
    updateFaculty,
    deleteFaculty,
};
