const express = require('express');
const router = express.Router();
const listsController = require('../controllers/listsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', listsController.getLists);
router.put('/', listsController.updateLists);

module.exports = router;
