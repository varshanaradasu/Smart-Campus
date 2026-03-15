const express = require('express');
const multer = require('multer');
const {
    getRecords,
    createRecord,
    uploadCsvRecords,
    updateRecord,
    predictMaintenance,
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, getRecords);
router.post('/', protect, authorize('admin'), createRecord);
router.post('/upload-csv', protect, authorize('admin'), upload.single('file'), uploadCsvRecords);
router.put('/:id', protect, authorize('admin'), updateRecord);
router.get('/predict', protect, authorize('admin'), predictMaintenance);

module.exports = router;
