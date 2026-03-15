const MaintenanceRecord = require('../models/MaintenanceRecord');
const {
    generateDemoMaintenanceRecords,
    predictMaintenanceRisk,
} = require('../services/maintenanceService');

const parseCsvRows = (csvText) => {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        return [];
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        return row;
    });
};

const getRecords = async (_req, res) => {
    let records = await MaintenanceRecord.find().sort({ createdAt: -1 });
    if (!records.length) {
        await MaintenanceRecord.insertMany(generateDemoMaintenanceRecords());
        records = await MaintenanceRecord.find().sort({ createdAt: -1 });
    }
    res.json({ success: true, data: records });
};

const createRecord = async (req, res) => {
    const record = await MaintenanceRecord.create(req.body);
    res.status(201).json({ success: true, data: record });
};

const uploadCsvRecords = async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('CSV file is required (field name: file)');
    }

    const csvText = req.file.buffer.toString('utf-8');
    const rows = parseCsvRows(csvText);

    if (!rows.length) {
        res.status(400);
        throw new Error('CSV has no data rows');
    }

    const payload = rows.map((row) => ({
        facility: row.facility || 'Unknown Facility',
        type: row.type || 'Electrical',
        priority: ['low', 'medium', 'high', 'critical'].includes((row.priority || '').toLowerCase())
            ? row.priority.toLowerCase()
            : 'medium',
        status: ['open', 'in-progress', 'resolved'].includes((row.status || '').toLowerCase())
            ? row.status.toLowerCase()
            : 'open',
        sensorScore: Number(row.sensorscore || row.sensor_score || 50),
        lastServiceDate: row.lastservicedate || row.last_service_date || new Date(),
        nextServiceDate: row.nextservicedate || row.next_service_date || undefined,
        notes: row.notes || '',
    }));

    const inserted = await MaintenanceRecord.insertMany(payload);
    res.status(201).json({ success: true, message: 'CSV imported successfully', count: inserted.length, data: inserted });
};

const updateRecord = async (req, res) => {
    const record = await MaintenanceRecord.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!record) {
        res.status(404);
        throw new Error('Maintenance record not found');
    }

    res.json({ success: true, data: record });
};

const predictMaintenance = async (_req, res) => {
    let records = await MaintenanceRecord.find();
    if (!records.length) {
        await MaintenanceRecord.insertMany(generateDemoMaintenanceRecords());
        records = await MaintenanceRecord.find();
    }

    const prediction = records.map((record) => predictMaintenanceRisk(record));

    await Promise.all(
        prediction.map((item) =>
            MaintenanceRecord.findByIdAndUpdate(item._id, {
                predictedFailureProbability: item.predictedFailureProbability,
            })
        )
    );

    res.json({
        success: true,
        mode: 'sensor-health',
        message: 'Maintenance sensor health was evaluated for current records.',
        data: prediction,
    });
};

module.exports = {
    getRecords,
    createRecord,
    uploadCsvRecords,
    updateRecord,
    predictMaintenance,
};
