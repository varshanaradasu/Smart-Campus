import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarX2, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import EmptyState from '../components/EmptyState';
import { TimetableGridSkeleton } from '../components/Skeleton';
import { fetchSectionTimetable, fetchTimetablesByFilter } from '../services/operationsService';
import { useEffect } from 'react';

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

const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const FIXED_SLOTS = new Set(['BREAK', 'LUNCH']);
const PREVIEW_STORAGE_KEY = 'sco_generated_timetable_preview';
const FACULTY_TITLE_PATTERN = /\b(?:Dr\.?|Mr\.?|Ms\.?|Mrs\.?|Prof\.?)\s+/gi;

const normalize = (value) => String(value || '').trim();
const entryKey = (day, slot) => `${normalize(day).toUpperCase()}|${normalize(slot)}`;

const splitFacultyNames = (value) => {
    if (Array.isArray(value)) {
        return value
            .flatMap((item) => splitFacultyNames(item))
            .map((name) => normalize(name))
            .filter(Boolean);
    }

    if (value && typeof value === 'object') {
        return splitFacultyNames(value.name || value.faculty || value.fullName || '');
    }

    const text = normalize(value);
    if (!text) return [];

    const commaSeparated = text
        .split(/[,;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean);

    if (commaSeparated.length > 1) {
        return commaSeparated;
    }

    const titleMatches = Array.from(text.matchAll(FACULTY_TITLE_PATTERN));
    if (titleMatches.length > 1) {
        const chunks = titleMatches.map((match, index) => {
            const start = match.index ?? 0;
            const end = index + 1 < titleMatches.length ? (titleMatches[index + 1].index ?? text.length) : text.length;
            return text.slice(start, end).trim();
        });
        const cleaned = chunks.filter(Boolean);
        if (cleaned.length) return cleaned;
    }

    return [text];
};

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

const toFacultyText = (faculty) => {
    return splitFacultyNames(faculty).join(', ');
};

const normalizeSubjectKey = (value) => normalize(value).toUpperCase();

const buildFacultyLookup = (facultyDetails) => {
    const map = new Map();
    (Array.isArray(facultyDetails) ? facultyDetails : []).forEach((item) => {
        const subject = normalize(item?.subject);
        if (!subject) return;
        const facultyText = toFacultyText(item?.faculty) || '-';
        const keys = new Set([
            normalizeSubjectKey(subject),
            normalizeSubjectKey(subject.split('(')[0]),
            normalizeSubjectKey(subject.replace('-L', '').replace(' LAB', '')),
        ]);

        keys.forEach((key) => {
            if (key) map.set(key, facultyText);
        });
    });
    return map;
};

const buildExportRows = ({ grid, facultyDetails, entries, section }) => {
    const facultyLookup = buildFacultyLookup(facultyDetails);
    const entryLookup = new Map();

    (Array.isArray(entries) ? entries : []).forEach((entry) => {
        const day = normalize(entry?.day || entry?.dayOfWeek || entry?.weekday);
        const slot = normalize(entry?.slot || entry?.timeSlot || entry?.period);
        if (!day || !slot) return;
        entryLookup.set(entryKey(day, slot), entry);
    });

    const rows = [];

    DAY_KEYS.forEach((day) => {
        SLOT_KEYS.forEach((slot) => {
            const subject = normalize(grid?.[day]?.[slot]);
            if (!subject || FIXED_SLOTS.has(subject)) return;
            const mappedEntry = entryLookup.get(entryKey(day, slot));

            const faculty =
                toFacultyText(
                    mappedEntry?.faculty ||
                    mappedEntry?.facultyDetails ||
                    mappedEntry?.facultyNames ||
                    mappedEntry?.faculties
                ) ||
                facultyLookup.get(normalizeSubjectKey(subject)) ||
                facultyLookup.get(normalizeSubjectKey(subject.split('(')[0])) ||
                facultyLookup.get(normalizeSubjectKey(subject.replace('-L', '').replace(' LAB', ''))) ||
                '-';

            const classroom =
                toClassroomText(
                    mappedEntry?.classroom ||
                    mappedEntry?.classroomDetails ||
                    mappedEntry?.classroomInfo ||
                    mappedEntry?.room ||
                    mappedEntry?.roomNumber ||
                    mappedEntry?.classroomNumber
                ) || '-';

            rows.push({
                day,
                timeSlot: slot,
                section: section || '-',
                classroom,
                subject,
                faculty,
            });
        });
    });

    return rows;
};

const extractSubjectKeysFromGrid = (grid) => {
    const subjectSet = new Set();

    DAY_KEYS.forEach((day) => {
        SLOT_KEYS.forEach((slot) => {
            const value = normalize(grid?.[day]?.[slot]);
            if (!value || FIXED_SLOTS.has(value)) return;
            subjectSet.add(value.toUpperCase());
            subjectSet.add(value.split('(')[0].trim().toUpperCase());
            subjectSet.add(value.split('-')[0].trim().toUpperCase());
        });
    });

    return subjectSet;
};

const getDayCells = (grid, day) => {
    const cells = [];

    for (let i = 0; i < SLOT_KEYS.length; i += 1) {
        const slot = SLOT_KEYS[i];
        const current = normalize(grid?.[day]?.[slot]);

        if (!current) {
            cells.push({ value: '', span: 1, kind: 'empty', key: `${day}-${slot}` });
            continue;
        }

        if (FIXED_SLOTS.has(current)) {
            cells.push({ value: current, span: 1, kind: 'fixed', key: `${day}-${slot}` });
            continue;
        }

        let span = 1;
        while (i + span < SLOT_KEYS.length) {
            const nextSlot = SLOT_KEYS[i + span];
            const nextValue = normalize(grid?.[day]?.[nextSlot]);
            if (!nextValue || FIXED_SLOTS.has(nextValue) || nextValue !== current) {
                break;
            }
            span += 1;
        }

        cells.push({
            value: current,
            span,
            kind: 'subject',
            key: `${day}-${slot}`,
        });

        i += span - 1;
    }

    return cells;
};

const formatFacultyForExcelCell = (facultyValue) => {
    const names = splitFacultyNames(facultyValue);
    if (!names.length) return '-';
    return names.join('\n');
};

const TimetablePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [generatedSections, setGeneratedSections] = useState([]);
    const [generatedBySection, setGeneratedBySection] = useState({});
    const [viewMode, setViewMode] = useState('university');
    const [section, setSection] = useState('');
    const [timetable, setTimetable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const getStoredPreview = () => {
        try {
            const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed.sections)) return null;
            return parsed;
        } catch (_error) {
            return null;
        }
    };

    const loadSection = async (sectionCode, withLoading = true) => {
        if (withLoading) setLoading(true);
        try {
            const response = await fetchSectionTimetable(sectionCode);
            setTimetable(response.data || null);
            setMessage('');
        } catch (error) {
            setTimetable(null);
            setMessage(error.response?.data?.message || 'Unable to load timetable.');
        } finally {
            if (withLoading) setLoading(false);
        }
    };

    const initializeSections = async () => {
        setLoading(true);
        try {
            const preview = getStoredPreview();
            const previewRows = preview?.sections || [];
            const previewMap = Object.fromEntries(
                previewRows.map((row) => [row.section, { ...row, days: row.timetable }])
            );

            setGeneratedSections(previewRows.map((row) => row.section));
            setGeneratedBySection(previewMap);

            const response = await fetchTimetablesByFilter({ year: 3, branch: 'CSE' });
            const rows = response.data || [];
            setSections(rows);

            const queryMode = new URLSearchParams(location.search).get('mode');
            const shouldUseGenerated = queryMode === 'generated' && previewRows.length > 0;

            if (shouldUseGenerated) {
                const initialGeneratedSection = previewRows[0].section;
                setViewMode('generated');
                setSection(initialGeneratedSection);
                setTimetable(previewMap[initialGeneratedSection] || null);
                setMessage('');
                return;
            }

            if (rows.length) {
                const initialSection = rows[0].section;
                setViewMode('university');
                setSection(initialSection);
                await loadSection(initialSection, false);
                return;
            }

            setMessage('No timetable sections found for 3rd year CSE.');
            setTimetable(null);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to load timetable sections.');
            setTimetable(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeSections();
    }, []);

    const setGeneratedSection = (nextSection) => {
        setSection(nextSection);
        const next = generatedBySection[nextSection] || null;
        setTimetable(next);
        setMessage(next ? '' : 'Generated preview data not found for selected section.');
    };

    const onModeChange = async (nextMode) => {
        setViewMode(nextMode);
        setMessage('');

        if (nextMode === 'generated') {
            if (!generatedSections.length) {
                setTimetable(null);
                setSection('');
                setMessage('No generated timetable preview found. Generate from Admin Timetable Generator.');
                return;
            }

            const firstSection = generatedSections[0];
            setGeneratedSection(firstSection);
            return;
        }

        if (!sections.length) {
            setTimetable(null);
            setSection('');
            setMessage('No university timetable sections found for 3rd year CSE.');
            return;
        }

        const firstSection = sections[0].section;
        setSection(firstSection);
        await loadSection(firstSection);
    };

    const onSectionChange = async (nextSection) => {
        if (viewMode === 'generated') {
            setGeneratedSection(nextSection);
            return;
        }

        setSection(nextSection);
        await loadSection(nextSection);
    };

    const grid = timetable?.timetable || timetable?.days || null;
    const entries = Array.isArray(timetable?.entries) ? timetable.entries : [];
    const gridSubjects = extractSubjectKeysFromGrid(grid);
    const facultyDetails = (Array.isArray(timetable?.facultyDetails) ? timetable.facultyDetails : []).filter((item) => {
        const subject = normalize(item.subject).toUpperCase();
        return gridSubjects.has(subject) || gridSubjects.has(subject.replace('-L', '')) || gridSubjects.has(subject.replace(' LAB', ''));
    });

    const exportRows = buildExportRows({ grid, facultyDetails, entries, section });

    const exportAsPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Section: ${section || '-'}`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

        const timetableHead = [['Day', ...SLOT_KEYS]];
        const timetableBody = DAY_KEYS.map((day) => {
            const row = [day];
            SLOT_KEYS.forEach((slot) => {
                row.push(normalize(grid?.[day]?.[slot]) || '-');
            });
            return row;
        });

        autoTable(doc, {
            startY: 42,
            head: timetableHead,
            body: timetableBody,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 3,
                valign: 'middle',
                halign: 'center',
                lineColor: [203, 213, 225],
                lineWidth: 0.5,
            },
            headStyles: {
                fillColor: [241, 245, 249],
                textColor: [51, 65, 85],
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { cellWidth: 50, halign: 'center' },
            },
            margin: { left: 16, right: 16 },
            tableWidth: 'auto',
        });

        const facultyDetailRows = (facultyDetails || []).map((item) => [
            normalize(item?.subject) || '-',
            splitFacultyNames(item?.faculty).join(', ') || '-',
        ]);

        const detailsStartY = (doc.lastAutoTable?.finalY || 42) + 16;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Faculty Details', 16, detailsStartY);

        autoTable(doc, {
            startY: detailsStartY + 6,
            head: [['Subject', 'Faculty']],
            body: facultyDetailRows.length ? facultyDetailRows : [['-', '-']],
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 4,
                lineColor: [203, 213, 225],
                lineWidth: 0.5,
                valign: 'middle',
            },
            headStyles: {
                fillColor: [241, 245, 249],
                textColor: [51, 65, 85],
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { cellWidth: 180 },
                1: { cellWidth: 560 },
            },
            margin: { left: 16, right: 16 },
        });

        doc.save(viewMode === 'generated' ? 'Generated_Timetable.pdf' : 'University_Timetable.pdf');
    };

    const exportAsExcel = () => {
        const isUniversityView = viewMode === 'university';
        const rowsForExcel = exportRows.map((row) => ({
            Day: row.day,
            'Time Slot': row.timeSlot,
            Section: row.section,
            Classroom: row.classroom,
            Subject: row.subject,
            Faculty: isUniversityView ? formatFacultyForExcelCell(row.faculty) : row.faculty,
        }));

        const worksheet = XLSX.utils.json_to_sheet(
            rowsForExcel
        );

        if (isUniversityView) {
            worksheet['!cols'] = [
                { wch: 8 },
                { wch: 14 },
                { wch: 12 },
                { wch: 14 },
                { wch: 28 },
                { wch: 34 },
            ];

            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
            for (let row = range.s.r + 1; row <= range.e.r; row += 1) {
                const facultyCell = XLSX.utils.encode_cell({ c: 5, r: row });
                if (worksheet[facultyCell]) {
                    worksheet[facultyCell].z = '@';
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable');
        XLSX.writeFile(workbook, viewMode === 'generated' ? 'Generated_Timetable.xlsx' : 'University_Timetable.xlsx');
    };

    return (
        <div className="space-y-4">
            <div className="glass-card flex flex-col items-start justify-between gap-3 rounded-2xl p-5 md:flex-row md:items-center">
                <div>
                    <h2 className="panel-title">Vignan University Timetable</h2>
                    <p className="text-sm text-slate-500">
                        Day x time slots grid for all available 3rd year CSE sections. Choose University data or Generated preview mode.
                    </p>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    {grid ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportAsPdf}
                                className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 md:text-sm"
                            >
                                {viewMode === 'generated' ? 'Export Generated PDF' : 'Export PDF'}
                            </button>
                            <button
                                onClick={exportAsExcel}
                                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 md:text-sm"
                            >
                                {viewMode === 'generated' ? 'Export Generated Excel' : 'Export Excel'}
                            </button>
                        </div>
                    ) : null}
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 md:text-sm">
                        <span>View Mode:</span>
                        <button
                            onClick={() => onModeChange('university')}
                            className={`rounded-lg px-2 py-1 ${viewMode === 'university' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                        >
                            University Timetable
                        </button>
                        <button
                            onClick={() => onModeChange('generated')}
                            className={`rounded-lg px-2 py-1 ${viewMode === 'generated' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                        >
                            Generated Timetable
                        </button>
                    </div>
                    <select
                        value={section}
                        onChange={(e) => onSectionChange(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                        {(viewMode === 'generated' ? generatedSections : sections.map((item) => item.section)).map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {message ? <p className="text-sm font-medium text-brand-700">{message}</p> : null}

            {loading ? (
                <TimetableGridSkeleton />
            ) : !grid ? (
                <EmptyState
                    icon={viewMode === 'generated' ? Sparkles : CalendarX2}
                    title={viewMode === 'generated' ? 'No timetable generated yet' : 'No timetable data available'}
                    description={
                        viewMode === 'generated'
                            ? 'No timetable generated yet. Click Generate Timetable to create schedules.'
                            : 'No university timetable data is available for the selected view right now.'
                    }
                    actionLabel={viewMode === 'generated' ? 'Generate Timetable' : 'Refresh Timetable'}
                    onAction={() => {
                        if (viewMode === 'generated') {
                            navigate('/timetable-generator');
                            return;
                        }
                        initializeSections();
                    }}
                />
            ) : (
                <div className="glass-card overflow-hidden rounded-2xl p-3">
                    <div className="overflow-x-auto">
                        <table id="timetable-table" className="timetable-grid min-w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border border-slate-200 bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">Day</th>
                                    {SLOT_KEYS.map((slot) => (
                                        <th key={slot} className="border border-slate-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-slate-700">
                                            {slot}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DAY_KEYS.map((day) => (
                                    <tr key={day}>
                                        <td className="border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">{day}</td>
                                        {getDayCells(grid, day).map((cell) => (
                                            <td
                                                key={cell.key}
                                                colSpan={cell.span}
                                                className={`border border-slate-200 px-2 py-3 text-center text-xs md:text-sm ${cell.kind === 'fixed'
                                                    ? 'bg-amber-100 font-bold text-slate-700'
                                                    : cell.kind === 'empty'
                                                        ? 'bg-white/70 text-slate-700'
                                                        : 'bg-white/80 font-semibold text-slate-700'
                                                    }`}
                                            >
                                                {cell.value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-white/80 p-4">
                        <h3 className="text-base font-bold text-slate-800">Faculty Details</h3>
                        {facultyDetails.length ? (
                            <div className="mt-3 space-y-2 text-sm text-slate-700">
                                {facultyDetails.map((item, index) => (
                                    <p key={`${item.subject}-${index}`}>
                                        <span className="font-semibold">{item.subject}</span> - {toFacultyText(item.faculty)}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-slate-500">Faculty details are not available for this section.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimetablePage;
