const express = require('express');
const {
    getClassrooms,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    optimizeAllocation,
} = require('../controllers/classroomController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getClassrooms);
router.post('/', protect, authorize('admin'), createClassroom);
router.put('/:id', protect, authorize('admin'), updateClassroom);
router.delete('/:id', protect, authorize('admin'), deleteClassroom);
router.post('/optimize', protect, authorize('admin'), optimizeAllocation);

module.exports = router;
