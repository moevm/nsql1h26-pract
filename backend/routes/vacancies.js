const crypto = require('crypto');
const express = require('express');
const { driver, NEO4J_DATABASE } = require('../config/neo4j');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { mapRecord, formatSalary, skillId, normalizeSkillName } = require('../utils/neo4j');
const { asyncHandler, HttpError } = require('../utils/async');

const router = express.Router();

const DEFAULT_DIRECTIONS = [
  '01.03.02 Прикладная математика и информатика',
  '09.03.01 Информатика и вычислительная техника',
  '09.03.02 Информационные системы и технологии',
  '09.03.03 Прикладная информатика',
  '02.04.02 Фундаментальная информатика и информационные технологии',
  '09.04.01 Информатика и вычислительная техника',
  '01.04.02 Прикладная математика и информатика',
];

function parseArrayParam(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (!value) {
    return [];
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

router.get('/meta', asyncHandler(async (_req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });

  try {
    const skillsResult = await session.run(
      `MATCH (skill:Skill)
       WHERE trim(coalesce(skill.name, '')) <> ''
       RETURN DISTINCT skill.name AS name
       ORDER BY toLower(skill.name)`
    );

    const directionsResult = await session.run(
      `MATCH (offer:Offer)
       RETURN offer.directions AS directions`
    );

    const skills = skillsResult.records
      .map((record) => mapRecord(record).name)
      .filter(Boolean);

    const directionsFromDb = directionsResult.records
      .flatMap((record) => {
        const value = mapRecord(record).directions;
        if (Array.isArray(value)) {
          return value;
        }
        if (typeof value === 'string' && value.trim()) {
          return [value];
        }
        return [];
      })
      .map((direction) => String(direction).trim())
      .filter(Boolean);

    const directions = Array.from(new Set([
      ...DEFAULT_DIRECTIONS,
      ...directionsFromDb,
    ])).sort((left, right) => left.localeCompare(right, 'ru'));

    return res.json({ skills, directions });
  } finally {
    await session.close();
  }
}));

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });
  const {
    title = '',
    company = '',
    description = '',
    companyId = '',
    salaryFrom,
    salaryTo,
    sort = 'newest',
  } = req.query;

  const categories = parseArrayParam(req.query.categories);
  const workTypes = parseArrayParam(req.query.workTypes);
  const practiceTypes = parseArrayParam(req.query.practiceTypes);
  const employmentTypes = parseArrayParam(req.query.employmentTypes);
  const workFormats = parseArrayParam(req.query.workFormats);
  const skills = parseArrayParam(req.query.skills);

  try {
    const result = await session.run(
      `MATCH (c:Company)-[:OFFERS_JOB]->(o:Offer)
       OPTIONAL MATCH (o)-[:NEEDS_SKILL]->(skill:Skill)
       WITH c, o, collect(DISTINCT skill.name) AS skillsList
       OPTIONAL MATCH (student:Student)-[resp:RESPONDED_TO]->(o)
       WHERE $studentId <> '' AND student.id = $studentId
       WITH c, o, skillsList, count(resp) > 0 AS hasResponded
       WHERE ($companyId = '' OR c.id = $companyId)
         AND ($title = '' OR toLower(o.title) CONTAINS toLower($title))
         AND ($company = '' OR toLower(c.name) CONTAINS toLower($company))
         AND ($description = '' OR toLower(coalesce(o.responsibilities, '')) CONTAINS toLower($description)
                              OR toLower(coalesce(o.requirements, '')) CONTAINS toLower($description)
                              OR toLower(coalesce(o.conditions, '')) CONTAINS toLower($description))
         AND (size($categories) = 0 OR o.category IN $categories)
         AND (size($workTypes) = 0 OR o.workType IN $workTypes)
         AND (size($practiceTypes) = 0 OR o.practiceType IN $practiceTypes)
         AND (size($employmentTypes) = 0 OR o.employmentType IN $employmentTypes)
         AND (size($workFormats) = 0 OR o.workFormat IN $workFormats)
         AND ($salaryFrom IS NULL OR o.salary >= $salaryFrom)
         AND ($salaryTo IS NULL OR o.salary <= $salaryTo)
         AND (size($skills) = 0 OR all(skillName IN $skills WHERE skillName IN skillsList))
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
         skills: skillsList,
         company: c.name,
         companyId: c.id,
         companyFull: c.name,
         hasResponded: hasResponded
       } AS vacancy`,
      {
        companyId,
        title,
        company,
        description,
        categories,
        workTypes,
        practiceTypes,
        employmentTypes,
        workFormats,
        salaryFrom: salaryFrom ? Number(salaryFrom) : null,
        salaryTo: salaryTo ? Number(salaryTo) : null,
        skills,
        studentId: req.user?.role === 'student' ? req.user.entityId : '',
      }
    );

    let vacancies = result.records.map((record) => {
      const vacancy = mapRecord(record).vacancy;
      return {
        ...vacancy,
        salaryText: formatSalary(vacancy.salary),
      };
    });

    if (sort === 'salary_asc') {
      vacancies = vacancies.sort((a, b) => a.salary - b.salary);
    } else if (sort === 'salary_desc') {
      vacancies = vacancies.sort((a, b) => b.salary - a.salary);
    } else {
      vacancies = vacancies.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    }

    return res.json({ vacancies });
  } finally {
    await session.close();
  }
}));

router.post('/', requireAuth, requireRole('company'), asyncHandler(async (req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE });
  const {
    title,
    skills = [],
    category,
    workType,
    practiceType,
    employmentType,
    workFormat,
    salary,
    responsibilities,
    requirements,
    conditions,
    address,
    directions = [],
    capacity = 1,
  } = req.body || {};

  if (!title || !category || !workType || !employmentType || !workFormat) {
    throw new HttpError(400, 'Не заполнены обязательные поля вакансии');
  }

  const vacancyId = crypto.randomUUID();
  const normalizedSkills = [...new Set((Array.isArray(skills) ? skills : [])
    .map((skillName) => normalizeSkillName(skillName))
    .filter(Boolean))]
    .map((name) => ({ id: skillId(name), name }));

  try {
    const createdVacancy = await session.executeWrite(async (tx) => {
      const companyResult = await tx.run(
        `MATCH (c:Company {id: $companyId})
         RETURN c.id AS id, c.name AS name
         LIMIT 1`,
        { companyId: req.user.entityId }
      );

      if (!companyResult.records.length) {
        throw new HttpError(400, 'Компания не найдена');
      }

      const company = mapRecord(companyResult.records[0]);
      let existingSkills = [];

      if (normalizedSkills.length) {
        const skillsResult = await tx.run(
          `UNWIND $skillIds AS skillId
           MATCH (sk:Skill {id: skillId})
           RETURN collect({ id: sk.id, name: sk.name }) AS skills`,
          { skillIds: normalizedSkills.map((skill) => skill.id) }
        );

        existingSkills = skillsResult.records[0] ? (mapRecord(skillsResult.records[0]).skills || []) : [];

        if (existingSkills.length !== normalizedSkills.length) {
          throw new HttpError(400, 'Можно выбрать только существующие навыки из базы данных');
        }
      }

      await tx.run(
        `MATCH (c:Company {id: $companyId})
         CREATE (o:Offer {
           id: $id,
           name: $title,
           title: $title,
           capacity: $capacity,
           category: $category,
           workType: $workType,
           practiceType: $practiceType,
           employmentType: $employmentType,
           workFormat: $workFormat,
           salary: $salary,
           postedDate: $postedDate,
           responsibilities: $responsibilities,
           requirements: $requirements,
           conditions: $conditions,
           address: $address,
           directions: $directions
         })
         MERGE (c)-[:OFFERS_JOB]->(o)`,
        {
          companyId: req.user.entityId,
          id: vacancyId,
          title,
          capacity: Number(capacity) || 1,
          category,
          workType,
          practiceType: practiceType || '',
          employmentType,
          workFormat,
          salary: Number(salary) || 0,
          postedDate: new Date().toISOString().split('T')[0],
          responsibilities: responsibilities || '',
          requirements: requirements || '',
          conditions: conditions || '',
          address: address || '',
          directions: Array.isArray(directions) ? directions : [],
        }
      );

      if (existingSkills.length) {
        await tx.run(
          `MATCH (o:Offer {id: $offerId})
           UNWIND $skills AS skill
           MATCH (sk:Skill {id: skill.id})
           MERGE (o)-[:NEEDS_SKILL]->(sk)`,
          {
            offerId: vacancyId,
            skills: existingSkills,
          }
        );
      }

      return {
        id: vacancyId,
        name: title,
        title,
        capacity: Number(capacity) || 1,
        category,
        workType,
        practiceType: practiceType || '',
        employmentType,
        workFormat,
        salary: Number(salary) || 0,
        postedDate: new Date().toISOString().split('T')[0],
        responsibilities: responsibilities || '',
        requirements: requirements || '',
        conditions: conditions || '',
        address: address || '',
        directions: Array.isArray(directions) ? directions : [],
        skills: existingSkills.map((skill) => skill.name),
        company: company.name,
        companyId: company.id,
        companyFull: company.name,
        responses: 0,
        status: 'active',
      };
    });

    return res.status(201).json({
      vacancy: {
        ...createdVacancy,
        salaryText: formatSalary(createdVacancy.salary),
      },
    });
  } finally {
    await session.close();
  }
}));

router.delete('/:id', requireAuth, requireRole('company'), asyncHandler(async (req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const result = await session.executeWrite((tx) => tx.run(
      `MATCH (:Company {id: $companyId})-[:OFFERS_JOB]->(o:Offer {id: $offerId})
       DETACH DELETE o
       RETURN $offerId AS id`,
      {
        companyId: req.user.entityId,
        offerId: req.params.id,
      }
    ));

    if (!result.records.length) {
      throw new HttpError(404, 'Вакансия не найдена');
    }

    return res.json({ message: 'Вакансия удалена', id: req.params.id });
  } finally {
    await session.close();
  }
}));

router.post('/:id/respond', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE });
  const responseId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    const existing = await session.run(
      `MATCH (:Student {id: $studentId})-[r:RESPONDED_TO]->(:Offer {id: $offerId})
       RETURN r.id AS id LIMIT 1`,
      {
        studentId: req.user.entityId,
        offerId: req.params.id,
      }
    );

    if (existing.records.length) {
      throw new HttpError(409, 'Вы уже откликались на эту вакансию');
    }

    const result = await session.executeWrite(async (tx) => {
      const writeResult = await tx.run(
        `MATCH (s:Student {id: $studentId}), (o:Offer {id: $offerId})
         MERGE (s)-[r:RESPONDED_TO {id: $responseId}]->(o)
         SET r.status = 'new',
             r.createdAt = $createdAt
         WITH s, o, r
         OPTIONAL MATCH (s)-[:HAS_SKILL]->(studentSkill:Skill)
         WITH s, o, r, collect(DISTINCT studentSkill.name) AS studentSkills
         OPTIONAL MATCH (o)-[:NEEDS_SKILL]->(offerSkill:Skill)
         WITH s, o, r, studentSkills, collect(DISTINCT offerSkill.name) AS offerSkills
         WITH s, o, r,
              CASE
                WHEN size(offerSkills) = 0 THEN 100
                ELSE 100 - toInteger(round(100.0 * size([skillName IN offerSkills WHERE skillName IN studentSkills]) / size(offerSkills)))
              END AS matchDistance
         MERGE (s)-[m:MATCHES_WITH]->(o)
         SET m.matchDistance = matchDistance
         RETURN r.id AS id, r.status AS status, r.createdAt AS createdAt`,
        {
          studentId: req.user.entityId,
          offerId: req.params.id,
          responseId,
          createdAt,
        }
      );

      return writeResult.records[0] ? mapRecord(writeResult.records[0]) : null;
    });

    if (!result) {
      throw new HttpError(404, 'Вакансия не найдена');
    }

    return res.status(201).json({ response: result });
  } finally {
    await session.close();
  }
}));

module.exports = router;
