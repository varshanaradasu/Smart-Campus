import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Skeleton from '../components/Skeleton';
import AIPoweredLabel from '../components/ui/AIPoweredLabel';
import { generateUniversityTimetable } from '../services/operationsService';

const PREVIEW_STORAGE_KEY = 'sco_generated_timetable_preview';
const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const FIXED_SLOTS = new Set(['BREAK', 'LUNCH']);

const normalize = (value) => String(value || '').trim();
const entryKey = (day, slot) => `${normalize(day).toUpperCase()}|${normalize(slot)}`;

const toClassroomText = (value) => {
    if (Array.isArray(value)) {
        const parts = value
            .map((item) => {
                if (!item) return '';
                if (typeof item === 'string') return normalize(item);
                return normalize(item.roomNumber || item.name || item.classroom || item.room || item.classroomNumber);
            })
            .filter(Boolean);
        return parts.length ? parts.join(', ') : '';
    }

    if (value && typeof value === 'object') {
        return normalize(value.roomNumber || value.name || value.classroom || value.room || value.classroomNumber);
    }

    return normalize(value);
};

const toFacultyText = (value) => {
    if (Array.isArray(value)) {
        const parts = value
            .map((item) => {
                if (!item) return '';
                if (typeof item === 'string') return normalize(item);
                return normalize(item.name || item.faculty || item.fullName);
            })
            .filter(Boolean);
        return parts.length ? parts.join(', ') : '';
    }

    if (value && typeof value === 'object') {
        return normalize(value.name || value.faculty || value.fullName);
    }

    return normalize(value);
};

const buildGeneratedExportRows = (sections) => {
    const rows = [];

    (Array.isArray(sections) ? sections : []).forEach((sectionItem) => {
        const sectionCode = sectionItem?.section || sectionItem?.sectionCode || '-';
        const grid = sectionItem?.timetable || sectionItem?.days || {};
        const facultyLookup = new Map(
            (Array.isArray(sectionItem?.facultyDetails) ? sectionItem.facultyDetails : [])
                .filter((item) => normalize(item?.subject))
                .map((item) => [normalize(item.subject).toUpperCase(), toFacultyText(item?.faculty) || '-'])
        );
        const entryLookup = new Map();

        (Array.isArray(sectionItem?.entries) ? sectionItem.entries : []).forEach((entry) => {
            const day = normalize(entry?.day || entry?.dayOfWeek || entry?.weekday);
            const slot = normalize(entry?.slot || entry?.timeSlot || entry?.period);
            if (!day || !slot) return;
            entryLookup.set(entryKey(day, slot), entry);
        });

        DAY_KEYS.forEach((day) => {
            Object.entries(grid?.[day] || {}).forEach(([timeSlot, subjectValue]) => {
                const subject = normalize(subjectValue);
                if (!subject || FIXED_SLOTS.has(subject)) return;
                const mappedEntry = entryLookup.get(entryKey(day, timeSlot));
                const classroom =
                    toClassroomText(
                        mappedEntry?.classroom ||
                        mappedEntry?.classroomDetails ||
                        mappedEntry?.classroomInfo ||
                        mappedEntry?.room ||
                        mappedEntry?.roomNumber ||
                        mappedEntry?.classroomNumber
                    ) || '-';
                const faculty =
                    toFacultyText(
                        mappedEntry?.faculty ||
                        mappedEntry?.facultyDetails ||
                        mappedEntry?.facultyNames ||
                        mappedEntry?.faculties
                    ) ||
                    facultyLookup.get(subject.toUpperCase()) ||
                    '-';

                rows.push({
                    day,
                    timeSlot,
                    section: sectionCode,
                    classroom,
                    subject,
                    faculty,
                });
            });
        });
    });

    return rows;
};

const fileHasJsonExtension = (file) => String(file?.name || '').toLowerCase().endsWith('.json');

const validateJsonUpload = async (file, type) => {
    if (!fileHasJsonExtension(file)) return null;

    let parsed;
    try {
        parsed = JSON.parse(await file.text());
    } catch (_error) {
        return `${type} file is not valid JSON.`;
    }

    if (!Array.isArray(parsed) || !parsed.length) {
        return `${type} file must contain a non-empty JSON array.`;
    }

    const sample = parsed[0] || {};

    if (type === 'faculties') {
        if (!('name' in sample) || !('subjects' in sample)) {
            return 'Faculties JSON must include fields like name and subjects.';
        }
    }

    if (type === 'classrooms') {
        if (!('roomNumber' in sample) && !('name' in sample)) {
            return 'Classrooms JSON must include roomNumber (or name) for each record.';
        }
    }

    if (type === 'sections') {
        if (!('sectionName' in sample) && !('code' in sample)) {
            return 'Sections JSON must include sectionName (or code) for each record.';
        }
        if (!('subjects' in sample)) {
            return 'Sections JSON must include subjects for each section.';
        }
    }

    return null;
};

const UploadCard = ({ title, hint, file, onFileChange }) => (
    <article className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{hint}</p>

        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-white/90 px-3 py-3 text-sm text-slate-700 transition hover:border-brand-500">
            <span className="truncate pr-3">{file ? file.name : 'Choose .json or .xlsx file'}</span>
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold">Browse</span>
            <input
                type="file"
                accept=".json,.xlsx"
                className="hidden"
                onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            />
        </label>
    </article>
);

const TimetableGeneratorPage = () => {
    const navigate = useNavigate();

    const [facultiesFile, setFacultiesFile] = useState(null);
    const [classroomsFile, setClassroomsFile] = useState(null);
    const [sectionsFile, setSectionsFile] = useState(null);

    const [error, setError] = useState('');
    const [resultInfo, setResultInfo] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedExportRows, setGeneratedExportRows] = useState([]);

    const exportGeneratedPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(14);
        doc.text('Generated Timetable', 14, 14);
        autoTable(doc, {
            startY: 20,
            head: [['Day', 'Time Slot', 'Section', 'Classroom', 'Subject', 'Faculty']],
            body: generatedExportRows.map((row) => [row.day, row.timeSlot, row.section, row.classroom, row.subject, row.faculty]),
            styles: { fontSize: 9 },
        });
        doc.save('Generated_Timetable.pdf');
    };

    const exportGeneratedExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            generatedExportRows.map((row) => ({
                Day: row.day,
                'Time Slot': row.timeSlot,
                Section: row.section,
                Classroom: row.classroom,
                Subject: row.subject,
                Faculty: row.faculty,
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Generated Timetable');
        XLSX.writeFile(workbook, 'Generated_Timetable.xlsx');
    };

    const onGenerate = async () => {
        setError('');
        setResultInfo('');
        setGeneratedExportRows([]);

        if (!facultiesFile || !classroomsFile || !sectionsFile) {
            setError('Please upload faculties, classrooms, and sections files before generating.');
            return;
        }

        const validationChecks = await Promise.all([
            validateJsonUpload(facultiesFile, 'faculties'),
            validateJsonUpload(classroomsFile, 'classrooms'),
            validateJsonUpload(sectionsFile, 'sections'),
        ]);

        const firstValidationError = validationChecks.find(Boolean);
        if (firstValidationError) {
            setError(firstValidationError);
            return;
        }

        const formData = new FormData();
        formData.append('facultiesFile', facultiesFile);
        formData.append('classroomsFile', classroomsFile);
        formData.append('sectionsFile', sectionsFile);

        setGenerating(true);
        try {
            const response = await generateUniversityTimetable(formData);
            const unresolvedCount = response.unresolvedCount || 0;
            const generatedRows = Array.isArray(response.data) ? response.data.length : 0;
            const generatedSections = Array.isArray(response.sections) ? response.sections : [];
            setGeneratedExportRows(buildGeneratedExportRows(generatedSections));

            sessionStorage.setItem(
                PREVIEW_STORAGE_KEY,
                JSON.stringify({
                    createdAt: Date.now(),
                    mode: response.mode || 'algorithmic',
                    unresolvedCount,
                    sections: generatedSections,
                })
            );

            setResultInfo(`Generated preview with ${generatedRows} slots. Unresolved: ${unresolvedCount}. Redirecting to Timetable Viewer...`);
            setTimeout(() => {
                navigate('/timetable?mode=generated');
            }, 700);
        } catch (requestError) {
            const responseMessage = requestError.response?.data?.message;
            const status = requestError.response?.status;
            const fallback = requestError.message || 'Failed to generate timetable preview.';
            setError(responseMessage || (status ? `Request failed (${status}). ${fallback}` : fallback));
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <section className="glass-card rounded-2xl p-5">
                <AIPoweredLabel className="mb-3" />
                <h2 className="panel-title">Timetable Generator</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Upload faculties, classrooms, and sections data files. The system parses files automatically and generates a timetable preview.
                </p>
                <p className="mt-1 text-xs font-semibold text-brand-700">
                    University timetable imported from Excel remains unchanged until you explicitly save a generated version.
                </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <UploadCard
                    title="Upload Faculties File"
                    hint="Supported formats: .json or .xlsx"
                    file={facultiesFile}
                    onFileChange={setFacultiesFile}
                />
                <UploadCard
                    title="Upload Classrooms File"
                    hint="Supported formats: .json or .xlsx"
                    file={classroomsFile}
                    onFileChange={setClassroomsFile}
                />
                <UploadCard
                    title="Upload Sections File"
                    hint="Supported formats: .json or .xlsx"
                    file={sectionsFile}
                    onFileChange={setSectionsFile}
                />
            </section>

            <section className="glass-card flex flex-col items-start gap-3 rounded-2xl p-5 md:flex-row md:items-center md:justify-between">
                <button
                    onClick={onGenerate}
                    disabled={generating}
                    className="rounded-xl bg-gradient-to-r from-brand-600 to-slateBlue px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-60"
                >
                    {generating ? 'Generating Timetable...' : 'Generate Timetable'}
                </button>

                {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
                {!error && resultInfo ? <p className="text-sm font-medium text-brand-700">{resultInfo}</p> : null}
            </section>

            {generatedExportRows.length ? (
                <section className="glass-card flex flex-col items-start gap-3 rounded-2xl p-5 md:flex-row md:items-center">
                    <button
                        onClick={exportGeneratedPdf}
                        className="rounded-xl bg-slate-700 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg"
                    >
                        Export Generated PDF
                    </button>
                    <button
                        onClick={exportGeneratedExcel}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg"
                    >
                        Export Generated Excel
                    </button>
                </section>
            ) : null}

            {generating ? (
                <section className="glass-card rounded-2xl p-5">
                    <p className="text-sm font-semibold text-slate-700">Preparing generated timetable preview...</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    <div className="mt-4 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-10/12" />
                    </div>
                </section>
            ) : null}
        </div>
    );
};

export default TimetableGeneratorPage;
