const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const labRoutes = require('./routes/labRoutes');
const transportRoutes = require('./routes/transportRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const aiRoutes = require('./routes/aiRoutes');
const universityTimetableRoutes = require('./routes/universityTimetableRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL] : true,
        credentials: true,
    })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Smart Campus API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/timetable', universityTimetableRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
