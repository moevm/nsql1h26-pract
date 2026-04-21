const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// GET /api/students
router.get('/', (req, res, next) => studentController.getAll(req, res, next));

// GET /api/students/:id
router.get('/:id', (req, res, next) => studentController.getById(req, res, next));

// и т.д.

module.exports = router;