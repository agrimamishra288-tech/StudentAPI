const toruModel = require('../models/tourModel');

// Get all tours
const getAllTours = (req, res) => {
    const tours = toruModel.getAll();
    res.json(tours)
};
