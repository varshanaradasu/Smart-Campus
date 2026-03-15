const Classroom = require('../models/Classroom');
const Timetable = require('../models/Timetable');
const { optimizeClassroomAllocation } = require('../services/optimizationService');
const {
    getCurrentDayAndSlot,
    extractAllTimetableEntries,
    findCurrentEntryForRoom,
} = require('../services/operationalDataService');
const {
    UNIVERSITY_CLASSROOM_SET,
    buildUniversityClassrooms,
    isValidUniversityClassroom,
    getFloorFromRoomNumber,
    compareClassroomNumbers,
} = require('../services/classroomDatasetService');

const DEFAULT_CLASSROOMS = buildUniversityClassrooms();

const syncUniversityClassrooms = async () => {
    const baseline = DEFAULT_CLASSROOMS;
    const existing = await Classroom.find({ type: 'classroom' }).select('roomNumber name');
    const isAlreadySynced =
        existing.length === baseline.length &&
        existing.every((room) => UNIVERSITY_CLASSROOM_SET.has(String(room.roomNumber || room.name || '').toUpperCase()));

    if (isAlreadySynced) {
        return;
    }

    const roomNames = baseline.map((room) => room.name);

    await Classroom.deleteMany({
        $or: [{ type: 'classroom' }, { name: { $in: roomNames } }],
    });
    await Classroom.insertMany(baseline);
};

const ensureBaselineClassrooms = async () => {
    await syncUniversityClassrooms();
    return Classroom.find();
};

const getClassrooms = async (_req, res) => {
    const [classrooms, timetableDocs] = await Promise.all([ensureBaselineClassrooms(), Timetable.find()]);
    const { day, slot } = getCurrentDayAndSlot();
    const entries = extractAllTimetableEntries(timetableDocs || []);

    const rows = (classrooms || [])
        .filter((room) => room.type === 'classroom' && isValidUniversityClassroom(room.roomNumber || room.name))
        .sort((a, b) => compareClassroomNumbers(a.roomNumber || a.name, b.roomNumber || b.name))
        .map((room) => {
            const roomCode = room.roomNumber || room.name;
            const currentEntry = findCurrentEntryForRoom(entries, day, slot, roomCode);
            return {
                _id: room._id,
                roomNumber: roomCode,
                floor: getFloorFromRoomNumber(roomCode) || '-',
                capacity: room.capacity,
                status: currentEntry ? 'Occupied' : 'Vacant',
                currentSection: currentEntry?.sectionCode || '-',
                subject: currentEntry?.subject || '-',
                faculty: (currentEntry?.facultyNames || []).join(', ') || '-',
            };
        });

    res.json({ success: true, data: rows });
};

const createClassroom = async (req, res) => {
    const roomNumber = String(req.body.roomNumber || '').trim().toUpperCase();
    if (!isValidUniversityClassroom(roomNumber)) {
        res.status(400);
        throw new Error('Invalid classroom number. Allowed range is N-201 to N-219, N-301 to N-319, N-401 to N-419, N-501 to N-519, N-601 to N-619.');
    }

    const classroom = await Classroom.create({
        ...req.body,
        roomNumber,
        name: roomNumber,
        building: 'N Block',
        capacity: 60,
        type: 'classroom',
        status: 'Vacant',
    });
    res.status(201).json({ success: true, data: classroom });
};

const updateClassroom = async (req, res) => {
    if (Object.prototype.hasOwnProperty.call(req.body, 'roomNumber')) {
        const roomNumber = String(req.body.roomNumber || '').trim().toUpperCase();
        if (!isValidUniversityClassroom(roomNumber)) {
            res.status(400);
            throw new Error('Invalid classroom number. Allowed range is N-201 to N-219, N-301 to N-319, N-401 to N-419, N-501 to N-519, N-601 to N-619.');
        }

        req.body.roomNumber = roomNumber;
        req.body.name = roomNumber;
        req.body.type = 'classroom';
        req.body.capacity = 60;
        req.body.building = 'N Block';
    }

    const classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!classroom) {
        res.status(404);
        throw new Error('Classroom not found');
    }

    res.json({ success: true, data: classroom });
};

const deleteClassroom = async (req, res) => {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
        res.status(404);
        throw new Error('Classroom not found');
    }

    await classroom.deleteOne();
    res.json({ success: true, message: 'Classroom deleted' });
};

const optimizeAllocation = async (req, res) => {
    const classrooms = await ensureBaselineClassrooms();
    const requests = Array.isArray(req.body.requests) ? req.body.requests : [];
    const result = optimizeClassroomAllocation(
        requests,
        classrooms.filter((room) => room.type === 'classroom' && isValidUniversityClassroom(room.roomNumber || room.name))
    );
    res.json({ success: true, data: result });
};

module.exports = {
    getClassrooms,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    optimizeAllocation,
};
