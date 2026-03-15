const mongoose = require('mongoose');

const labScheduleSchema = new mongoose.Schema(
    {
        labName: { type: String, required: true },
        department: { type: String, required: true },
        subject: { type: String, required: true },
        faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
        day: { type: String, required: true },
        timeSlot: { type: String, required: true },
        batch: { type: String, required: true },
        equipmentNeeds: [{ type: String }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('LabSchedule', labScheduleSchema);
