const FACILITY_POOL = [
    { facility: 'Lab AC Unit - CSE Block', type: 'Electrical' },
    { facility: 'Water Pump - Hostel A', type: 'Mechanical' },
    { facility: 'Elevator - Admin Block', type: 'Mechanical' },
    { facility: 'UPS Room - Server Floor', type: 'Electrical' },
    { facility: 'Fire Alarm Panel - Library', type: 'Safety' },
    { facility: 'Smart Board - Seminar Hall', type: 'Electronics' },
    { facility: 'CCTV Backbone - Main Gate', type: 'Network' },
    { facility: 'Generator - Central Utility', type: 'Electrical' },
];

const TYPE_RISK_MAP = {
    electrical: 0.72,
    mechanical: 0.64,
    electronics: 0.58,
    safety: 0.76,
    network: 0.52,
    hvac: 0.68,
};

const predictMaintenanceRisk = (record) => {
    const daysSinceService = Math.max(
        1,
        Math.ceil((Date.now() - new Date(record.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24))
    );

    const normalizedServiceGap = Math.min(1, daysSinceService / 180);
    const normalizedSensor = (record.sensorScore || 0) / 100;
    const normalizedTypeRisk = TYPE_RISK_MAP[(record.type || '').toLowerCase()] || 0.55;

    // AI-inspired weighted risk blending sensor behavior, service history, and equipment profile.
    const risk = Number(
        (normalizedSensor * 0.5 + normalizedServiceGap * 0.3 + normalizedTypeRisk * 0.2).toFixed(2)
    );

    return {
        ...record.toObject(),
        predictedFailureProbability: risk,
        maintenanceAlert: risk >= 0.75 ? 'Immediate action required' : risk >= 0.5 ? 'Monitor closely' : 'Stable',
    };
};

const generateDemoMaintenanceRecords = () => {
    const seedRecords = [
        {
            facility: 'Fire Alarm Panel - Library',
            type: 'Safety',
            priority: 'high',
            status: 'in-progress',
            sensorScore: 64,
            lastServiceDate: new Date('2026-02-10'),
            nextServiceDate: new Date('2026-04-10'),
            notes: 'Smoke loop on Level 2 occasionally drops for 3-5 seconds.',
        },
        {
            facility: 'Smart Board - Seminar Hall',
            type: 'Electronics',
            priority: 'medium',
            status: 'open',
            sensorScore: 72,
            lastServiceDate: new Date('2026-01-22'),
            nextServiceDate: new Date('2026-04-22'),
            notes: 'Touch calibration drift noticed during morning sessions.',
        },
        {
            facility: 'CCTV Backbone - Main Gate',
            type: 'Network',
            priority: 'critical',
            status: 'in-progress',
            sensorScore: 58,
            lastServiceDate: new Date('2026-02-01'),
            nextServiceDate: new Date('2026-03-20'),
            notes: 'Intermittent packet loss on upstream NVR link.',
        },
        {
            facility: 'Generator - Central Utility',
            type: 'Electrical',
            priority: 'high',
            status: 'open',
            sensorScore: 67,
            lastServiceDate: new Date('2026-02-18'),
            nextServiceDate: new Date('2026-03-30'),
            notes: 'Load transfer delay exceeded threshold in two recent drills.',
        },
        {
            facility: 'Lab AC Unit - CSE Block',
            type: 'Mechanical',
            priority: 'medium',
            status: 'open',
            sensorScore: 75,
            lastServiceDate: new Date('2026-02-06'),
            nextServiceDate: new Date('2026-04-06'),
            notes: 'Compressor cycle irregular during peak occupancy hours.',
        },
        {
            facility: 'Water Pump - Hostel A',
            type: 'Mechanical',
            priority: 'high',
            status: 'in-progress',
            sensorScore: 61,
            lastServiceDate: new Date('2026-01-30'),
            nextServiceDate: new Date('2026-03-28'),
            notes: 'Pressure drop observed between 6:00-7:00 AM.',
        },
        {
            facility: 'Elevator - Admin Block',
            type: 'Mechanical',
            priority: 'low',
            status: 'resolved',
            sensorScore: 88,
            lastServiceDate: new Date('2026-03-01'),
            nextServiceDate: new Date('2026-05-01'),
            notes: 'Door alignment corrected and tested for full duty cycle.',
        },
        {
            facility: 'UPS Room - Server Floor',
            type: 'Electrical',
            priority: 'critical',
            status: 'open',
            sensorScore: 54,
            lastServiceDate: new Date('2026-01-15'),
            nextServiceDate: new Date('2026-03-18'),
            notes: 'Battery bank B showing accelerated discharge profile.',
        },
    ];

    return seedRecords;
};

module.exports = { predictMaintenanceRisk, generateDemoMaintenanceRecords };
