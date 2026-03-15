const path = require('path');
const XLSX = require('xlsx');

const TARGET_SLOTS = [
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

const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const normalizeKey = (value) => normalizeText(value).toUpperCase();

const getCellText = (sheet, rowIndex, colIndex) => {
    const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
    const cell = sheet[address];
    if (!cell) return '';
    if (typeof cell.w === 'string') return normalizeText(cell.w);
    return normalizeText(XLSX.utils.format_cell(cell));
};

const getRowsWithMergedCellsExpanded = (sheet) => {
    if (!sheet || !sheet['!ref']) return [];

    const range = XLSX.utils.decode_range(sheet['!ref']);
    const rowCount = range.e.r - range.s.r + 1;
    const colCount = range.e.c - range.s.c + 1;

    const rows = Array.from({ length: rowCount }, (_, rowOffset) => {
        const sourceRow = range.s.r + rowOffset;
        return Array.from({ length: colCount }, (_, colOffset) => {
            const sourceCol = range.s.c + colOffset;
            return getCellText(sheet, sourceRow, sourceCol);
        });
    });

    const merges = sheet['!merges'] || [];
    merges.forEach((merge) => {
        const sourceValue = getCellText(sheet, merge.s.r, merge.s.c);
        if (!sourceValue) return;

        for (let r = merge.s.r; r <= merge.e.r; r += 1) {
            for (let c = merge.s.c; c <= merge.e.c; c += 1) {
                const rowIndex = r - range.s.r;
                const colIndex = c - range.s.c;
                if (rowIndex < 0 || colIndex < 0 || rowIndex >= rows.length || colIndex >= rows[rowIndex].length) {
                    continue;
                }
                rows[rowIndex][colIndex] = sourceValue;
            }
        }
    });

    return rows;
};

const sectionNumberToCode = (sectionNumber) => {
    const index = Number(sectionNumber);
    if (!Number.isInteger(index) || index < 1) return null;
    if (index <= 26) {
        return `CSE_3${String.fromCharCode(64 + index)}`;
    }
    return `CSE_3${index}`;
};

const sectionFromText = (value) => {
    const raw = normalizeKey(value);

    const sectionMatch = raw.match(/SECTION\s*[-:]?\s*(\d{1,2})/);
    if (sectionMatch) {
        return sectionNumberToCode(sectionMatch[1]);
    }

    const match = raw.match(/CSE[\s_-]*3\s*([A-Z0-9]+)/);
    if (match) return `CSE_3${match[1]}`;

    const sheetStyleMatch = raw.match(/III\s*CSE\s*(\d{1,2})/);
    if (sheetStyleMatch) {
        return sectionNumberToCode(sheetStyleMatch[1]);
    }

    return null;
};

const createBlankTimetable = () => {
    const result = {};
    DAY_KEYS.forEach((day) => {
        result[day] = {};
        TARGET_SLOTS.forEach((slot) => {
            result[day][slot] = '';
        });
    });
    return result;
};

const isDayRow = (row) => {
    const first = normalizeKey(row?.[0]);
    return Boolean(DAY_ALIASES[first]);
};

const isStudentIdToken = (value) => /^[0-9]{2,}[A-Z]{1,}[0-9]+$/i.test(value) || /^[0-9]{8,}$/.test(value);

const cleanFacultyToken = (token) => {
    let value = normalizeText(token);
    if (!value) return '';

    // Remove phone-like suffixes while preserving names/titles.
    value = value.replace(/\(\d{7,12}\)/g, '').trim();
    value = value.replace(/\s{2,}/g, ' ').trim();
    return value;
};

const parseFacultyNamesFromRow = (row, subjectLabel) => {
    const subjectKey = normalizeKey(subjectLabel);
    const isTrainingSubject = subjectKey.includes('TRAINING');

    const uniqueCellValues = Array.from(
        new Set(
            (row || [])
                .slice(1)
                .map((cell) => normalizeText(cell))
                .filter(Boolean)
        )
    );

    const names = [];
    uniqueCellValues.forEach((cellValue) => {
        cellValue
            .split(',')
            .map((part) => cleanFacultyToken(part))
            .filter(Boolean)
            .forEach((name) => {
                const nameKey = normalizeKey(name);
                if (nameKey === subjectKey) return;
                if (nameKey.startsWith(`${subjectKey} `) || nameKey.endsWith(` ${subjectKey}`)) return;
                if (!isTrainingSubject && isStudentIdToken(name)) return;
                names.push(name);
            });
    });

    return names;
};

const parseFacultyDetails = (rows, startIndex) => {
    const subjectMap = new Map();

    for (let i = startIndex; i < rows.length; i += 1) {
        const row = rows[i] || [];
        const label = normalizeText(row[0]);
        const labelKey = normalizeKey(label);

        const hasAnyValue = row.some((cell) => normalizeText(cell));
        if (!hasAnyValue) {
            if (subjectMap.size) break;
            continue;
        }

        if (!label) {
            continue;
        }

        if (DAY_ALIASES[labelKey]) {
            continue;
        }

        const names = parseFacultyNamesFromRow(row, label);
        if (!names.length) {
            continue;
        }

        const existing = subjectMap.get(labelKey);
        if (!existing) {
            subjectMap.set(labelKey, {
                subject: label,
                facultySet: new Set(names),
            });
            continue;
        }

        names.forEach((name) => existing.facultySet.add(name));
    }

    return Array.from(subjectMap.values()).map((entry) => ({
        subject: entry.subject,
        faculty: Array.from(entry.facultySet),
    }));
};

const getHeaderSlotIndexes = (headerRow) => {
    const slotIndexes = [];

    headerRow.forEach((cell, idx) => {
        if (idx === 0) return;
        const normalized = normalizeText(cell);
        if (/\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}/.test(normalized)) {
            slotIndexes.push({ index: idx, slot: normalized });
        }
    });

    if (!slotIndexes.length) {
        return TARGET_SLOTS.map((slot, i) => ({ index: i + 1, slot }));
    }

    if (slotIndexes.length >= TARGET_SLOTS.length) {
        return slotIndexes.slice(0, TARGET_SLOTS.length);
    }

    const filled = [...slotIndexes];
    while (filled.length < TARGET_SLOTS.length) {
        filled.push({ index: filled.length + 1, slot: TARGET_SLOTS[filled.length] });
    }
    return filled;
};

const parseSectionBlock = (rows, sectionRowIndex, sectionCode) => {
    const headerOffset = rows.slice(sectionRowIndex, sectionRowIndex + 12).findIndex((row) => {
        const keyRow = row.map((cell) => normalizeKey(cell));
        return keyRow.includes('DAY');
    });

    if (headerOffset === -1) return null;

    const headerIndex = sectionRowIndex + headerOffset;
    const headerSlots = getHeaderSlotIndexes(rows[headerIndex] || []);
    const timetable = createBlankTimetable();
    let lastDayRowIndex = headerIndex;

    for (let i = headerIndex + 1; i < Math.min(rows.length, headerIndex + 16); i += 1) {
        const row = rows[i] || [];
        const day = DAY_ALIASES[normalizeKey(row[0])];
        if (!day) {
            if (Object.values(row).every((cell) => !normalizeText(cell))) {
                break;
            }
            continue;
        }

        lastDayRowIndex = i;

        TARGET_SLOTS.forEach((slot, idx) => {
            const columnIndex = headerSlots[idx]?.index ?? idx + 1;
            const value = normalizeText(row[columnIndex]);
            timetable[day][slot] = value || (slot === '9:55-10:10' ? 'BREAK' : slot === '12:40-1:40' ? 'LUNCH' : '');
        });
    }

    const facultyDetails = parseFacultyDetails(rows, lastDayRowIndex + 1);

    return {
        section: sectionCode,
        year: 3,
        branch: 'CSE',
        timetable,
        facultyDetails,
    };
};

const parseSheetSections = (rows) => {
    const sectionEntries = [];

    rows.forEach((row, rowIndex) => {
        row.forEach((cell) => {
            const sectionCode = sectionFromText(cell);
            if (!sectionCode) return;

            const already = sectionEntries.some((entry) => entry.section === sectionCode);
            if (already) return;

            const parsed = parseSectionBlock(rows, rowIndex, sectionCode);
            if (parsed) {
                sectionEntries.push(parsed);
            }
        });
    });

    return sectionEntries;
};

const parseCse3TimetableExcel = (excelPath) => {
    const workbook = XLSX.readFile(excelPath);
    const allSections = [];

    workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = getRowsWithMergedCellsExpanded(sheet);
        if (!rows.length) return;

        const sections = parseSheetSections(rows);
        sections.forEach((entry) => {
            const exists = allSections.some((s) => s.section === entry.section);
            if (!exists) {
                allSections.push(entry);
            }
        });
    });

    if (!allSections.length) {
        throw new Error('No CSE 3rd-year sections found in timetable source');
    }

    return allSections;
};

const getDefaultCse3ExcelPath = () => path.join(process.cwd(), 'data', '3rd_year_cse_timetable.xlsx');

module.exports = {
    DAY_KEYS,
    TARGET_SLOTS,
    parseCse3TimetableExcel,
    getDefaultCse3ExcelPath,
};
