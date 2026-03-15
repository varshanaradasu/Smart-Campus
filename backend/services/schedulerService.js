const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const { buildUniversityClassrooms } = require('./classroomDatasetService');
const SLOT_KEYS = [
    '8:15-9:05',
    '9:05-9:55',
    '9:55-10:10',
    '10:10-11:00',
    '11:00-11:50',
    '11:50-12:40',
    '12:40-1:40',
    '1:40-2:30',
    '2:30-3:20',
    '3:20-4:05',
];

const FIXED_BLOCKS = {
    '9:55-10:10': 'BREAK',
    '12:40-1:40': 'LUNCH',
};

const TEACHING_SLOT_KEYS = SLOT_KEYS.filter((slot) => !FIXED_BLOCKS[slot]);
const TEACHING_SLOT_GROUPS = [
    ['8:15-9:05', '9:05-9:55'],
    ['10:10-11:00', '11:00-11:50', '11:50-12:40'],
    ['1:40-2:30', '2:30-3:20', '3:20-4:05'],
];

const DEFAULT_CSE3_SECTIONS = Array.from({ length: 19 }, (_, index) => ({
    code: `CSE_3${String.fromCharCode(65 + index)}`,
    year: 3,
    section: String.fromCharCode(65 + index),
    department: 'CSE',
    strength: 60,
}));

const VIGNAN_SECTIONS = [...DEFAULT_CSE3_SECTIONS];

const VIGNAN_CLASSROOMS = buildUniversityClassrooms();

const VIGNAN_FACULTY = [
    { name: 'Dr. S. Kumar', shortCode: 'SKU', department: 'CSE', subjects: ['ML', 'SE'] },
    { name: 'Ms. V. Anusha', shortCode: 'VAN', department: 'CSE', subjects: ['CNS', 'CNS-L'] },
    { name: 'Mr. Mohan Venkateswara Rao', shortCode: 'MVR', department: 'CSE', subjects: ['SE', 'SE-L'] },
    { name: 'Mr. Sk Jani', shortCode: 'SKJ', department: 'CSE', subjects: ['PDC', 'PDC-T'] },
    { name: 'Ms. Priya Bharathi', shortCode: 'PBR', department: 'CSE', subjects: ['HONOUR', 'CSA', 'CSA-L'] },
    { name: 'Mr. Raju Kiran', shortCode: 'RKI', department: 'CSE', subjects: ['OE', 'QALR'] },
];

const VIGNAN_COURSES = [
    { code: 'ML', title: 'Machine Learning', weeklySlots: 3, durationSlots: 1 },
    { code: 'CNS', title: 'Computer Networks', weeklySlots: 3, durationSlots: 1 },
    { code: 'SE', title: 'Software Engineering', weeklySlots: 3, durationSlots: 1 },
    { code: 'PDC', title: 'Professional Development Course', weeklySlots: 2, durationSlots: 1 },
    { code: 'OE', title: 'Open Elective', weeklySlots: 2, durationSlots: 2 },
];

const DEFAULT_SUBJECT_WEEKLY_SLOTS = {
    ML: 3,
    'ML-L': 2,
    CNS: 3,
    'CNS-L': 2,
    SE: 3,
    'SE-L': 2,
    PDC: 2,
    'PDC-T': 2,
    OE: 2,
    'VERBAL TRAINING': 2,
    QALR: 2,
    TRAINING: 2,
    CSA: 3,
    'CSA-L': 2,
    HONOUR: 2,
};

const DEFAULT_SUBJECT_DURATION = {
    OE: 2,
    'VERBAL TRAINING': 2,
    'ML-L': 2,
    'CNS-L': 2,
    'SE-L': 2,
    'CSA-L': 2,
};

const SECTION_COURSE_PLAN = Object.fromEntries(
    DEFAULT_CSE3_SECTIONS.map((section) => [section.code, ['ML', 'CNS', 'SE', 'PDC', 'OE']])
);

const COURSE_FACULTY_MAP = {
    ML: 'Dr. S. Kumar',
    CNS: 'Ms. V. Anusha',
    SE: 'Mr. Mohan Venkateswara Rao',
    PDC: 'Mr. Sk Jani',
    OE: 'Mr. Raju Kiran',
};

const normalizeText = (value) => String(value || '').trim();
const normalizeKey = (value) => normalizeText(value).toUpperCase();

const DAY_ALIASES = {
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

const normalizeDay = (dayValue) => DAY_ALIASES[normalizeKey(dayValue)] || null;

const normalizeSlot = (slotValue) => {
    const raw = normalizeText(slotValue);
    if (!raw) return null;

    const compact = raw.replace(/\s+/g, '').replace(/\./g, ':');
    const matched = SLOT_KEYS.find((slot) => slot.replace(/\s+/g, '') === compact);
    return matched || null;
};

const toSlotKey = (day, slot) => `${day}|${slot}`;

const getAllTeachingSlotKeys = () => {
    const keys = [];
    DAYS.forEach((day) => {
        TEACHING_SLOT_KEYS.forEach((slot) => {
            keys.push(toSlotKey(day, slot));
        });
    });
    return keys;
};

const initializeSectionGrid = () => {
    const grid = {};
    DAYS.forEach((day) => {
        grid[day] = {};
        SLOT_KEYS.forEach((slot) => {
            grid[day][slot] = FIXED_BLOCKS[slot] || '';
        });
    });
    return grid;
};

const buildAvailabilitySet = (availableSlots) => {
    const full = new Set(getAllTeachingSlotKeys());
    if (!Array.isArray(availableSlots) || !availableSlots.length) {
        return full;
    }

    const result = new Set();
    availableSlots.forEach((entry) => {
        if (typeof entry === 'string') {
            const value = normalizeText(entry);
            if (!value) return;

            if (value.includes('|')) {
                const [dayRaw, slotRaw] = value.split('|');
                const day = normalizeDay(dayRaw);
                const slot = normalizeSlot(slotRaw);
                if (day && slot && !FIXED_BLOCKS[slot]) {
                    result.add(toSlotKey(day, slot));
                }
                return;
            }

            const parts = value.split(/\s+/);
            if (parts.length >= 2) {
                const day = normalizeDay(parts[0]);
                const slot = normalizeSlot(parts.slice(1).join(' '));
                if (day && slot && !FIXED_BLOCKS[slot]) {
                    result.add(toSlotKey(day, slot));
                }
            }
            return;
        }

        if (!entry || typeof entry !== 'object') return;

        const day = normalizeDay(entry.day);
        const slot = normalizeSlot(entry.slot || `${entry.start || ''}-${entry.end || ''}`);
        if (day && slot && !FIXED_BLOCKS[slot]) {
            result.add(toSlotKey(day, slot));
        }
    });

    return result.size ? result : full;
};

const normalizeSectionSubjects = (subjects) => {
    if (!Array.isArray(subjects)) return [];

    return subjects
        .map((subjectEntry) => {
            if (typeof subjectEntry === 'string') {
                const code = normalizeKey(subjectEntry);
                if (!code) return null;
                return {
                    code,
                    weeklySlots: DEFAULT_SUBJECT_WEEKLY_SLOTS[code] || 2,
                    durationSlots: DEFAULT_SUBJECT_DURATION[code] || 1,
                };
            }

            if (!subjectEntry || typeof subjectEntry !== 'object') return null;

            const code = normalizeKey(subjectEntry.code || subjectEntry.name || subjectEntry.subject);
            if (!code) return null;

            const weeklySlotsRaw = Number(subjectEntry.weeklySlots || subjectEntry.periodsPerWeek || subjectEntry.count || 2);
            const durationRaw = Number(subjectEntry.durationSlots || subjectEntry.duration || DEFAULT_SUBJECT_DURATION[code] || 1);

            return {
                code,
                weeklySlots: Number.isFinite(weeklySlotsRaw) && weeklySlotsRaw > 0 ? Math.floor(weeklySlotsRaw) : 2,
                durationSlots: Number.isFinite(durationRaw) && durationRaw > 0 ? Math.floor(durationRaw) : 1,
            };
        })
        .filter(Boolean);
};

const normalizeSubjectCodeList = (subjects) => {
    if (!Array.isArray(subjects)) return [];

    return Array.from(
        new Set(
            subjects
                .map((entry) => {
                    if (typeof entry === 'string') return normalizeKey(entry);
                    if (!entry || typeof entry !== 'object') return '';
                    return normalizeKey(entry.code || entry.name || entry.subject);
                })
                .filter(Boolean)
        )
    );
};

const normalizeInputs = ({ faculties = [], classrooms = [], sections = [] }) => {
    const normalizedFaculties = (faculties || [])
        .map((faculty) => {
            const name = normalizeText(faculty.name);
            if (!name) return null;
            const subjects = Array.isArray(faculty.subjects)
                ? Array.from(new Set(faculty.subjects.map((subject) => normalizeKey(subject)).filter(Boolean)))
                : [];

            return {
                name,
                subjects,
                availableSlots: buildAvailabilitySet(faculty.availableSlots),
            };
        })
        .filter(Boolean);

    const normalizedClassrooms = (classrooms || [])
        .map((room) => {
            const roomNumber = normalizeText(room.roomNumber || room.name);
            if (!roomNumber) return null;
            const capacityRaw = Number(room.capacity);

            return {
                roomNumber,
                capacity: Number.isFinite(capacityRaw) && capacityRaw > 0 ? capacityRaw : 60,
                availableSlots: buildAvailabilitySet(room.availableSlots),
            };
        })
        .filter(Boolean);

    const normalizedSections = (sections || [])
        .map((section) => {
            const sectionName = normalizeKey(section.sectionName || section.code || section.section);
            if (!sectionName) return null;

            const subjects = normalizeSectionSubjects(section.subjects);
            if (!subjects.length) return null;

            const strengthRaw = Number(section.strength || section.capacity || 60);

            return {
                sectionName,
                year: Number(section.year) || 3,
                branch: normalizeKey(section.branch || section.department || 'CSE'),
                strength: Number.isFinite(strengthRaw) && strengthRaw > 0 ? strengthRaw : 60,
                subjects,
            };
        })
        .filter(Boolean);

    return {
        faculties: normalizedFaculties,
        classrooms: normalizedClassrooms,
        sections: normalizedSections,
    };
};

const getSlotSequence = (startSlot, durationSlots) => {
    if (!durationSlots || durationSlots < 1) return null;

    const group = TEACHING_SLOT_GROUPS.find((slots) => slots.includes(startSlot));
    if (!group) return null;

    const startIndex = group.indexOf(startSlot);
    const sequence = group.slice(startIndex, startIndex + durationSlots);
    return sequence.length === durationSlots ? sequence : null;
};

const createSessionQueue = (sections) => {
    const queue = [];

    sections.forEach((section) => {
        section.subjects.forEach((subjectPlan) => {
            for (let count = 0; count < subjectPlan.weeklySlots; count += 1) {
                queue.push({
                    sectionName: section.sectionName,
                    year: section.year,
                    branch: section.branch,
                    strength: section.strength,
                    subject: subjectPlan.code,
                    durationSlots: subjectPlan.durationSlots,
                });
            }
        });
    });

    return queue;
};

const getSectionLoadByDay = (grid, day) => {
    return TEACHING_SLOT_KEYS.filter((slot) => normalizeText(grid[day][slot])).length;
};

const wouldExceedFacultyConsecutiveLimit = (facultyDaySlots, day, slotIndexes, limit = 2) => {
    const existing = facultyDaySlots?.[day] ? new Set(facultyDaySlots[day]) : new Set();
    slotIndexes.forEach((index) => existing.add(index));

    const sorted = Array.from(existing).sort((a, b) => a - b);
    let run = 1;
    let maxRun = sorted.length ? 1 : 0;

    for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i] === sorted[i - 1] + 1) {
            run += 1;
            maxRun = Math.max(maxRun, run);
        } else {
            run = 1;
        }
    }

    return maxRun > limit;
};

const generateConstraintTimetables = ({ faculties, classrooms, sections }) => {
    const normalized = normalizeInputs({ faculties, classrooms, sections });
    const allTeachingSlots = getAllTeachingSlotKeys();

    if (!normalized.faculties.length) {
        throw new Error('At least one faculty is required for generation');
    }
    if (!normalized.classrooms.length) {
        throw new Error('At least one classroom is required for generation');
    }
    if (!normalized.sections.length) {
        throw new Error('At least one section with subjects is required for generation');
    }

    const sectionByName = Object.fromEntries(normalized.sections.map((section) => [section.sectionName, section]));

    const sectionGrids = {};
    normalized.sections.forEach((section) => {
        sectionGrids[section.sectionName] = initializeSectionGrid();
    });

    const facultyBusy = {};
    const facultyDaySlots = {};
    const facultyLoad = {};
    normalized.faculties.forEach((faculty) => {
        facultyBusy[faculty.name] = new Set();
        facultyDaySlots[faculty.name] = {};
        DAYS.forEach((day) => {
            facultyDaySlots[faculty.name][day] = new Set();
        });
        facultyLoad[faculty.name] = 0;
    });

    const roomBusy = {};
    const roomUsage = {};
    normalized.classrooms.forEach((room) => {
        roomBusy[room.roomNumber] = new Set();
        roomUsage[room.roomNumber] = 0;
    });

    const entriesBySection = {};
    const facultyDetailsBySection = {};
    const subjectUsageBySection = {};
    const subjectTargetsBySection = {};
    normalized.sections.forEach((section) => {
        entriesBySection[section.sectionName] = [];
        facultyDetailsBySection[section.sectionName] = new Map();
        subjectUsageBySection[section.sectionName] = {};
        subjectTargetsBySection[section.sectionName] = {};
        section.subjects.forEach((subjectPlan) => {
            subjectUsageBySection[section.sectionName][subjectPlan.code] = 0;
            subjectTargetsBySection[section.sectionName][subjectPlan.code] =
                Math.max(1, subjectPlan.weeklySlots * Math.max(1, subjectPlan.durationSlots || 1));
        });
    });

    const sessionQueue = createSessionQueue(normalized.sections).sort((a, b) => {
        if (b.durationSlots !== a.durationSlots) return b.durationSlots - a.durationSlots;

        const aFacultyCount = normalized.faculties.filter((faculty) => faculty.subjects.includes(a.subject)).length;
        const bFacultyCount = normalized.faculties.filter((faculty) => faculty.subjects.includes(b.subject)).length;
        return aFacultyCount - bFacultyCount;
    });

    const unresolved = [];

    const tryAssignSession = (session, strictConsecutiveRule) => {
        const section = sectionByName[session.sectionName];
        const grid = sectionGrids[session.sectionName];

        const dayOrder = [...DAYS].sort((left, right) => getSectionLoadByDay(grid, left) - getSectionLoadByDay(grid, right));

        for (const day of dayOrder) {
            for (const startSlot of TEACHING_SLOT_KEYS) {
                const slotSequence = getSlotSequence(startSlot, session.durationSlots);
                if (!slotSequence) continue;

                const sequenceKeys = slotSequence.map((slot) => toSlotKey(day, slot));
                if (!slotSequence.every((slot) => !normalizeText(grid[day][slot]))) {
                    continue;
                }

                const slotIndexes = slotSequence.map((slot) => TEACHING_SLOT_KEYS.indexOf(slot));

                const facultyCandidates = normalized.faculties
                    .filter((faculty) => faculty.subjects.includes(session.subject))
                    .filter((faculty) =>
                        sequenceKeys.every((key) => faculty.availableSlots.has(key) && !facultyBusy[faculty.name].has(key))
                    )
                    .filter((faculty) =>
                        !strictConsecutiveRule
                            ? true
                            : !wouldExceedFacultyConsecutiveLimit(facultyDaySlots[faculty.name], day, slotIndexes, 2)
                    )
                    .sort((left, right) => facultyLoad[left.name] - facultyLoad[right.name]);

                if (!facultyCandidates.length) {
                    continue;
                }

                const roomCandidates = normalized.classrooms
                    .filter((room) => room.capacity >= section.strength)
                    .filter((room) => sequenceKeys.every((key) => room.availableSlots.has(key) && !roomBusy[room.roomNumber].has(key)))
                    .sort((left, right) => roomUsage[left.roomNumber] - roomUsage[right.roomNumber]);

                if (!roomCandidates.length) {
                    continue;
                }

                const faculty = facultyCandidates[0];
                const room = roomCandidates[0];

                slotSequence.forEach((slot) => {
                    const key = toSlotKey(day, slot);
                    grid[day][slot] = session.subject;
                    facultyBusy[faculty.name].add(key);
                    roomBusy[room.roomNumber].add(key);
                    facultyDaySlots[faculty.name][day].add(TEACHING_SLOT_KEYS.indexOf(slot));
                    facultyLoad[faculty.name] += 1;
                    roomUsage[room.roomNumber] += 1;
                    subjectUsageBySection[session.sectionName][session.subject] =
                        (subjectUsageBySection[session.sectionName][session.subject] || 0) + 1;

                    entriesBySection[session.sectionName].push({
                        section: session.sectionName,
                        day,
                        slot,
                        subject: session.subject,
                        faculty: faculty.name,
                        classroom: room.roomNumber,
                    });
                });

                const existing = facultyDetailsBySection[session.sectionName].get(session.subject) || new Set();
                existing.add(faculty.name);
                facultyDetailsBySection[session.sectionName].set(session.subject, existing);

                return true;
            }
        }

        return false;
    };

    sessionQueue.forEach((session) => {
        const assigned = tryAssignSession(session, true) || tryAssignSession(session, false);
        if (!assigned) {
            unresolved.push(session);
        }
    });

    const assignSlotWithSubjectPriority = ({ sectionName, day, slot, subjectCodes = [] }) => {
        const section = sectionByName[sectionName];
        const grid = sectionGrids[sectionName];
        const slotIndex = TEACHING_SLOT_KEYS.indexOf(slot);
        if (slotIndex === -1) return false;

        const key = toSlotKey(day, slot);

        for (const subjectCode of subjectCodes) {
            const facultyCandidates = normalized.faculties
                .filter((faculty) => faculty.subjects.includes(subjectCode))
                .filter((faculty) => faculty.availableSlots.has(key) && !facultyBusy[faculty.name].has(key))
                .filter(
                    (faculty) =>
                        !wouldExceedFacultyConsecutiveLimit(
                            facultyDaySlots[faculty.name],
                            day,
                            [slotIndex],
                            3
                        )
                )
                .sort((left, right) => facultyLoad[left.name] - facultyLoad[right.name]);

            if (!facultyCandidates.length) continue;

            const roomCandidates = normalized.classrooms
                .filter((room) => room.capacity >= section.strength)
                .filter((room) => room.availableSlots.has(key) && !roomBusy[room.roomNumber].has(key))
                .sort((left, right) => roomUsage[left.roomNumber] - roomUsage[right.roomNumber]);

            if (!roomCandidates.length) continue;

            const faculty = facultyCandidates[0];
            const room = roomCandidates[0];

            grid[day][slot] = subjectCode;
            facultyBusy[faculty.name].add(key);
            roomBusy[room.roomNumber].add(key);
            facultyDaySlots[faculty.name][day].add(slotIndex);
            facultyLoad[faculty.name] += 1;
            roomUsage[room.roomNumber] += 1;
            subjectUsageBySection[sectionName][subjectCode] =
                (subjectUsageBySection[sectionName][subjectCode] || 0) + 1;

            entriesBySection[sectionName].push({
                section: sectionName,
                day,
                slot,
                subject: subjectCode,
                faculty: faculty.name,
                classroom: room.roomNumber,
            });

            const existing = facultyDetailsBySection[sectionName].get(subjectCode) || new Set();
            existing.add(faculty.name);
            facultyDetailsBySection[sectionName].set(subjectCode, existing);

            return true;
        }

        return false;
    };

    const tryFillSingleSlot = ({ sectionName, day, slot }) => {
        const section = sectionByName[sectionName];
        const subjectPriority = [...section.subjects]
            .map((subjectPlan) => {
                const used = subjectUsageBySection[sectionName][subjectPlan.code] || 0;
                const target = subjectTargetsBySection[sectionName][subjectPlan.code] || 1;
                return {
                    code: subjectPlan.code,
                    score: used / target,
                    used,
                };
            })
            .sort((left, right) => {
                if (left.score !== right.score) return left.score - right.score;
                return left.used - right.used;
            })
            .map((item) => item.code);

        return assignSlotWithSubjectPriority({
            sectionName,
            day,
            slot,
            subjectCodes: subjectPriority,
        });
    };

    const buildBalancedSubjectCycle = (sectionName) => {
        const section = sectionByName[sectionName];
        const subjects = Array.isArray(section?.subjects) ? section.subjects : [];

        return [...subjects]
            .map((subjectPlan) => {
                const used = subjectUsageBySection[sectionName][subjectPlan.code] || 0;
                const target = subjectTargetsBySection[sectionName][subjectPlan.code] || 1;
                return {
                    code: subjectPlan.code,
                    score: used / target,
                    used,
                };
            })
            .sort((left, right) => {
                if (left.score !== right.score) return left.score - right.score;
                return left.used - right.used;
            })
            .map((item) => item.code);
    };

    // Keep retrying to fill all teaching slots while respecting availability and conflict constraints.
    let changed = true;
    let safety = 0;
    while (changed && safety < 6) {
        changed = false;
        safety += 1;

        normalized.sections.forEach((section) => {
            const grid = sectionGrids[section.sectionName];
            DAYS.forEach((day) => {
                TEACHING_SLOT_KEYS.forEach((slot) => {
                    if (normalizeText(grid[day][slot])) return;
                    const assigned = tryFillSingleSlot({ sectionName: section.sectionName, day, slot });
                    if (assigned) changed = true;
                });
            });
        });
    }

    // Final non-empty guarantee for constrained datasets with balanced round-robin fallback.
    normalized.sections.forEach((section) => {
        const grid = sectionGrids[section.sectionName];
        const distinctSubjects = Array.from(new Set(section.subjects.map((subjectPlan) => subjectPlan.code).filter(Boolean)));
        const subjectsWithFaculty = distinctSubjects.filter((subjectCode) =>
            normalized.faculties.some((faculty) => Array.isArray(faculty.subjects) && faculty.subjects.includes(subjectCode))
        );
        const hasInsufficientConfig = distinctSubjects.length < 2 || subjectsWithFaculty.length < 2;

        if (hasInsufficientConfig) {
            console.warn(
                `Insufficient subject configuration for section ${section.sectionName} - using balanced fallback distribution.`
            );
        }

        let subjectCycle = buildBalancedSubjectCycle(section.sectionName);
        if (!subjectCycle.length) {
            subjectCycle = ['SUBJECT'];
        }
        let cycleIndex = 0;

        DAYS.forEach((day) => {
            TEACHING_SLOT_KEYS.forEach((slot) => {
                if (normalizeText(grid[day][slot])) return;

                const subject = subjectCycle[cycleIndex % subjectCycle.length];
                cycleIndex += 1;

                const assigned = assignSlotWithSubjectPriority({
                    sectionName: section.sectionName,
                    day,
                    slot,
                    subjectCodes: [
                        ...subjectCycle,
                        subject,
                    ],
                });
                if (assigned) return;

                grid[day][slot] = subject;
                subjectUsageBySection[section.sectionName][subject] =
                    (subjectUsageBySection[section.sectionName][subject] || 0) + 1;

                // Re-sort occasionally so under-used subjects stay prioritized in fallback.
                if (cycleIndex % subjectCycle.length === 0) {
                    subjectCycle = buildBalancedSubjectCycle(section.sectionName);
                    if (!subjectCycle.length) {
                        subjectCycle = ['SUBJECT'];
                    }
                }
            });
        });
    });

    const sectionsOutput = normalized.sections.map((section) => {
        const facultyDetails = Array.from(facultyDetailsBySection[section.sectionName].entries()).map(([subject, names]) => ({
            subject,
            faculty: Array.from(names),
        }));

        return {
            section: section.sectionName,
            year: section.year,
            branch: section.branch,
            timetable: sectionGrids[section.sectionName],
            entries: entriesBySection[section.sectionName],
            facultyDetails,
        };
    });

    return {
        mode: 'algorithmic',
        sections: sectionsOutput,
        entries: sectionsOutput.flatMap((section) => section.entries),
        unresolved,
        allTeachingSlots,
    };
};

const generateUniversityTimetables = async ({ sections, courses, faculties, classrooms }) => {
    const sectionInputs = (sections || []).map((section) => {
        const sectionName = normalizeKey(section.code || section.sectionName || section.section);
        const sectionProvidedSubjects = normalizeSubjectCodeList(section.subjects);
        const plannedSubjects =
            sectionProvidedSubjects.length > 0
                ? sectionProvidedSubjects
                : SECTION_COURSE_PLAN[sectionName] || (courses || []).slice(0, 5).map((course) => course.code);

        const subjects = plannedSubjects.map((code) => {
            const course = (courses || []).find((item) => normalizeKey(item.code) === normalizeKey(code));
            return {
                name: normalizeKey(code),
                weeklySlots: Number(course?.weeklySlots) || DEFAULT_SUBJECT_WEEKLY_SLOTS[normalizeKey(code)] || 2,
                durationSlots: Number(course?.durationSlots) || DEFAULT_SUBJECT_DURATION[normalizeKey(code)] || 1,
            };
        });

        return {
            sectionName,
            year: section.year || 3,
            branch: section.department || section.branch || 'CSE',
            strength: section.strength || 60,
            subjects,
        };
    });

    const facultyInputs = (faculties || []).map((faculty) => ({
        name: faculty.name,
        subjects: normalizeSubjectCodeList(faculty.subjects).length
            ? normalizeSubjectCodeList(faculty.subjects)
            : Object.entries(COURSE_FACULTY_MAP)
                .filter(([, owner]) => owner === faculty.name)
                .map(([subject]) => subject),
        availableSlots: getAllTeachingSlotKeys(),
    }));

    const classroomInputs = (classrooms || []).map((room) => ({
        roomNumber: room.roomNumber || room.name,
        capacity: room.capacity || 60,
        availableSlots: getAllTeachingSlotKeys(),
    }));

    const scheduled = generateConstraintTimetables({
        faculties: facultyInputs,
        classrooms: classroomInputs,
        sections: sectionInputs,
    });

    return {
        mode: scheduled.mode,
        grids: Object.fromEntries(scheduled.sections.map((section) => [section.section, section.timetable])),
        entriesBySection: Object.fromEntries(scheduled.sections.map((section) => [section.section, section.entries])),
        facultyDetailsBySection: Object.fromEntries(
            scheduled.sections.map((section) => [section.section, section.facultyDetails])
        ),
        unresolved: scheduled.unresolved,
    };
};

const createDemoClassrooms = () => [...VIGNAN_CLASSROOMS];

const generateClassroomAllocationRequests = () => [
    { course: 'SE', studentCount: 60 },
    { course: 'CNS', studentCount: 58 },
    { course: 'ML', studentCount: 55 },
    { course: 'PDC', studentCount: 57 },
];

const generateDemoTimetableRecords = ({ classrooms = [], facultyMembers = [], count = 20 }) => {
    const result = [];
    if (!classrooms.length || !facultyMembers.length) return result;

    for (let index = 0; index < count; index += 1) {
        const room = classrooms[index % classrooms.length];
        const faculty = facultyMembers[index % facultyMembers.length];
        result.push({
            course: VIGNAN_COURSES[index % VIGNAN_COURSES.length].code,
            department: 'CSE',
            semester: 5,
            faculty: faculty._id,
            classroom: room._id,
            day: DAYS[index % DAYS.length],
            timeSlot: TEACHING_SLOT_KEYS[index % TEACHING_SLOT_KEYS.length],
            labRequired: false,
        });
    }

    return result;
};

const generateDemoLabSchedules = ({ facultyMembers = [], count = 8 }) => {
    const result = [];
    if (!facultyMembers.length) return result;

    for (let index = 0; index < count; index += 1) {
        const faculty = facultyMembers[index % facultyMembers.length];
        result.push({
            labName: 'CSE Lab',
            department: 'CSE',
            subject: 'ML-L',
            faculty: faculty._id,
            day: DAYS[index % DAYS.length],
            timeSlot: TEACHING_SLOT_KEYS[index % TEACHING_SLOT_KEYS.length],
            batch: `Batch-${String.fromCharCode(65 + (index % 4))}`,
            equipmentNeeds: ['Systems', 'Projector'],
        });
    }

    return result;
};

module.exports = {
    DAYS,
    SLOT_KEYS,
    FIXED_BLOCKS,
    VIGNAN_SECTIONS,
    VIGNAN_CLASSROOMS,
    VIGNAN_FACULTY,
    VIGNAN_COURSES,
    generateConstraintTimetables,
    generateUniversityTimetables,
    generateDemoTimetableRecords,
    generateDemoLabSchedules,
    generateClassroomAllocationRequests,
    createDemoClassrooms,
};
