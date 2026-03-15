const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/faculty', protect, (_req, res) => {
    res.status(410).json({
        success: false,
        message: 'Faculty dashboard module has been removed.',
    });
});

module.exports = router;
