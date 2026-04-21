const studentDao = require('../dao/studentDao');
const Student = require('../entities/student');

// Сервисный слой с бизнес-логикой

class StudentService {
    async registerStudent(first_name, second_name, middle_name, group_number, email, skills) {
        // Регистрация студента
    }

    async getStudentById(id) {
        // Поиск студента по Id
    }

    // и др.
}

module.exports = new StudentService();