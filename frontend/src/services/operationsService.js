import api from './api';

export const fetchDashboardStats = async () => {
    const { data } = await api.get('/dashboard/stats');
    return data;
};

export const fetchTimetables = async () => {
    const { data } = await api.get('/timetables');
    return data;
};

export const generateTimetable = async (courses) => {
    const { data } = await api.post('/timetables/generate', { courses });
    return data;
};

export const generateAiTimetable = async () => {
    const { data } = await api.post('/ai/generate-timetable');
    return data;
};

export const generateUniversityTimetable = async (payload = {}) => {
    const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
    const { data } = await api.post('/timetable/generate', payload, config);
    return data;
};

export const fetchSectionTimetable = async (sectionCode) => {
    const { data } = await api.get(`/timetable/${sectionCode}`);
    return data;
};

export const fetchTimetablesByFilter = async ({ year, branch }) => {
    const { data } = await api.get('/timetable', {
        params: { year, branch },
    });
    return data;
};

export const resetUniversityTimetable = async () => {
    const { data } = await api.delete('/timetable/reset');
    return data;
};

export const fetchClassrooms = async () => {
    const { data } = await api.get('/classrooms');
    return data;
};

export const createClassroom = async (payload) => {
    const { data } = await api.post('/classrooms', payload);
    return data;
};

export const optimizeClassrooms = async (requests) => {
    const { data } = await api.post('/classrooms/optimize', { requests });
    return data;
};

export const fetchLabSchedules = async () => {
    const { data } = await api.get('/labs');
    return data;
};

export const createLabSchedule = async (payload) => {
    const { data } = await api.post('/labs', payload);
    return data;
};

export const fetchTransportRoutes = async () => {
    const { data } = await api.get('/transport');
    return data;
};

export const optimizeTransport = async () => {
    const { data } = await api.get('/transport/optimize');
    return data;
};

export const optimizeAiTransport = async () => {
    const { data } = await api.post('/ai/transport-optimization');
    return data;
};

export const fetchMaintenance = async () => {
    const { data } = await api.get('/maintenance');
    return data;
};

export const createMaintenanceRecord = async (payload) => {
    const { data } = await api.post('/maintenance', payload);
    return data;
};

export const uploadMaintenanceCsv = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/maintenance/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const predictMaintenance = async () => {
    const { data } = await api.get('/maintenance/predict');
    return data;
};

export const predictAiMaintenance = async () => {
    const { data } = await api.post('/ai/predict-maintenance');
    return data;
};

export const fetchFaculty = async () => {
    const { data } = await api.get('/auth/faculty');
    return data;
};

export const createFaculty = async (payload) => {
    const { data } = await api.post('/auth/faculty', payload);
    return data;
};

export const updateFaculty = async (id, payload) => {
    const { data } = await api.put(`/auth/faculty/${id}`, payload);
    return data;
};

export const deleteFaculty = async (id) => {
    const { data } = await api.delete(`/auth/faculty/${id}`);
    return data;
};
