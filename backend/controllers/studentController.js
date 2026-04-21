const studentService = require('../services/studentService');

class StudentController {
    async create(req, res, next) {
        try {
            // Создание записи о студенте
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            // Получение данных о студенте по id (json)
        } catch (error) {
            next(error);
        }
    }

    // и т.д.
}

module.exports = new StudentController();