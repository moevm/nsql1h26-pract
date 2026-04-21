const express = require('express');
const { driver, NEO4J_DATABASE } = require('../config/neo4j');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  ENTITY_TYPES,
  toCsv,
  parseImportPayload,
  fetchEntityRows,
  upsertEntity,
} = require('../services/adminDataService');
const { mapRecord } = require('../utils/neo4j');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', async (_req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });

  try {
    const result = await session.run(
      `CALL {
         MATCH (s:Student)
         RETURN count(s) AS students
       }
       CALL {
         MATCH (c:Company)
         RETURN count(c) AS companies
       }
       CALL {
         MATCH (o:Offer)
         RETURN count(o) AS vacancies
       }
       CALL {
         MATCH (sk:Skill)
         RETURN count(sk) AS skills
       }
       CALL {
         MATCH ()-[r:RESPONDED_TO]->()
         RETURN count(r) AS responses
       }
       RETURN students, companies, vacancies, skills, responses`
    );

    return res.json({ stats: mapRecord(result.records[0]) });
  } catch (error) {
    return res.status(500).json({ message: 'Не удалось загрузить статистику', details: error.message });
  } finally {
    await session.close();
  }
});

router.get('/entities/:entityType', async (req, res) => {
  const { entityType } = req.params;
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });

  try {
    const rows = await fetchEntityRows(session, entityType, req.query);
    return res.json({ entityType, rows, count: rows.length });
  } catch (error) {
    const status = ENTITY_TYPES.includes(entityType) ? 500 : 404;
    return res.status(status).json({ message: error.message || 'Не удалось загрузить данные' });
  } finally {
    await session.close();
  }
});

router.post('/entities/:entityType', async (req, res) => {
  const { entityType } = req.params;
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    let createdId = null;

    await session.executeWrite(async (tx) => {
      createdId = await upsertEntity(tx, entityType, req.body || {});
    });

    return res.status(201).json({ message: 'Запись сохранена', entityType, id: createdId });
  } catch (error) {
    const status = ENTITY_TYPES.includes(entityType) ? 400 : 404;
    return res.status(status).json({ message: error.message || 'Не удалось сохранить запись' });
  } finally {
    await session.close();
  }
});

router.get('/export/:entityType', async (req, res) => {
  const { entityType } = req.params;
  const format = String(req.query.format || 'json').toLowerCase();
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });

  try {
    const rows = await fetchEntityRows(session, entityType, {});

    if (!ENTITY_TYPES.includes(entityType)) {
      return res.status(404).json({ message: 'Неизвестный тип данных' });
    }

    if (format === 'json') {
      return res.json({
        entityType,
        format,
        filename: `${entityType}.json`,
        content: JSON.stringify({ entityType, items: rows }, null, 2),
        count: rows.length,
      });
    }

    if (format === 'csv') {
      return res.json({
        entityType,
        format,
        filename: `${entityType}.csv`,
        content: toCsv(rows),
        count: rows.length,
      });
    }

    return res.status(400).json({ message: 'Поддерживаются только форматы json и csv' });
  } catch (error) {
    const status = ENTITY_TYPES.includes(entityType) ? 500 : 404;
    return res.status(status).json({ message: error.message || 'Не удалось выполнить экспорт' });
  } finally {
    await session.close();
  }
});

router.post('/import', async (req, res) => {
  const { entityType, format = 'json', payload = '' } = req.body || {};
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const items = parseImportPayload(entityType, String(format).toLowerCase(), String(payload));
    const ids = [];

    await session.executeWrite(async (tx) => {
      for (const item of items) {
        const id = await upsertEntity(tx, entityType, item);
        ids.push(id);
      }
    });

    return res.json({
      message: `Импорт завершен. Обработано записей: ${ids.length}`,
      entityType,
      count: ids.length,
      ids,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Не удалось выполнить импорт' });
  } finally {
    await session.close();
  }
});

module.exports = router;
