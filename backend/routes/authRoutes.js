const express = require('express');
const {
    login,
    forgotPassword,
    verifyOtp,
    resetPassword,
    profile,
    listFaculty,
    createFaculty,
    updateFaculty,
    deleteFaculty,
} = require('../controllers/authController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, profile);
router.get('/faculty', protect, requireAdmin, listFaculty);
router.post('/faculty', protect, requireAdmin, createFaculty);
router.put('/faculty/:id', protect, requireAdmin, updateFaculty);
router.delete('/faculty/:id', protect, requireAdmin, deleteFaculty);

module.exports = router;
