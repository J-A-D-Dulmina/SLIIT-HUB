const express = require('express');
const router = express.Router();
const degreeController = require('./degree.controller');
// const { authenticateAdmin } = require('../../middleware/auth'); // Uncomment if admin auth middleware exists

// router.use(authenticateAdmin); // Protect all routes if admin auth is available

router.post('/', degreeController.createDegree);
router.get('/', degreeController.getDegrees);
router.get('/:id', degreeController.getDegreeById);
router.put('/:id', degreeController.updateDegree);
router.delete('/:id', degreeController.deleteDegree);

module.exports = router; 