const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/save', authMiddleware, notesController.saveNotes);
router.get('/search', authMiddleware, notesController.searchNotes);

module.exports = router;
