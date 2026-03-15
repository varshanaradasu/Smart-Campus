const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config();

const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Mathematics', 'Physics'];
const names = [
    'Aarav Sharma',
    'Diya Iyer',
    'Rohan Patel',
    'Meera Nair',
    'Karthik Rao',
    'Neha Singh',
    'Vikram Joshi',
    'Ananya Das',
    'Rahul Verma',
    'Sneha Kapoor',
];

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

const seedUsers = async () => {
    try {
        await connectDB();

        await User.deleteMany({ role: { $in: ['admin', 'faculty'] } });

        const admin = {
            name: 'Campus Admin',
            email: 'admin@campus.com',
            password: 'admin123',
            role: 'admin',
            department: 'Administration',
        };

        const facultyUsers = Array.from({ length: 5 }).map((_, index) => ({
            name: pickRandom(names),
            email: `faculty${index + 1}@campus.com`,
            password: 'faculty123',
            role: 'faculty',
            department: pickRandom(departments),
        }));

        await User.create([admin, ...facultyUsers]);

        console.log('Seed complete.');
        console.log('Admin: admin@campus.com / admin123');
        console.log('Faculty: faculty1@campus.com..faculty5@campus.com / faculty123');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(`Seed failed: ${error.message}`);
        await mongoose.connection.close();
        process.exit(1);
    }
};

seedUsers();
