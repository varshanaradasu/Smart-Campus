const UNIVERSITY_CLASSROOM_NUMBERS = [
    ...Array.from({ length: 19 }, (_, index) => `N-2${String(index + 1).padStart(2, '0')}`),
    ...Array.from({ length: 19 }, (_, index) => `N-3${String(index + 1).padStart(2, '0')}`),
    ...Array.from({ length: 19 }, (_, index) => `N-4${String(index + 1).padStart(2, '0')}`),
];

const UNIVERSITY_CLASSROOM_SET = new Set(UNIVERSITY_CLASSROOM_NUMBERS);

const getFloorFromRoomNumber = (roomNumber) => {
    const normalized = String(roomNumber || '').trim().toUpperCase();
    if (!/^N-\d{3}$/.test(normalized)) return null;
    const floorDigit = Number(normalized[2]);
    if (floorDigit === 2) return 'Second Floor';
    if (floorDigit === 3) return 'Third Floor';
    if (floorDigit === 4) return 'Fourth Floor';
    return null;
};

const compareClassroomNumbers = (left, right) => {
    const l = String(left || '').toUpperCase();
    const r = String(right || '').toUpperCase();
    const lMatch = l.match(/^N-(\d{3})$/);
    const rMatch = r.match(/^N-(\d{3})$/);
    if (!lMatch && !rMatch) return l.localeCompare(r);
    if (!lMatch) return 1;
    if (!rMatch) return -1;
    return Number(lMatch[1]) - Number(rMatch[1]);
};

const buildUniversityClassrooms = () =>
    UNIVERSITY_CLASSROOM_NUMBERS.map((roomNumber) => ({
        roomNumber,
        name: roomNumber,
        building: 'N Block',
        capacity: 60,
        type: 'classroom',
        status: 'Vacant',
    }));

const isValidUniversityClassroom = (roomNumber) =>
    UNIVERSITY_CLASSROOM_SET.has(String(roomNumber || '').trim().toUpperCase());

module.exports = {
    UNIVERSITY_CLASSROOM_NUMBERS,
    UNIVERSITY_CLASSROOM_SET,
    buildUniversityClassrooms,
    isValidUniversityClassroom,
    getFloorFromRoomNumber,
    compareClassroomNumbers,
};
