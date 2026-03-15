const express = require('express');
const { getTimetables, generateTimetables } = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getTimetables);
router.post('/generate', protect, authorize('admin'), generateTimetables);

module.exports = router;
