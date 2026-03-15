const express = require('express');
const multer = require('multer');
const {
    listTimetables,
    generateTimetable,
    getTimetableBySection,
    resetTimetable,
} = require('../controllers/universityTimetableController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, listTimetables);
router.post(
    '/generate',
    protect,
    requireAdmin,
    upload.fields([
        { name: 'facultiesFile', maxCount: 1 },
        { name: 'classroomsFile', maxCount: 1 },
        { name: 'sectionsFile', maxCount: 1 },
    ]),
    generateTimetable
);
router.delete('/reset', protect, requireAdmin, resetTimetable);
router.get('/:section', protect, getTimetableBySection);

module.exports = router;
