const db = require('../config/neo4j');

// DAO слой для связи с БД

class StudentDao {
    async create(studentEntity) {
        const session = db.getSession();
        try {
            // Создание записи о студенте
        } finally {
            await session.close();
        }
    }

    async findById(id) {
        const session = db.getSession();
        try {
            // Поиск студента по ID
        } finally {
            await session.close();
        }
    }

    // и др.
}

module.exports = new StudentDao();