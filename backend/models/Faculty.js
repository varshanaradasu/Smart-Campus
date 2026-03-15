const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        shortCode: { type: String, required: true, unique: true, uppercase: true },
        department: { type: String, default: 'CSE' },
        specialization: { type: String, default: '' },
        subjects: [{ type: String, uppercase: true, trim: true }],
        email: { type: String, default: '', lowercase: true, trim: true },
        phone: { type: String, default: '', trim: true },
        assignedSections: [{ type: String, trim: true }],
        availableSlots: [{ type: String, trim: true }],
    },
    { timestamps: true, collection: 'faculties' }
);

module.exports = mongoose.model('Faculty', facultySchema);
