const express = require('express');
const router = express.Router();
const dailyController = require('../controllers/daily.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, dailyController.getDailyTask);
router.post('/update', authMiddleware, dailyController.updateDailyTask);

module.exports = router;
