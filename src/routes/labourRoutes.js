const express = require('express');
const router = express.Router();
const { getLabour, createLabour, getLabourById, updateLabour, deleteLabour } = require('../controllers/labourController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getLabour).post(createLabour);
router.route('/:id').get(getLabourById).put(updateLabour).delete(deleteLabour);

module.exports = router;
