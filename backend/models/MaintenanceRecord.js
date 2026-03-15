const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema(
    {
        facility: { type: String, required: true },
        type: { type: String, required: true },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        status: {
            type: String,
            enum: ['open', 'in-progress', 'resolved'],
            default: 'open',
        },
        sensorScore: { type: Number, min: 0, max: 100, default: 50 },
        predictedFailureProbability: { type: Number, min: 0, max: 1, default: 0 },
        lastServiceDate: { type: Date, default: Date.now },
        nextServiceDate: { type: Date },
        notes: { type: String, default: '' },
    },
    { timestamps: true, collection: 'maintenancerecords' }
);

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
