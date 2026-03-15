const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Timetable = require('../models/Timetable');

dotenv.config();

const reset = async () => {
    try {
        await connectDB();
        const result = await Timetable.deleteMany({});
        console.log(`Reset complete. Deleted ${result.deletedCount} timetable documents.`);
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(`Reset failed: ${error.message}`);
        await mongoose.connection.close();
        process.exit(1);
    }
};

reset();
