const express = require('express');
const {
    generateTimetable,
    optimizeTransport,
    predictMaintenance,
} = require('../controllers/aiController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/generate-timetable', protect, requireAdmin, generateTimetable);
router.post('/transport-optimization', protect, requireAdmin, optimizeTransport);
router.post('/predict-maintenance', protect, requireAdmin, predictMaintenance);

module.exports = router;
