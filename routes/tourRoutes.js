const express = require('express');
const router = express.Router();
const tourController = require('../controller/tourController');

// route to get all tours
router.get('/tours', tourController.getAllTours);
router.post('/tours', tourController.saveTour);
module.exports = router;