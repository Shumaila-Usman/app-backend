const express = require('express');
const router = express.Router();
const { getContractors, createContractor, getContractor, updateContractor, deleteContractor } = require('../controllers/contractorController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getContractors).post(createContractor);
router.route('/:id').get(getContractor).put(updateContractor).delete(deleteContractor);

module.exports = router;
