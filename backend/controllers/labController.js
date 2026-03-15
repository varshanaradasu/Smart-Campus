const LabSchedule = require('../models/LabSchedule');
const Timetable = require('../models/Timetable');
const {
    getCurrentDayAndSlot,
    extractAllTimetableEntries,
    extractLabOccupancyRows,
    toDayCode,
} = require('../services/operationalDataService');

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

const ensureBaselineLabSchedules = async () => {
    const schedules = await LabSchedule.find();
    if (schedules.length) return schedules;

    // Baseline entries are created without a faculty reference so occupancy remains available even before assignments.
    await LabSchedule.insertMany(
        DEFAULT_LAB_SLOTS.map((item) => ({
            ...item,
            faculty: undefined,
            equipmentNeeds: ['Systems', 'Projector'],
        }))
    );

    return LabSchedule.find();
};

const getLabSchedules = async (_req, res) => {
    const [labSchedules, timetables] = await Promise.all([
        ensureBaselineLabSchedules(),
        Timetable.find().populate('faculty', 'name'),
    ]);

    const { day, slot } = getCurrentDayAndSlot();
    const timetableEntries = extractAllTimetableEntries(timetables || []);
    const rows = extractLabOccupancyRows(labSchedules || [], day, slot);

    const mergedRows = rows.map((row) => {
        const matched = timetableEntries.find(
            (entry) =>
                String(entry.classroom || '').toUpperCase() === String(row.labName || '').toUpperCase() &&
                entry.day === day &&
                entry.slot === slot
        );

        if (!matched) return row;

        return {
            ...row,
            status: 'Occupied',
            currentClass: matched.subject || row.currentClass,
            facultyName: matched.facultyNames?.[0] || row.facultyName,
        };
    });

    res.json({ success: true, data: mergedRows });
};

const createLabSchedule = async (req, res) => {
    const payload = {
        ...req.body,
        day: toDayCode(req.body.day) || req.body.day,
    };
    const schedule = await LabSchedule.create(payload);
    res.status(201).json({ success: true, data: schedule });
};

const updateLabSchedule = async (req, res) => {
    const payload = {
        ...req.body,
        day: toDayCode(req.body.day) || req.body.day,
    };

    const schedule = await LabSchedule.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true,
    });

    if (!schedule) {
        res.status(404);
        throw new Error('Lab schedule not found');
    }

    res.json({ success: true, data: schedule });
};

const deleteLabSchedule = async (req, res) => {
    const schedule = await LabSchedule.findById(req.params.id);
    if (!schedule) {
        res.status(404);
        throw new Error('Lab schedule not found');
    }

    await schedule.deleteOne();
    res.json({ success: true, message: 'Lab schedule deleted' });
};

module.exports = {
    getLabSchedules,
    createLabSchedule,
    updateLabSchedule,
    deleteLabSchedule,
};
