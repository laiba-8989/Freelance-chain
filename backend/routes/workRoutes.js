const express = require('express');
const router = express.Router();
const { submitWork, approveWork } = require('../controllers/workController');
const auth = require('../middleware/auth'); // Using your existing auth middleware

// @route   POST /work
// @desc    Submit work for a contract
// @access  Private (Freelancer)
router.post('/', auth, submitWork);

// @route   POST /work/:id/approve
// @desc    Approve submitted work
// @access  Private (Client)
router.post('/:id/approve', auth, approveWork);

module.exports = router;