const Timetable = require('../models/Timetable');
const Classroom = require('../models/Classroom');
const LabSchedule = require('../models/LabSchedule');
const User = require('../models/User');
const TransportRoute = require('../models/TransportRoute');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const {
    createDemoClassrooms,
    generateDemoLabSchedules,
    generateDemoTimetableRecords,
} = require('../services/schedulerService');
const {
    generateDemoTransportRoutes,
    optimizeDemoTransportRoutes,
} = require('../services/transportService');
const {
    generateDemoMaintenanceRecords,
    predictMaintenanceRisk,
} = require('../services/maintenanceService');
const {
    generateTimetableWithAI,
    optimizeTransportWithAI,
    predictMaintenanceWithAI,
} = require('../services/aiService');

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

const buildTimetableFallback = ({ classrooms, facultyMembers }) => ({
    timetables: generateDemoTimetableRecords({ classrooms, facultyMembers, count: 30 }).map((item) => ({
        course: item.course,
        department: item.department,
        semester: item.semester,
        facultyEmail: facultyMembers.find((f) => String(f._id) === String(item.faculty))?.email,
        classroomName: classrooms.find((c) => String(c._id) === String(item.classroom))?.name,
        day: item.day,
        timeSlot: item.timeSlot,
        labRequired: item.labRequired,
    })),
    labs: generateDemoLabSchedules({ facultyMembers, count: 12 }).map((item) => ({
        labName: item.labName,
        department: item.department,
        subject: item.subject,
        facultyEmail: facultyMembers.find((f) => String(f._id) === String(item.faculty))?.email,
        day: item.day,
        timeSlot: item.timeSlot,
        batch: item.batch,
        equipmentNeeds: item.equipmentNeeds,
    })),
});

const generateTimetable = async (_req, res) => {
    const facultyMembers = await User.find({ role: 'faculty' });
    if (!facultyMembers.length) {
        res.status(400);
        throw new Error('No faculty found. Run seed first.');
    }

    let classrooms = await Classroom.find();
    if (!classrooms.length) {
        classrooms = await Classroom.insertMany(createDemoClassrooms());
    }

    // OpenAI usage: this call attempts AI schedule generation and falls back to demo if key is missing/fails.
    const aiResult = await generateTimetableWithAI({
        facultyMembers,
        classrooms,
        fallbackFactory: () => buildTimetableFallback({ classrooms, facultyMembers }),
    });

    const facultyByEmail = new Map(facultyMembers.map((f) => [f.email.toLowerCase(), f]));
    const classroomByName = new Map(classrooms.map((c) => [c.name.toLowerCase(), c]));

    const timetablePayload = (aiResult.data.timetables || []).map((item) => {
        const faculty = facultyByEmail.get((item.facultyEmail || '').toLowerCase()) || pickRandom(facultyMembers);
        const classroom = classroomByName.get((item.classroomName || '').toLowerCase()) || pickRandom(classrooms);

        return {
            course: item.course || 'General Studies',
            department: item.department || faculty.department || 'Computer Science',
            semester: Number(item.semester) || 3,
            faculty: faculty._id,
            classroom: classroom._id,
            day: item.day || 'Monday',
            timeSlot: item.timeSlot || '10:00-11:00',
            labRequired: Boolean(item.labRequired),
        };
    });

    const labPayload = (aiResult.data.labs || []).map((item) => {
        const faculty = facultyByEmail.get((item.facultyEmail || '').toLowerCase()) || pickRandom(facultyMembers);

        return {
            labName: item.labName || 'Systems Lab',
            department: item.department || faculty.department || 'Computer Science',
            subject: item.subject || 'Lab Session',
            faculty: faculty._id,
            day: item.day || 'Monday',
            timeSlot: item.timeSlot || '11:30-12:30',
            batch: item.batch || 'Batch-A',
            equipmentNeeds: Array.isArray(item.equipmentNeeds) ? item.equipmentNeeds : [],
        };
    });

    await Promise.all([Timetable.deleteMany({}), LabSchedule.deleteMany({})]);

    const savedTimetable = await Timetable.insertMany(timetablePayload);
    await LabSchedule.insertMany(labPayload);

    const populated = await Timetable.find({ _id: { $in: savedTimetable.map((t) => t._id) } })
        .populate('faculty', 'name email department')
        .populate('classroom', 'name building capacity type')
        .sort({ day: 1, timeSlot: 1 });

    res.status(201).json({
        success: true,
        mode: aiResult.mode,
        message: aiResult.message,
        data: populated,
    });
};

const optimizeTransport = async (_req, res) => {
    const fallbackFactory = () => ({
        routes: optimizeDemoTransportRoutes(generateDemoTransportRoutes()),
    });

    // OpenAI usage: this call requests transport optimization with JSON output.
    const aiResult = await optimizeTransportWithAI({ fallbackFactory });

    const routePayload = (aiResult.data.routes || []).map((route, index) => ({
        routeName: route.routeName || `Campus Loop ${index + 1}`,
        busNumber: route.busNumber || `Bus-${index + 1}`,
        stops: Array.isArray(route.stops) && route.stops.length ? route.stops : ['Main Gate', 'Library'],
        capacity: Math.min(55, Math.max(45, Number(route.capacity) || 50)),
        currentUtilization: Math.min(95, Math.max(50, Number(route.currentUtilization ?? route.utilization) || 60)),
        predictedDemand: Number(route.predictedDemand) || 65,
        status: String(route.status || '').toLowerCase() === 'maintenance' ? 'Maintenance' : 'Active',
    }));

    await TransportRoute.deleteMany({});
    const savedRoutes = await TransportRoute.insertMany(routePayload);

    const routesWithRecommendations = savedRoutes.map((item) => {
        const raw = (aiResult.data.routes || []).find((r) => r.busNumber === item.busNumber);
        return {
            ...item.toObject(),
            recommendation: raw?.recommendation || 'Maintain current frequency',
        };
    });

    res.status(201).json({
        success: true,
        mode: aiResult.mode,
        message: aiResult.message,
        data: routesWithRecommendations,
    });
};

const predictMaintenance = async (_req, res) => {
    const fallbackFactory = () => ({
        records: generateDemoMaintenanceRecords().map((record) => {
            const asDoc = {
                ...record,
                toObject: () => record,
            };
            return predictMaintenanceRisk(asDoc);
        }),
    });

    // OpenAI usage: this call requests predictive maintenance analysis and risk scores.
    const aiResult = await predictMaintenanceWithAI({ fallbackFactory });

    const maintenancePayload = (aiResult.data.records || []).map((record) => ({
        facility: record.facility || 'Lab AC Unit',
        type: record.type || 'Electrical',
        priority: ['low', 'medium', 'high', 'critical'].includes(record.priority) ? record.priority : 'medium',
        status: ['open', 'in-progress', 'resolved'].includes(record.status) ? record.status : 'open',
        sensorScore: Number(record.sensorScore) || 55,
        predictedFailureProbability: Number(record.predictedFailureProbability) || 0.45,
        notes: record.notes || record.maintenanceAlert || 'Routine AI analysis.',
    }));

    await MaintenanceRecord.deleteMany({});
    const saved = await MaintenanceRecord.insertMany(maintenancePayload);

    const responseData = saved.map((item) => {
        const raw = (aiResult.data.records || []).find((r) => r.facility === item.facility);
        return {
            ...item.toObject(),
            maintenanceAlert: raw?.maintenanceAlert || 'Monitor condition',
        };
    });

    res.status(201).json({
        success: true,
        mode: aiResult.mode,
        message: aiResult.message,
        data: responseData,
    });
};

module.exports = {
    generateTimetable,
    optimizeTransport,
    predictMaintenance,
};
