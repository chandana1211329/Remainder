const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, assignmentController.getAssignments);
router.post('/update', authMiddleware, assignmentController.updateAssignmentStatus);

module.exports = router;
