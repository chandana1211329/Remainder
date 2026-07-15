const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, settingsController.getSettings);
router.post('/update', authMiddleware, settingsController.updateSettings);

module.exports = router;
