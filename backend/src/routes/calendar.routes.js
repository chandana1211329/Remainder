const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, calendarController.getCalendarData);

module.exports = router;
