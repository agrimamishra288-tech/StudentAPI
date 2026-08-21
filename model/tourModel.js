const fs = require('fs');
const path = require('path');
const tourFilePath = path.join(__dirname, '../data/tours.json');

const getAll = () => {
    const toursData = fs.readFileSync(tourFilePath, 'utf-8');
    return JSON.parse(toursData);
};


