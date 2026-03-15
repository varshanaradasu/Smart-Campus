const mongoose = require('mongoose');

const transportRouteSchema = new mongoose.Schema(
    {
        routeName: { type: String, required: true },
        busNumber: {
            type: String,
            required: true,
            match: /^AP\d{2}-\d{4}$/,
        },
        stops: [{ type: String, required: true }],
        capacity: { type: Number, required: true, min: 45, max: 55 },
        currentUtilization: { type: Number, required: true, min: 50, max: 95 },
        predictedDemand: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['Active', 'Maintenance'],
            default: 'Active',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TransportRoute', transportRouteSchema);
