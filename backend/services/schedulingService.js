const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = ['09:00-10:00', '10:15-11:15', '11:30-12:30', '14:00-15:00', '15:15-16:15'];

const generateTimetablePlan = (courses = [], classrooms = [], facultyMembers = []) => {
    const plan = [];

    if (!courses.length || !classrooms.length || !facultyMembers.length) {
        return plan;
    }

    let dayIndex = 0;
    let slotIndex = 0;

    courses.forEach((course, index) => {
        const faculty = facultyMembers[index % facultyMembers.length];
        const classroom = classrooms[index % classrooms.length];

        plan.push({
            course: course.name,
            department: course.department,
            semester: course.semester,
            faculty,
            classroom,
            day: DAYS[dayIndex],
            timeSlot: SLOTS[slotIndex],
            labRequired: Boolean(course.labRequired),
        });

        slotIndex += 1;
        if (slotIndex >= SLOTS.length) {
            slotIndex = 0;
            dayIndex = (dayIndex + 1) % DAYS.length;
        }
    });

    return plan;
};

module.exports = { generateTimetablePlan };
