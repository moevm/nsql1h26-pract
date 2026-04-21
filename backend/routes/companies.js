const express = require('express');
const { driver, NEO4J_DATABASE } = require('../config/neo4j');
const { requireAuth, requireRole } = require('../middleware/auth');
const { mapRecord, formatSalary } = require('../utils/neo4j');

const router = express.Router();

function parseArrayParam(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (!value) {
    return [];
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

router.get('/', async (_req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });

  try {
    const result = await session.run(
      `MATCH (c:Company)
       CALL {
         WITH c
         OPTIONAL MATCH (c)-[:OFFERS_JOB]->(o:Offer)
         RETURN count(DISTINCT o) AS vacancies
       }
       CALL {
         WITH c
         OPTIONAL MATCH (c)-[:OFFERS_JOB]->(:Offer)<-[:RESPONDED_TO]-(s:Student)
         RETURN count(DISTINCT s) AS students
       }
       RETURN c {
         .id,
         .name,
         .description,
         .email,
         .phone,
         .website,
         .address,
         .year,
         .industries,
         vacancies: vacancies,
         students: students
       } AS company
       ORDER BY c.name`
    );

    return res.json({ companies: result.records.map((record) => mapRecord(record).company) });
  } catch (error) {
    return res.status(500).json({ message: 'Не удалось загрузить компании', details: error.message });
  } finally {
    await session.close();
  }
});

router.get('/me/vacancies', requireAuth, requireRole('company'), async (req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });

  try {
    const result = await session.run(
      `MATCH (:Company {id: $companyId})-[:OFFERS_JOB]->(o:Offer)
       OPTIONAL MATCH (o)-[:NEEDS_SKILL]->(skill:Skill)
       WITH o, collect(DISTINCT skill.name) AS skills
       CALL {
         WITH o
         OPTIONAL MATCH (o)<-[r:RESPONDED_TO]-(:Student)
         RETURN count(r) AS responses
       }
       RETURN o {
         .id,
         .name,
         .title,
         .capacity,
         .category,
         .workType,
         .practiceType,
         .employmentType,
         .workFormat,
         .salary,
         .postedDate,
         .responsibilities,
         .requirements,
         .conditions,
         .address,
         .directions,
         skills: skills,
         responses: responses,
         status: 'active'
       } AS vacancy
       ORDER BY o.postedDate DESC, o.title`,
      { companyId: req.user.entityId }
    );

    const vacancies = result.records.map((record) => {
      const vacancy = mapRecord(record).vacancy;
      return {
        ...vacancy,
        salaryText: formatSalary(vacancy.salary),
      };
    });

    return res.json({ vacancies });
  } catch (error) {
    return res.status(500).json({ message: 'Не удалось загрузить вакансии компании', details: error.message });
  } finally {
    await session.close();
  }
});

router.get('/me/responses', requireAuth, requireRole('company'), async (req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });
  const {
    studentName = '',
    studentEmail = '',
    status = 'all',
    vacancy = 'all',
    sort = 'newest',
    minMatch = 0,
  } = req.query;

  const categories = Array.isArray(req.query.categories)
    ? req.query.categories
    : req.query.categories
      ? String(req.query.categories).split(',').filter(Boolean)
      : [];

  const skills = parseArrayParam(req.query.skills);

  try {
    const result = await session.run(
      `MATCH (:Company {id: $companyId})-[:OFFERS_JOB]->(o:Offer)<-[resp:RESPONDED_TO]-(s:Student)
       OPTIONAL MATCH (s)-[:HAS_SKILL]->(studentSkill:Skill)
       WITH o, resp, s, collect(DISTINCT studentSkill.name) AS studentSkills
       OPTIONAL MATCH (o)-[:NEEDS_SKILL]->(offerSkill:Skill)
       WITH o, resp, s, studentSkills, collect(DISTINCT offerSkill.name) AS offerSkills
       WITH o, resp, s, studentSkills,
            CASE
              WHEN size(offerSkills) = 0 THEN 0
              ELSE toInteger(round(100.0 * size([skillName IN offerSkills WHERE skillName IN studentSkills]) / size(offerSkills)))
            END AS matchPercentage
       WHERE ($studentName = '' OR toLower(s.name) CONTAINS toLower($studentName))
         AND ($studentEmail = '' OR toLower(s.email) CONTAINS toLower($studentEmail))
         AND (size($skills) = 0 OR all(skillName IN $skills WHERE skillName IN studentSkills))
         AND ($status = 'all' OR resp.status = $status)
         AND ($vacancy = 'all' OR o.id = $vacancy)
         AND (size($categories) = 0 OR s.category IN $categories)
         AND matchPercentage >= $minMatch
       RETURN resp.id AS id,
              s.id AS studentId,
              s.name AS name,
              s.email AS email,
              s.category AS category,
              studentSkills AS skills,
              o.id AS vacancyId,
              o.title AS vacancyTitle,
              resp.createdAt AS responseDate,
              resp.status AS status,
              matchPercentage AS matchPercentage
       ORDER BY resp.createdAt DESC`,
      {
        companyId: req.user.entityId,
        studentName,
        studentEmail,
        skills,
        status,
        vacancy,
        categories,
        minMatch: Number(minMatch) || 0,
      }
    );

    let responses = result.records.map((record) => mapRecord(record));

    if (sort === 'oldest') {
      responses = responses.sort((a, b) => new Date(a.responseDate) - new Date(b.responseDate));
    } else if (sort === 'match_desc') {
      responses = responses.sort((a, b) => b.matchPercentage - a.matchPercentage);
    } else if (sort === 'name_asc') {
      responses = responses.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else {
      responses = responses.sort((a, b) => new Date(b.responseDate) - new Date(a.responseDate));
    }

    const vacanciesResult = await session.run(
      `MATCH (:Company {id: $companyId})-[:OFFERS_JOB]->(o:Offer)
       RETURN o.id AS id, o.title AS title
       ORDER BY o.title`,
      { companyId: req.user.entityId }
    );

    return res.json({
      responses,
      vacancies: vacanciesResult.records.map((record) => mapRecord(record)),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Не удалось загрузить отклики', details: error.message });
  } finally {
    await session.close();
  }
});

router.patch('/responses/:id/status', requireAuth, requireRole('company'), async (req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE });
  const { status } = req.body || {};

  if (!status) {
    return res.status(400).json({ message: 'Статус обязателен' });
  }

  try {
    const result = await session.run(
      `MATCH (:Company {id: $companyId})-[:OFFERS_JOB]->(o:Offer)<-[resp:RESPONDED_TO]-(:Student)
       WHERE resp.id = $responseId
       SET resp.status = $status
       RETURN resp.id AS id, resp.status AS status, o.id AS vacancyId`,
      {
        companyId: req.user.entityId,
        responseId: req.params.id,
        status,
      }
    );

    if (!result.records.length) {
      return res.status(404).json({ message: 'Отклик не найден' });
    }

    return res.json({ response: mapRecord(result.records[0]) });
  } catch (error) {
    return res.status(500).json({ message: 'Не удалось обновить статус', details: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
