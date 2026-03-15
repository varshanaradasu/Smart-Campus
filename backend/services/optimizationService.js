const optimizeClassroomAllocation = (requests = [], classrooms = []) => {
    const sortedRooms = [...classrooms].sort((a, b) => a.capacity - b.capacity);
    const availableRooms = [...sortedRooms];

    return requests.map((request) => {
        const selected =
            availableRooms.find((room) => room.capacity >= request.studentCount && room.type !== 'hall') ||
            availableRooms[availableRooms.length - 1] ||
            null;

        if (selected) {
            const index = availableRooms.findIndex((room) => String(room._id || room.roomNumber || room.name) === String(selected._id || selected.roomNumber || selected.name));
            if (index >= 0) {
                availableRooms.splice(index, 1);
            }
        }

        return {
            course: request.course,
            studentCount: request.studentCount,
            allocatedRoom: selected ? selected.name : 'Not Available',
            utilization: selected ? Number((request.studentCount / selected.capacity).toFixed(2)) : 0,
        };
    });
};

const calculateFacultyWorkload = (timetables = []) => {
    const loadMap = {};

    timetables.forEach((entry) => {
        const facultyName = entry.faculty?.name || 'Unassigned';
        loadMap[facultyName] = (loadMap[facultyName] || 0) + 1;
    });

    return Object.entries(loadMap).map(([faculty, sessions]) => ({
        faculty,
        sessions,
        loadBand: sessions > 12 ? 'High' : sessions >= 8 ? 'Balanced' : 'Low',
    }));
};

const optimizeTransportRoutes = (routes = []) => {
    return routes.map((route) => {
        const predictedDemand = Math.min(100, Math.round(route.utilization * 1.15));
        return {
            ...route.toObject(),
            predictedDemand,
            recommendation:
                predictedDemand > 85
                    ? 'Increase frequency'
                    : predictedDemand < 35
                        ? 'Merge with nearby route'
                        : 'Keep current schedule',
        };
    });
};

module.exports = {
    optimizeClassroomAllocation,
    calculateFacultyWorkload,
    optimizeTransportRoutes,
};
