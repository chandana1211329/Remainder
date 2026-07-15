const express = require('express');
const router = express.Router();
const jsRoadmapController = require('../controllers/jsroadmap.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, jsRoadmapController.getRoadmap);
router.post('/complete', authMiddleware, jsRoadmapController.updateTopicStatus);
router.get('/revisions', authMiddleware, jsRoadmapController.getRevisions);
router.post('/revisions/complete', authMiddleware, jsRoadmapController.completeRevision);

module.exports = router;
