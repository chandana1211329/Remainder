const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/reset', authMiddleware, adminController.resetProgress);
router.get('/backup', authMiddleware, adminController.backupDatabase);
router.post('/restore', authMiddleware, adminController.restoreDatabase);
router.post('/import/js', authMiddleware, adminController.importJSRoadmap);
router.post('/import/dsa', authMiddleware, adminController.importDSATopics);
router.post('/import/assignments', authMiddleware, adminController.importAssignments);

module.exports = router;
