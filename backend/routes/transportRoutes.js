const express = require('express');
const { getRoutes, createRoute, updateRoute, optimizeRoutes } = require('../controllers/transportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getRoutes);
router.post('/', protect, authorize('admin'), createRoute);
router.put('/:id', protect, authorize('admin'), updateRoute);
router.get('/optimize', protect, authorize('admin'), optimizeRoutes);

module.exports = router;
