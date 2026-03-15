const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, trim: true },
        sectionName: { type: String, trim: true },
        department: { type: String, default: 'CSE' },
        year: { type: Number, required: true, min: 1 },
        section: { type: String, default: 'A' },
        strength: { type: Number, default: 60 },
        subjects: [{ type: mongoose.Schema.Types.Mixed }],
    },
    { timestamps: true, collection: 'sections' }
);

module.exports = mongoose.model('Section', sectionSchema);
