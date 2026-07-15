const express = require('express');
const router = express.Router();
const dsaController = require('../controllers/dsa.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, dsaController.getDSATopics);
router.post('/update', authMiddleware, dsaController.updateDSAProgress);

module.exports = router;
