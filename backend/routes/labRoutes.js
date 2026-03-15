const express = require('express');
const { getLabSchedules, createLabSchedule, updateLabSchedule, deleteLabSchedule } = require('../controllers/labController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getLabSchedules);
router.post('/', protect, authorize('admin'), createLabSchedule);
router.put('/:id', protect, authorize('admin'), updateLabSchedule);
router.delete('/:id', protect, authorize('admin'), deleteLabSchedule);

module.exports = router;
