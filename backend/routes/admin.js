const express = require('express');
const { driver, NEO4J_DATABASE } = require('../config/neo4j');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  ENTITY_TYPES,
  toCsv,
  parseImportPayload,
  fetchEntityRows,
  fetchEntityPage,
  fetchEntityById,
  upsertEntity,
  deleteEntity,
} = require('../services/adminDataService');
const { mapRecord } = require('../utils/neo4j');
const { asyncHandler, HttpError } = require('../utils/async');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

function assertEntityType(entityType) {
  if (!ENTITY_TYPES.includes(entityType)) {
    throw new HttpError(404, 'Неизвестный тип данных');
  }
}

router.get('/stats', asyncHandler(async (_req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });
  try {
    const result = await session.run(
      `CALL { MATCH (s:Student) RETURN count(s) AS students }
       CALL { MATCH (c:Company) RETURN count(c) AS companies }
       CALL { MATCH (o:Offer) RETURN count(o) AS vacancies }
       CALL { MATCH (sk:Skill) RETURN count(sk) AS skills }
       CALL { MATCH ()-[r:RESPONDED_TO]->() RETURN count(r) AS responses }
       RETURN students, companies, vacancies, skills, responses`
    );
    return res.json({ stats: mapRecord(result.records[0]) });
  } finally {
    await session.close();
  }
}));

router.get('/entities/:entityType', asyncHandler(async (req, res) => {
  const { entityType } = req.params;
  assertEntityType(entityType);

  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });
  try {
    const page = await fetchEntityPage(session, entityType, req.query);
    return res.json({ entityType, ...page, count: page.rows.length });
  } finally {
    await session.close();
  }
}));

router.get('/entities/:entityType/:id', asyncHandler(async (req, res) => {
  const { entityType, id } = req.params;
  assertEntityType(entityType);

  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });
  try {
    const item = await fetchEntityById(session, entityType, id);
    if (!item) {
      throw new HttpError(404, 'Запись не найдена');
    }
    return res.json({ entityType, item });
  } finally {
    await session.close();
  }
}));

router.post('/entities/:entityType', asyncHandler(async (req, res) => {
  const { entityType } = req.params;
  assertEntityType(entityType);

  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    let createdId = null;
    await session.executeWrite(async (tx) => {
      createdId = await upsertEntity(tx, entityType, req.body || {});
    });
    return res.status(201).json({ message: 'Запись сохранена', entityType, id: createdId });
  } finally {
    await session.close();
  }
}));

router.put('/entities/:entityType/:id', asyncHandler(async (req, res) => {
  const { entityType, id } = req.params;
  assertEntityType(entityType);

  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    let updatedId = null;
    await session.executeWrite(async (tx) => {
      updatedId = await upsertEntity(tx, entityType, { ...req.body, id });
    });
    return res.json({ message: 'Запись обновлена', entityType, id: updatedId });
  } finally {
    await session.close();
  }
}));

router.delete('/entities/:entityType/:id', asyncHandler(async (req, res) => {
  const { entityType, id } = req.params;
  assertEntityType(entityType);

  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    await session.executeWrite(async (tx) => {
      await deleteEntity(tx, entityType, id);
    });
    return res.json({ message: 'Запись удалена', entityType, id });
  } finally {
    await session.close();
  }
}));

router.get('/export/:entityType', asyncHandler(async (req, res) => {
  const { entityType } = req.params;
  assertEntityType(entityType);
  const format = String(req.query.format || 'json').toLowerCase();

  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });
  try {
    const rows = await fetchEntityRows(session, entityType, {});

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

    throw new HttpError(400, 'Поддерживаются только форматы json и csv');
  } finally {
    await session.close();
  }
}));

router.get('/export-all', asyncHandler(async (_req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });
  try {
    const dump = { exportedAt: new Date().toISOString(), version: 1 };
    for (const entityType of ENTITY_TYPES) {
      // eslint-disable-next-line no-await-in-loop
      dump[entityType] = await fetchEntityRows(session, entityType, {});
    }
    return res.json({
      filename: `lk-partner-dump-${new Date().toISOString().slice(0, 10)}.json`,
      content: JSON.stringify(dump, null, 2),
      counts: ENTITY_TYPES.reduce((acc, key) => ({ ...acc, [key]: dump[key].length }), {}),
    });
  } finally {
    await session.close();
  }
}));

router.post('/import', asyncHandler(async (req, res) => {
  const { entityType, format = 'json', payload = '' } = req.body || {};
  assertEntityType(entityType);

  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    const items = parseImportPayload(entityType, String(format).toLowerCase(), String(payload));
    const ids = [];
    await session.executeWrite(async (tx) => {
      for (const item of items) {
        // eslint-disable-next-line no-await-in-loop
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
  } finally {
    await session.close();
  }
}));

router.post('/import-all', asyncHandler(async (req, res) => {
  const { payload = '' } = req.body || {};

  let parsed;
  try {
    parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  } catch (e) {
    throw new HttpError(400, 'Некорректный JSON в payload');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new HttpError(400, 'Ожидался объект с данными приложения');
  }

  const order = ['skills', 'companies', 'students', 'vacancies', 'responses'];
  const counts = {};

  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    await session.executeWrite(async (tx) => {
      for (const entityType of order) {
        const items = Array.isArray(parsed[entityType]) ? parsed[entityType] : [];
        for (const item of items) {
          // eslint-disable-next-line no-await-in-loop
          await upsertEntity(tx, entityType, item);
        }
        counts[entityType] = items.length;
      }
    });

    return res.json({
      message: 'Импорт всех данных завершен',
      counts,
    });
  } finally {
    await session.close();
  }
}));

module.exports = router;
