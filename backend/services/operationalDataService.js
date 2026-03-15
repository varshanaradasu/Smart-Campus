const { DAYS, SLOT_KEYS, FIXED_BLOCKS } = require('./schedulerService');
const { UNIVERSITY_CLASSROOM_NUMBERS, UNIVERSITY_CLASSROOM_SET } = require('./classroomDatasetService');

const DAY_ALIAS = {
    SUN: 'SUN',
    SUNDAY: 'SUN',
    MON: 'MON',
    MONDAY: 'MON',
    TUE: 'TUE',
    TUESDAY: 'TUE',
    WED: 'WED',
    WEDNESDAY: 'WED',
    THU: 'THU',
    THUR: 'THU',
    THURS: 'THU',
    THURSDAY: 'THU',
    FRI: 'FRI',
    FRIDAY: 'FRI',
    SAT: 'SAT',
    SATURDAY: 'SAT',
};

const CLASSROOM_ROTATION = [...UNIVERSITY_CLASSROOM_NUMBERS];
const LAB_ROTATION = ['AI Lab', 'Networks Lab', 'Data Science Lab', 'Embedded Systems Lab', 'Operating Systems Lab'];

const normalizeName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const sectionIndexFromCode = (sectionCode) => {
    const raw = String(sectionCode || '').toUpperCase();
    const letterMatch = raw.match(/([A-Z])$/);
    if (letterMatch) {
        return Math.max(0, letterMatch[1].charCodeAt(0) - 65);
    }

    const numMatch = raw.match(/(\d{1,2})$/);
    if (numMatch) {
        return Math.max(0, Number(numMatch[1]) - 1);
    }

    return 0;
};

const isLabSubject = (subject) => {
    const normalized = String(subject || '').toUpperCase();
    return (
        normalized.includes('-L') ||
        normalized.includes(' LAB') ||
        normalized.endsWith('LAB') ||
        normalized.includes('PRACTICAL')
    );
};

const deriveRoomFromEntry = ({ sectionCode, subject }) => {
    const sectionIndex = sectionIndexFromCode(sectionCode);
    if (isLabSubject(subject)) {
        return LAB_ROTATION[sectionIndex % LAB_ROTATION.length];
    }
    return CLASSROOM_ROTATION[sectionIndex % CLASSROOM_ROTATION.length];
};

const parseClockMinutes = (value) => {
    const [h, m] = String(value || '')
        .trim()
        .split(':')
        .map((part) => Number(part));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
};

const parseSlotRange = (slot) => {
    const [startRaw, endRaw] = String(slot || '').split('-').map((part) => part.trim());
    const start = parseClockMinutes(startRaw);
    const end = parseClockMinutes(endRaw);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return { start, end };
};

const toDayCode = (value) => DAY_ALIAS[String(value || '').trim().toUpperCase()] || null;

const getCurrentDayAndSlot = (date = new Date()) => {
    const jsDay = date.getDay();
    const dayCode = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][jsDay];
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    const matchedSlot = SLOT_KEYS.find((slot) => {
        const range = parseSlotRange(slot);
        if (!range) return false;
        return currentMinutes >= range.start && currentMinutes < range.end;
    });

    return {
        day: dayCode,
        slot: matchedSlot || null,
    };
};

const isClassroomRoom = (roomName) => {
    const normalized = String(roomName || '').toUpperCase();
    if (!normalized) return false;
    return UNIVERSITY_CLASSROOM_SET.has(normalized);
};

const isLabRoom = (roomName) => {
    const normalized = String(roomName || '').toUpperCase();
    return normalized.includes('LAB');
};

const buildFacultyMapForSection = (facultyDetails = []) => {
    const map = new Map();
    (facultyDetails || []).forEach((item) => {
        const subject = String(item?.subject || '').trim().toUpperCase();
        if (!subject) return;
        const facultyNames = Array.isArray(item?.faculty)
            ? item.faculty.filter(Boolean).map((name) => String(name).trim())
            : String(item?.faculty || '')
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean);
        if (!facultyNames.length) return;
        map.set(subject, facultyNames);
    });
    return map;
};

const extractSectionTimetableEntries = (doc) => {
    const sectionCode = doc.sectionCode || doc.sectionName || doc.section || 'UNKNOWN';
    const timetable = doc.timetable || doc.days || {};
    const sectionFacultyMap = buildFacultyMapForSection(doc.facultyDetails || []);
    const entries = [];

    Object.entries(timetable || {}).forEach(([dayRaw, slots]) => {
        const day = toDayCode(dayRaw);
        if (!day || !slots || typeof slots !== 'object') return;

        Object.entries(slots).forEach(([slot, rawSubject]) => {
            const subject = String(rawSubject || '').trim();
            if (!subject || FIXED_BLOCKS[slot] || subject.toUpperCase() === 'BREAK' || subject.toUpperCase() === 'LUNCH') {
                return;
            }

            const facultyNames = sectionFacultyMap.get(subject.toUpperCase()) || [];
            entries.push({
                sectionCode,
                day,
                slot,
                subject,
                facultyNames,
                classroom: deriveRoomFromEntry({ sectionCode, subject }),
            });
        });
    });

    return entries;
};

const extractLegacyTimetableEntries = (doc) => {
    const day = toDayCode(doc.day);
    const slot = String(doc.timeSlot || '').trim();
    if (!day || !slot || FIXED_BLOCKS[slot]) return [];

    const classroomValue =
        (doc.classroom && (doc.classroom.roomNumber || doc.classroom.name)) ||
        doc.roomNumber ||
        doc.room ||
        doc.classroomNumber ||
        null;

    const facultyName = doc.faculty?.name || null;
    return [
        {
            sectionCode: doc.sectionCode || doc.sectionName || 'UNKNOWN',
            day,
            slot,
            subject: doc.course || doc.subject || '',
            facultyNames: facultyName ? [facultyName] : [],
            classroom: classroomValue,
        },
    ];
};

const extractAllTimetableEntries = (docs = []) => {
    const output = [];
    docs.forEach((doc) => {
        if (doc && (doc.timetable || doc.days)) {
            output.push(...extractSectionTimetableEntries(doc));
            return;
        }
        output.push(...extractLegacyTimetableEntries(doc));
    });
    return output;
};

const extractLabOccupancyRows = (labSchedules = [], currentDay, currentSlot) => {
    return (labSchedules || []).map((schedule) => {
        const day = toDayCode(schedule.day);
        const slot = String(schedule.timeSlot || '').trim();
        const occupiedNow = day === currentDay && currentSlot && slot === currentSlot;

        return {
            id: String(schedule._id || `${schedule.labName}-${schedule.day}-${schedule.timeSlot}`),
            labName: schedule.labName,
            department: schedule.department,
            status: occupiedNow ? 'Occupied' : 'Vacant',
            currentClass: occupiedNow ? schedule.subject : '-',
            facultyName: occupiedNow
                ? schedule.faculty?.name || schedule.facultyName || 'TBA'
                : schedule.faculty?.name || schedule.facultyName || '-',
            day: schedule.day,
            timeSlot: schedule.timeSlot,
        };
    });
};

const summarizeFacultyWorkload = (entries = []) => {
    const counters = new Map();

    entries.forEach((entry) => {
        const names = Array.isArray(entry.facultyNames) && entry.facultyNames.length
            ? entry.facultyNames
            : ['Unassigned'];

        names.forEach((name) => {
            counters.set(name, (counters.get(name) || 0) + 1);
        });
    });

    return Array.from(counters.entries())
        .map(([faculty, sessions]) => ({
            faculty,
            sessions,
            loadBand: sessions > 18 ? 'High' : sessions >= 10 ? 'Balanced' : 'Low',
        }))
        .sort((a, b) => b.sessions - a.sessions);
};

const summarizeDailyClassroomUtilization = (entries = []) => {
    const dayMap = new Map(DAYS.map((day) => [day, 0]));

    entries.forEach((entry) => {
        if (!entry.classroom || !isClassroomRoom(entry.classroom)) return;
        dayMap.set(entry.day, (dayMap.get(entry.day) || 0) + 1);
    });

    return Array.from(dayMap.entries()).map(([day, sessions]) => ({ day, sessions }));
};

const countOccupiedByType = (entries = [], day, slot, type = 'classroom') => {
    if (!day || !slot) return 0;
    const uniqueRooms = new Set();

    entries.forEach((entry) => {
        if (entry.day !== day || entry.slot !== slot || !entry.classroom) return;
        if (type === 'lab' && !isLabRoom(entry.classroom)) return;
        if (type === 'classroom' && !isClassroomRoom(entry.classroom)) return;
        uniqueRooms.add(String(entry.classroom).toUpperCase());
    });

    return uniqueRooms.size;
};

const findCurrentSectionForRoom = (entries = [], day, slot, roomName) => {
    if (!day || !slot || !roomName) return null;
    const target = String(roomName).toUpperCase();
    const found = entries.find(
        (entry) =>
            entry.day === day &&
            entry.slot === slot &&
            entry.classroom &&
            String(entry.classroom).toUpperCase() === target
    );
    return found ? found.sectionCode : null;
};

const findCurrentEntryForRoom = (entries = [], day, slot, roomName) => {
    if (!day || !slot || !roomName) return null;
    const target = String(roomName).toUpperCase();
    return (
        entries.find(
            (entry) =>
                entry.day === day &&
                entry.slot === slot &&
                entry.classroom &&
                String(entry.classroom).toUpperCase() === target
        ) || null
    );
};

module.exports = {
    normalizeName,
    getCurrentDayAndSlot,
    extractAllTimetableEntries,
    extractLabOccupancyRows,
    summarizeFacultyWorkload,
    summarizeDailyClassroomUtilization,
    countOccupiedByType,
    findCurrentSectionForRoom,
    findCurrentEntryForRoom,
    isClassroomRoom,
    isLabRoom,
    toDayCode,
};