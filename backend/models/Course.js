const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, trim: true },
        title: { type: String, required: true },
        category: {
            type: String,
            enum: ['theory', 'lab', 'training', 'elective'],
            default: 'theory',
        },
        weeklySlots: { type: Number, required: true, min: 1 },
        durationSlots: { type: Number, default: 1, min: 1 },
        department: { type: String, default: 'CSE' },
        preferredClassroomType: {
            type: String,
            enum: ['classroom', 'lab', 'any'],
            default: 'classroom',
        },
    },
    { timestamps: true, collection: 'courses' }
);

module.exports = mongoose.model('Course', courseSchema);
