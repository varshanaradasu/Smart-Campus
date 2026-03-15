const Classroom = require('../models/Classroom');
const LabSchedule = require('../models/LabSchedule');
const Timetable = require('../models/Timetable');
const TransportRoute = require('../models/TransportRoute');
const Faculty = require('../models/Faculty');
const Section = require('../models/Section');
const User = require('../models/User');
const { syncTransportRoutes } = require('../services/transportService');
const {
    normalizeName,
    getCurrentDayAndSlot,
    extractAllTimetableEntries,
    extractLabOccupancyRows,
    summarizeFacultyWorkload,
    summarizeDailyClassroomUtilization,
    countOccupiedByType,
} = require('../services/operationalDataService');
const {
    buildUniversityClassrooms,
    UNIVERSITY_CLASSROOM_SET,
} = require('../services/classroomDatasetService');

const DEFAULT_CLASSROOMS = buildUniversityClassrooms();

const DEFAULT_LAB_SLOTS = [
    {
        labName: 'AI Lab',
        department: 'CSE',
        subject: 'ML-L',
        day: 'MON',
        timeSlot: '10:10-11:00',
        batch: 'CSE_3A',
    },
    {
        labName: 'Networks Lab',
        department: 'CSE',
        subject: 'CNS-L',
        day: 'TUE',
        timeSlot: '11:00-11:50',
        batch: 'CSE_3B',
    },
    {
        labName: 'Data Science Lab',
        department: 'CSE',
        subject: 'DL-L',
        day: 'WED',
        timeSlot: '1:40-2:30',
        batch: 'CSE_3C',
    },
    {
        labName: 'Embedded Systems Lab',
        department: 'ECE',
        subject: 'ES-L',
        day: 'THU',
        timeSlot: '2:30-3:20',
        batch: 'ECE_3A',
    },
    {
        labName: 'Operating Systems Lab',
        department: 'CSE',
        subject: 'OS-L',
        day: 'FRI',
        timeSlot: '10:10-11:00',
        batch: 'CSE_3D',
    },
];

const ensureOperationalBaselines = async () => {
    const [, labCount] = await Promise.all([TransportRoute.countDocuments(), LabSchedule.countDocuments()]);

    const existingClassrooms = await Classroom.find({ type: 'classroom' }).select('roomNumber name');
    const needsClassroomSync =
        existingClassrooms.length !== DEFAULT_CLASSROOMS.length ||
        existingClassrooms.some(
            (room) => !UNIVERSITY_CLASSROOM_SET.has(String(room.roomNumber || room.name || '').toUpperCase())
        );

    if (needsClassroomSync) {
        const roomNames = DEFAULT_CLASSROOMS.map((room) => room.name);
        await Classroom.deleteMany({
            $or: [{ type: 'classroom' }, { name: { $in: roomNames } }],
        });
        await Classroom.insertMany(DEFAULT_CLASSROOMS);
    }

    await syncTransportRoutes(TransportRoute);
    if (!labCount) {
        await LabSchedule.insertMany(DEFAULT_LAB_SLOTS);
    }
};

const getDashboardStats = async (_req, res) => {
    await ensureOperationalBaselines();

    const [classrooms, labs, routes, timetables, sections, facultyDocs, facultyUsers] = await Promise.all([
        Classroom.find(),
        LabSchedule.find().populate('faculty', 'name'),
        TransportRoute.find().sort({ routeName: 1 }),
        Timetable.find().populate('faculty', 'name'),
        Section.find(),
        Faculty.find(),
        User.find({ role: 'faculty' }).select('name'),
    ]);

    const { day, slot } = getCurrentDayAndSlot();
    const timetableEntries = extractAllTimetableEntries(timetables || []);
    const facultyWorkload = summarizeFacultyWorkload(timetableEntries);
    const dailyClassroomUtilization = summarizeDailyClassroomUtilization(timetableEntries);

    const facultyNameSet = new Set();
    (facultyDocs || []).forEach((item) => facultyNameSet.add(item.name));
    (facultyUsers || []).forEach((item) => facultyNameSet.add(item.name));
    facultyWorkload.forEach((item) => {
        if (item.faculty !== 'Unassigned') {
            facultyNameSet.add(item.faculty);
        }
    });

    const occupiedLabsFromSchedules = extractLabOccupancyRows(labs || [], day, slot).filter(
        (item) => item.status === 'Occupied'
    ).length;
    const occupiedLabsFromTimetable = countOccupiedByType(timetableEntries, day, slot, 'lab');

    const transportRouteUtilization = (routes || []).map((route) => ({
        routeName: route.routeName,
        utilization: Number(route.currentUtilization) || 0,
    }));

    res.json({
        success: true,
        stats: {
            totalFaculties: facultyNameSet.size,
            totalClassrooms: (classrooms || []).filter((item) => item.type !== 'lab').length,
            totalLabs: (classrooms || []).filter((item) => item.type === 'lab').length || (labs || []).length,
            totalSections: (sections || []).length || new Set((timetables || []).map((item) => item.sectionCode)).size,
            activeBuses: (routes || []).filter((item) => item.status === 'active').length,
            occupiedClassrooms: countOccupiedByType(timetableEntries, day, slot, 'classroom'),
            occupiedLabs: Math.max(occupiedLabsFromSchedules, occupiedLabsFromTimetable),
            dailyClassroomUtilization,
            facultyWorkloadDistribution: facultyWorkload,
            transportRouteUtilization,
            currentWindow: {
                day,
                slot,
            },
        },
    });
};

const getFacultyDashboardStats = async (req, res) => {
    const [timetables, labs] = await Promise.all([
        Timetable.find().populate('faculty', 'name email'),
        LabSchedule.find().populate('faculty', 'name email'),
    ]);

    const allEntries = extractAllTimetableEntries(timetables || []);
    const userEmail = String(req.user?.email || '').toLowerCase();
    const userName = normalizeName(req.user?.name);
    const weekOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const myEntries = allEntries.filter((entry) =>
        (entry.facultyNames || []).some((name) => normalizeName(name) === userName)
    );

    const dayCounts = myEntries.reduce((acc, entry) => {
        acc[entry.day] = (acc[entry.day] || 0) + 1;
        return acc;
    }, {});

    const weeklyTeachingLoad = weekOrder
        .filter((day) => dayCounts[day] !== undefined)
        .map((day) => ({ day, sessions: dayCounts[day] || 0 }));

    const myLabCount = (labs || []).filter(
        (lab) => String(lab.faculty?.email || '').toLowerCase() === userEmail
    ).length;

    res.json({
        success: true,
        stats: {
            totalWeeklySessions: myEntries.length,
            assignedLabs: myLabCount,
            teachingDaysPerWeek: Object.keys(dayCounts).length,
            weeklyTeachingLoadDistribution: weeklyTeachingLoad,
        },
    });
};

module.exports = { getDashboardStats, getFacultyDashboardStats };
