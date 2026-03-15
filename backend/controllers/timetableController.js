const Timetable = require('../models/Timetable');
const Classroom = require('../models/Classroom');
const LabSchedule = require('../models/LabSchedule');
const User = require('../models/User');
const {
    createDemoClassrooms,
    generateDemoLabSchedules,
    generateDemoTimetableRecords,
} = require('../services/schedulerService');

const getTimetables = async (req, res) => {
    const filter = req.user.role === 'faculty' ? { faculty: req.user._id } : {};

    const timetables = await Timetable.find(filter)
        .populate('faculty', 'name email department')
        .populate('classroom', 'name building capacity type')
        .sort({ day: 1, timeSlot: 1 });

    res.json({ success: true, data: timetables });
};

const generateTimetables = async (req, res) => {
    const facultyMembers = await User.find({ role: 'faculty' });

    if (!facultyMembers.length) {
        res.status(400);
        throw new Error('No faculty found. Seed faculty data first.');
    }

    let classrooms = await Classroom.find();
    if (!classrooms.length) {
        const classroomPayload = createDemoClassrooms();
        classrooms = await Classroom.insertMany(classroomPayload);
    }

    const generatedPlan = generateDemoTimetableRecords({
        classrooms,
        facultyMembers,
        count: 30,
    });

    const generatedLabs = generateDemoLabSchedules({
        facultyMembers,
        count: 12,
    });

    await Timetable.deleteMany({});
    await LabSchedule.deleteMany({});

    const records = await Timetable.insertMany(generatedPlan);
    await LabSchedule.insertMany(generatedLabs);

    res.status(201).json({
        success: true,
        message: 'Demo timetable and lab schedules generated successfully',
        data: records,
    });
};

module.exports = { getTimetables, generateTimetables };
