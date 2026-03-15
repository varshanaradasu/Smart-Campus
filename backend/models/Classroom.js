const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
    {
        day: String,
        start: String,
        end: String,
        isBooked: { type: Boolean, default: false },
    },
    { _id: false }
);

const classroomSchema = new mongoose.Schema(
    {
        roomNumber: { type: String, trim: true, unique: true, sparse: true },
        name: { type: String, required: true, unique: true },
        building: { type: String, required: true },
        capacity: { type: Number, required: true },
        type: {
            type: String,
            enum: ['classroom', 'lab', 'hall'],
            default: 'classroom',
        },
        availability: [slotSchema],
        availableSlots: [{ type: String, trim: true }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Classroom', classroomSchema);
