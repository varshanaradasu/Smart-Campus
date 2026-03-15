const Timetable = require('../models/Timetable');
const XLSX = require('xlsx');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Section = require('../models/Section');
const Classroom = require('../models/Classroom');
const {
    VIGNAN_CLASSROOMS,
    VIGNAN_COURSES,
    VIGNAN_FACULTY,
    VIGNAN_SECTIONS,
    generateConstraintTimetables,
    generateUniversityTimetables,
} = require('../services/schedulerService');
const {
    getDefaultCse3ExcelPath,
    parseCse3TimetableExcel,
} = require('../services/timetableImportService');

const formatSectionResponse = (doc) => ({
    section: doc.sectionCode,
    year: doc.year,
    branch: doc.branch,
    timetable: doc.timetable || doc.days,
    facultyDetails: doc.facultyDetails || [],
    entries: doc.entries || [],
    generationMode: doc.generationMode,
    updatedAt: doc.updatedAt,
});

const normalizeText = (value) => String(value || '').trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const parseJsonFile = (file) => {
    const raw = file.buffer.toString('utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
        throw new Error(`${file.fieldname} must contain a JSON array`);
    }
    return parsed;
};

const parseSpreadsheetFile = (file) => {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
};

const parseUploadFile = (file) => {
    const name = String(file.originalname || '').toLowerCase();
    if (name.endsWith('.json')) {
        return parseJsonFile(file);
    }
    if (name.endsWith('.xlsx')) {
        return parseSpreadsheetFile(file);
    }
    throw new Error(`Unsupported file format for ${file.fieldname}. Use .json or .xlsx`);
};

const parseSubjectsField = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];
    const text = value.trim();
    if (!text) return [];

    if (text.startsWith('[') || text.startsWith('{')) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) return parsed;
        } catch (_error) {
            // Fallback to comma parsing.
        }
    }

    return text.split(',').map((item) => item.trim()).filter(Boolean);
};

const normalizeFacultyRows = (rows = []) =>
    rows
        .map((row) => {
            const name = normalizeText(row.name || row.faculty || row.facultyName);
            if (!name) return null;

            const subjects = parseSubjectsField(row.subjects || row.subject || row.subjectCodes);
            const availableSlots = parseSubjectsField(row.availableSlots || row.availability || row.slots);

            return {
                name,
                subjects,
                availableSlots,
            };
        })
        .filter(Boolean);

const normalizeClassroomRows = (rows = []) =>
    rows
        .map((row) => {
            const roomNumber = normalizeText(row.roomNumber || row.name || row.classroom || row.room);
            if (!roomNumber) return null;

            const capacityRaw = Number(row.capacity || row.strength || 60);
            const availableSlots = parseSubjectsField(row.availableSlots || row.availability || row.slots);

            return {
                roomNumber,
                capacity: Number.isFinite(capacityRaw) && capacityRaw > 0 ? capacityRaw : 60,
                availableSlots,
            };
        })
        .filter(Boolean);

const normalizeSectionRows = (rows = []) =>
    rows
        .map((row) => {
            const sectionName = normalizeText(row.sectionName || row.section || row.code);
            if (!sectionName) return null;

            const strengthRaw = Number(row.strength || row.capacity || 60);
            const subjects = parseSubjectsField(row.subjects || row.subjectPlan || row.subject);

            return {
                sectionName,
                strength: Number.isFinite(strengthRaw) && strengthRaw > 0 ? strengthRaw : 60,
                subjects,
                year: Number(row.year) || 3,
                branch: row.branch || row.department || 'CSE',
            };
        })
        .filter(Boolean);

const getInputDataFromRequest = (req) => {
    const files = req.files || {};
    const facultiesFile = files.facultiesFile?.[0];
    const classroomsFile = files.classroomsFile?.[0];
    const sectionsFile = files.sectionsFile?.[0];

    if (facultiesFile && classroomsFile && sectionsFile) {
        return {
            faculties: normalizeFacultyRows(parseUploadFile(facultiesFile)),
            classrooms: normalizeClassroomRows(parseUploadFile(classroomsFile)),
            sections: normalizeSectionRows(parseUploadFile(sectionsFile)),
        };
    }

    const body = req.body || {};
    if (Array.isArray(body.faculties) && Array.isArray(body.classrooms) && Array.isArray(body.sections)) {
        return {
            faculties: normalizeFacultyRows(body.faculties),
            classrooms: normalizeClassroomRows(body.classrooms),
            sections: normalizeSectionRows(body.sections),
        };
    }

    return { faculties: [], classrooms: [], sections: [] };
};

const upsertMasterData = async () => {
    await Promise.all(
        VIGNAN_COURSES.map((course) =>
            Course.findOneAndUpdate({ code: course.code }, course, { upsert: true, new: true, setDefaultsOnInsert: true })
        )
    );

    await Promise.all(
        VIGNAN_FACULTY.map((faculty) =>
            Faculty.findOneAndUpdate({ shortCode: faculty.shortCode }, faculty, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            })
        )
    );

    await Promise.all(
        VIGNAN_SECTIONS.map((section) =>
            Section.findOneAndUpdate({ code: section.code }, section, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            })
        )
    );

    await Promise.all(
        VIGNAN_CLASSROOMS.map((classroom) =>
            Classroom.findOneAndUpdate({ name: classroom.name }, classroom, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
                runValidators: true,
            })
        )
    );

    const [courses, faculties, sections, classrooms] = await Promise.all([
        Course.find({ code: { $in: VIGNAN_COURSES.map((c) => c.code) } }),
        Faculty.find({ shortCode: { $in: VIGNAN_FACULTY.map((f) => f.shortCode) } }),
        Section.find({ code: { $in: VIGNAN_SECTIONS.map((s) => s.code) } }),
        Classroom.find({ name: { $in: VIGNAN_CLASSROOMS.map((c) => c.name) } }),
    ]);

    return { courses, faculties, sections, classrooms };
};

const generateTimetable = async (req, res) => {
    const { faculties: inputFaculties, classrooms: inputClassrooms, sections: inputSections } = getInputDataFromRequest(req);

    const hasReviewerInput = inputFaculties.length > 0 && inputClassrooms.length > 0 && inputSections.length > 0;

    if (hasReviewerInput) {
        const generated = generateConstraintTimetables({
            faculties: inputFaculties,
            classrooms: inputClassrooms,
            sections: inputSections,
        });

        return res.status(201).json({
            success: true,
            mode: generated.mode,
            unresolvedCount: generated.unresolved.length,
            unresolved: generated.unresolved,
            data: generated.entries,
            sections: generated.sections,
            previewOnly: true,
        });
    }

    const { courses, faculties, sections, classrooms } = await upsertMasterData();
    const generated = await generateUniversityTimetables({ sections, courses, faculties, classrooms });

    const previewSections = sections.map((section) => ({
        section: section.code,
        year: section.year,
        branch: section.department,
        timetable: generated.grids[section.code],
        days: generated.grids[section.code],
        facultyDetails: generated.facultyDetailsBySection?.[section.code] || [],
        entries: generated.entriesBySection?.[section.code] || [],
        generationMode: generated.mode,
    }));

    return res.status(201).json({
        success: true,
        mode: generated.mode,
        unresolvedCount: generated.unresolved?.length || 0,
        unresolved: generated.unresolved || [],
        data: previewSections.flatMap((section) => section.entries || []),
        sections: previewSections,
        previewOnly: true,
    });
};

const getTimetableBySection = async (req, res) => {
    const sectionCode = req.params.section.toUpperCase();
    const timetable = await Timetable.findOne({ sectionCode });

    if (!timetable) {
        res.status(404);
        throw new Error(`Timetable not found for section ${sectionCode}. Generate first.`);
    }

    res.json({ success: true, data: formatSectionResponse(timetable) });
};

const resetTimetable = async (_req, res) => {
    const result = await Timetable.deleteMany({});
    res.json({ success: true, message: 'Timetable data reset completed', deletedCount: result.deletedCount });
};

const importAllCse3Sections = async () => {
    const parsedSections = parseCse3TimetableExcel(getDefaultCse3ExcelPath());

    const savedDocs = await Promise.all(
        parsedSections.map((entry) =>
            Timetable.findOneAndUpdate(
                { sectionCode: entry.section },
                {
                    sectionCode: entry.section,
                    year: entry.year,
                    branch: entry.branch,
                    sectionName: entry.section,
                    timetable: entry.timetable,
                    days: entry.timetable,
                    facultyDetails: entry.facultyDetails || [],
                    entries: [],
                    generationMode: 'algorithmic',
                },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            )
        )
    );

    return savedDocs;
};

const listTimetables = async (req, res) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const branch = req.query.branch ? String(req.query.branch).toUpperCase() : undefined;

    const filter = {};
    if (Number.isFinite(year)) {
        filter.year = year;
    }
    if (branch) {
        filter.branch = branch;
    }

    if (year === 3 && (!branch || branch === 'CSE')) {
        await importAllCse3Sections();
    }

    const rows = await Timetable.find(filter).sort({ sectionCode: 1 });

    res.json({ success: true, data: rows.map(formatSectionResponse) });
};

module.exports = {
    listTimetables,
    generateTimetable,
    getTimetableBySection,
    resetTimetable,
};
