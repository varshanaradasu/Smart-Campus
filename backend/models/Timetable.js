const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
    {
        sectionCode: { type: String, index: true },
        year: { type: Number },
        branch: { type: String, default: 'CSE', index: true },
        sectionName: { type: String },
        timetable: { type: mongoose.Schema.Types.Mixed },
        days: { type: mongoose.Schema.Types.Mixed },
        facultyDetails: { type: mongoose.Schema.Types.Mixed, default: [] },
        entries: { type: mongoose.Schema.Types.Mixed, default: [] },
        generationMode: {
            type: String,
            enum: ['algorithmic', 'openai'],
            default: 'algorithmic',
        },

        // Legacy fields retained for backward compatibility with old endpoints.
        course: { type: String },
        department: { type: String },
        semester: { type: Number },
        faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
        day: { type: String },
        timeSlot: { type: String },
        labRequired: { type: Boolean, default: false },
    },
    { timestamps: true, collection: 'timetables' }
);

module.exports = mongoose.model('Timetable', timetableSchema);
