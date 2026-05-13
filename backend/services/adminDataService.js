const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { skillId, normalizeSkillName, mapRecord } = require('../utils/neo4j');

const ENTITY_TYPES = ['students', 'companies', 'vacancies', 'skills', 'responses'];

async function maybeHash(password) {
  const value = String(password || '');
  if (!value) return '';
  if (value.startsWith('$2')) return value;
  return bcrypt.hash(value, 10);
}

function parseText(value) {
  return value == null ? '' : String(value).trim();
}

function parseNumber(value) {
  if (value === '' || value == null) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => parseText(item))
      .filter(Boolean);
  }

  const text = parseText(value);
  if (!text) {
    return [];
  }

  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => parseText(item)).filter(Boolean);
      }
    } catch (_error) {
      // ignore and continue with split fallback
    }
  }

  return text
    .split(/[,;|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeCsvValue(value) {
  const stringValue = Array.isArray(value)
    ? value.join(' | ')
    : value == null
      ? ''
      : String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function toCsv(rows) {
  const headers = rows.length
    ? Array.from(
        rows.reduce((set, row) => {
          Object.keys(row).forEach((key) => set.add(key));
          return set;
        }, new Set())
      )
    : [];

  const lines = [headers.join(',')];

  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeCsvValue(row[header])).join(','));
  });

  return lines.join('\n');
}

function parseCsv(content) {
  const lines = String(content)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] ?? '';
    });
    return item;
  });
}

function buildSkillObjects(skills) {
  return parseList(skills).map((name) => ({
    id: skillId(name),
    name: normalizeSkillName(name),
  }));
}

function normalizeEntityItem(entityType, item) {
  const source = item || {};

  switch (entityType) {
    case 'students':
      return {
        id: parseText(source.id) || crypto.randomUUID(),
        name: parseText(source.name),
        email: parseText(source.email),
        password: parseText(source.password),
        degree: parseText(source.degree),
        category: parseText(source.category),
        skills: buildSkillObjects(source.skills),
      };
    case 'companies':
      return {
        id: parseText(source.id) || crypto.randomUUID(),
        name: parseText(source.name),
        email: parseText(source.email),
        password: parseText(source.password),
        description: parseText(source.description),
        phone: parseText(source.phone),
        website: parseText(source.website),
        address: parseText(source.address),
        year: parseNumber(source.year) || new Date().getFullYear(),
        industries: parseList(source.industries),
      };
    case 'vacancies':
      return {
        id: parseText(source.id) || crypto.randomUUID(),
        companyId: parseText(source.companyId),
        title: parseText(source.title || source.name),
        capacity: parseNumber(source.capacity) || 1,
        category: parseText(source.category),
        workType: parseText(source.workType),
        practiceType: parseText(source.practiceType),
        employmentType: parseText(source.employmentType),
        workFormat: parseText(source.workFormat),
        salary: parseNumber(source.salary) || 0,
        postedDate: parseText(source.postedDate) || new Date().toISOString().slice(0, 10),
        responsibilities: parseText(source.responsibilities),
        requirements: parseText(source.requirements),
        conditions: parseText(source.conditions),
        address: parseText(source.address),
        directions: parseList(source.directions),
        skills: buildSkillObjects(source.skills),
      };
    case 'skills': {
      const name = parseText(source.name);
      return {
        id: parseText(source.id) || skillId(name),
        name,
      };
    }
    case 'responses':
      return {
        id: parseText(source.id) || crypto.randomUUID(),
        studentId: parseText(source.studentId),
        offerId: parseText(source.offerId || source.vacancyId),
        status: parseText(source.status) || 'new',
        createdAt: parseText(source.createdAt) || new Date().toISOString(),
      };
    default:
      throw new Error('Неизвестный тип данных');
  }
}

function validateEntityItem(entityType, item) {
  switch (entityType) {
    case 'students':
      if (!item.name || !item.email) {
        throw new Error('Для студента обязательны поля name и email');
      }
      break;
    case 'companies':
      if (!item.name || !item.email) {
        throw new Error('Для компании обязательны поля name и email');
      }
      break;
    case 'vacancies':
      if (!item.companyId || !item.title) {
        throw new Error('Для вакансии обязательны поля companyId и title');
      }
      break;
    case 'skills':
      if (!item.name) {
        throw new Error('Для навыка обязательно поле name');
      }
      break;
    case 'responses':
      if (!item.studentId || !item.offerId) {
        throw new Error('Для отклика обязательны поля studentId и offerId');
      }
      break;
    default:
      break;
  }
}

async function upsertStudent(tx, item) {
  const hasPassword = !!item.password;
  const password = hasPassword ? await maybeHash(item.password) : '';
  const defaultPassword = await maybeHash('student123');
  await tx.run(
    `MERGE (s:Student {id: $id})
     SET s.name = $name,
         s.email = $email,
         s.degree = $degree,
         s.category = $category
     FOREACH (_ IN CASE WHEN $hasPassword THEN [1] ELSE [] END | SET s.password = $password)
     FOREACH (_ IN CASE WHEN NOT $hasPassword AND coalesce(s.password,'') = '' THEN [1] ELSE [] END | SET s.password = $defaultPassword)`,
    { ...item, password, hasPassword, defaultPassword }
  );

  await tx.run(
    `MATCH (s:Student {id: $studentId})
     OPTIONAL MATCH (s)-[rel:HAS_SKILL]->(:Skill)
     DELETE rel`,
    { studentId: item.id }
  );

  if (item.skills.length) {
    await tx.run(
      `MATCH (s:Student {id: $studentId})
       UNWIND $skills AS skill
       MERGE (sk:Skill {id: skill.id})
         ON CREATE SET sk.name = skill.name
         ON MATCH SET sk.name = skill.name
       MERGE (s)-[:HAS_SKILL]->(sk)`,
      { studentId: item.id, skills: item.skills }
    );
  }
}

async function upsertCompany(tx, item) {
  const hasPassword = !!item.password;
  const password = hasPassword ? await maybeHash(item.password) : '';
  const defaultPassword = await maybeHash('company123');
  await tx.run(
    `MERGE (c:Company {id: $id})
     SET c.name = $name,
         c.email = $email,
         c.description = $description,
         c.phone = $phone,
         c.website = $website,
         c.address = $address,
         c.year = $year,
         c.industries = $industries
     FOREACH (_ IN CASE WHEN $hasPassword THEN [1] ELSE [] END | SET c.password = $password)
     FOREACH (_ IN CASE WHEN NOT $hasPassword AND coalesce(c.password,'') = '' THEN [1] ELSE [] END | SET c.password = $defaultPassword)`,
    { ...item, password, hasPassword, defaultPassword }
  );
}

async function resolveExistingSkills(tx, skills) {
  if (!skills.length) {
    return [];
  }

  const result = await tx.run(
    `UNWIND $skillIds AS skillId
     MATCH (sk:Skill {id: skillId})
     RETURN collect({ id: sk.id, name: sk.name }) AS skills`,
    { skillIds: skills.map((skill) => skill.id) }
  );

  const existingSkills = result.records[0] ? (mapRecord(result.records[0]).skills || []) : []; 

  if (existingSkills.length !== skills.length) {
    throw new Error('Для вакансии можно выбрать только существующие навыки');
  }

  return existingSkills;
}

async function upsertVacancy(tx, item) {
  const companyCheck = await tx.run(
    `MATCH (c:Company {id: $companyId}) RETURN c.id AS id LIMIT 1`,
    { companyId: item.companyId }
  );

  if (!companyCheck.records.length) {
    throw new Error(`Компания ${item.companyId} не найдена`);
  }

  const existingSkills = await resolveExistingSkills(tx, item.skills);

  await tx.run(
    `MATCH (c:Company {id: $companyId})
     MERGE (o:Offer {id: $id})
     SET o.name = $title,
         o.title = $title,
         o.capacity = $capacity,
         o.category = $category,
         o.workType = $workType,
         o.practiceType = $practiceType,
         o.employmentType = $employmentType,
         o.workFormat = $workFormat,
         o.salary = $salary,
         o.postedDate = $postedDate,
         o.responsibilities = $responsibilities,
         o.requirements = $requirements,
         o.conditions = $conditions,
         o.address = $address,
         o.directions = $directions
     WITH c, o
     OPTIONAL MATCH (:Company)-[oldRel:OFFERS_JOB]->(o)
     DELETE oldRel
     WITH c, o
     MERGE (c)-[:OFFERS_JOB]->(o)`,
    item
  );

  await tx.run(
    `MATCH (o:Offer {id: $offerId})
     OPTIONAL MATCH (o)-[rel:NEEDS_SKILL]->(:Skill)
     DELETE rel`,
    { offerId: item.id }
  );

  if (existingSkills.length) {
    await tx.run(
      `MATCH (o:Offer {id: $offerId})
       UNWIND $skills AS skill
       MATCH (sk:Skill {id: skill.id})
       MERGE (o)-[:NEEDS_SKILL]->(sk)`,
      { offerId: item.id, skills: existingSkills }
    );
  }
}

async function upsertSkill(tx, item) {
  await tx.run(
    `MERGE (sk:Skill {id: $id})
     SET sk.name = $name`,
    item
  );
}

async function upsertResponse(tx, item) {
  const relationCheck = await tx.run(
    `MATCH (s:Student {id: $studentId}), (o:Offer {id: $offerId})
     RETURN s.id AS studentId, o.id AS offerId LIMIT 1`,
    { studentId: item.studentId, offerId: item.offerId }
  );

  if (!relationCheck.records.length) {
    throw new Error('Для отклика должны существовать studentId и offerId');
  }

  await tx.run(
    `MATCH (s:Student {id: $studentId}), (o:Offer {id: $offerId})
     MERGE (s)-[r:RESPONDED_TO {id: $id}]->(o)
     SET r.status = $status,
         r.createdAt = $createdAt`,
    item
  );

  await tx.run(
    `MATCH (s:Student {id: $studentId}), (o:Offer {id: $offerId})
     OPTIONAL MATCH (s)-[:HAS_SKILL]->(studentSkill:Skill)
     WITH s, o, collect(DISTINCT studentSkill.name) AS studentSkills
     OPTIONAL MATCH (o)-[:NEEDS_SKILL]->(offerSkill:Skill)
     WITH s, o, studentSkills, collect(DISTINCT offerSkill.name) AS offerSkills
     WITH s, o,
          CASE
            WHEN size(offerSkills) = 0 THEN 100
            ELSE 100 - toInteger(round(100.0 * size([skillName IN offerSkills WHERE skillName IN studentSkills]) / size(offerSkills)))
          END AS matchDistance
     MERGE (s)-[m:MATCHES_WITH]->(o)
     SET m.matchDistance = matchDistance`,
    item
  );
}

async function upsertEntity(tx, entityType, rawItem) {
  const item = normalizeEntityItem(entityType, rawItem);
  validateEntityItem(entityType, item);

  if (entityType === 'students') {
    await upsertStudent(tx, item);
  } else if (entityType === 'companies') {
    await upsertCompany(tx, item);
  } else if (entityType === 'vacancies') {
    await upsertVacancy(tx, item);
  } else if (entityType === 'skills') {
    await upsertSkill(tx, item);
  } else if (entityType === 'responses') {
    await upsertResponse(tx, item);
  }

  return item.id;
}

async function fetchStudents(session, filters = {}) {
  const result = await session.run(
    `MATCH (s:Student)
     OPTIONAL MATCH (s)-[:HAS_SKILL]->(skill:Skill)
     WITH s, collect(DISTINCT skill.name) AS skills
     WHERE ($id = '' OR toLower(s.id) CONTAINS toLower($id))
       AND ($name = '' OR toLower(s.name) CONTAINS toLower($name))
       AND ($email = '' OR toLower(s.email) CONTAINS toLower($email))
       AND ($degree = '' OR toLower(coalesce(s.degree, '')) CONTAINS toLower($degree))
       AND ($category = '' OR toLower(coalesce(s.category, '')) CONTAINS toLower($category))
       AND ($skill = '' OR any(skillName IN skills WHERE toLower(skillName) CONTAINS toLower($skill)))
     RETURN {
       id: s.id,
       name: s.name,
       email: s.email,
       degree: s.degree,
       category: s.category,
       skills: skills
     } AS row
     ORDER BY s.name, s.email`,
    {
      id: parseText(filters.id),
      name: parseText(filters.name),
      email: parseText(filters.email),
      degree: parseText(filters.degree),
      category: parseText(filters.category),
      skill: parseText(filters.skill),
    }
  );

  return result.records.map((record) => mapRecord(record).row);
}

async function fetchCompanies(session, filters = {}) {
  const result = await session.run(
    `MATCH (c:Company)
     WITH c
     WHERE ($id = '' OR toLower(c.id) CONTAINS toLower($id))
       AND ($name = '' OR toLower(c.name) CONTAINS toLower($name))
       AND ($email = '' OR toLower(c.email) CONTAINS toLower($email))
       AND ($description = '' OR toLower(coalesce(c.description, '')) CONTAINS toLower($description))
       AND ($phone = '' OR toLower(coalesce(c.phone, '')) CONTAINS toLower($phone))
       AND ($website = '' OR toLower(coalesce(c.website, '')) CONTAINS toLower($website))
       AND ($address = '' OR toLower(coalesce(c.address, '')) CONTAINS toLower($address))
       AND ($industry = '' OR any(industry IN coalesce(c.industries, []) WHERE toLower(industry) CONTAINS toLower($industry)))
       AND ($yearFrom IS NULL OR c.year >= $yearFrom)
       AND ($yearTo IS NULL OR c.year <= $yearTo)
     RETURN {
       id: c.id,
       name: c.name,
       email: c.email,
       description: c.description,
       phone: c.phone,
       website: c.website,
       address: c.address,
       year: c.year,
       industries: coalesce(c.industries, [])
     } AS row
     ORDER BY c.name`,
    {
      id: parseText(filters.id),
      name: parseText(filters.name),
      email: parseText(filters.email),
      description: parseText(filters.description),
      phone: parseText(filters.phone),
      website: parseText(filters.website),
      address: parseText(filters.address),
      industry: parseText(filters.industry),
      yearFrom: parseNumber(filters.yearFrom),
      yearTo: parseNumber(filters.yearTo),
    }
  );

  return result.records.map((record) => mapRecord(record).row);
}

async function fetchVacancies(session, filters = {}) {
  const result = await session.run(
    `MATCH (c:Company)-[:OFFERS_JOB]->(o:Offer)
     OPTIONAL MATCH (o)-[:NEEDS_SKILL]->(skill:Skill)
     WITH c, o, collect(DISTINCT skill.name) AS skills
     WHERE ($id = '' OR toLower(o.id) CONTAINS toLower($id))
       AND ($title = '' OR toLower(coalesce(o.title, '')) CONTAINS toLower($title))
       AND ($companyId = '' OR toLower(c.id) CONTAINS toLower($companyId))
       AND ($companyName = '' OR toLower(c.name) CONTAINS toLower($companyName))
       AND ($category = '' OR toLower(coalesce(o.category, '')) CONTAINS toLower($category))
       AND ($workType = '' OR toLower(coalesce(o.workType, '')) CONTAINS toLower($workType))
       AND ($practiceType = '' OR toLower(coalesce(o.practiceType, '')) CONTAINS toLower($practiceType))
       AND ($employmentType = '' OR toLower(coalesce(o.employmentType, '')) CONTAINS toLower($employmentType))
       AND ($workFormat = '' OR toLower(coalesce(o.workFormat, '')) CONTAINS toLower($workFormat))
       AND ($address = '' OR toLower(coalesce(o.address, '')) CONTAINS toLower($address))
       AND ($skill = '' OR any(skillName IN skills WHERE toLower(skillName) CONTAINS toLower($skill)))
       AND ($direction = '' OR any(direction IN coalesce(o.directions, []) WHERE toLower(direction) CONTAINS toLower($direction)))
       AND ($salaryFrom IS NULL OR o.salary >= $salaryFrom)
       AND ($salaryTo IS NULL OR o.salary <= $salaryTo)
       AND ($capacityFrom IS NULL OR o.capacity >= $capacityFrom)
       AND ($capacityTo IS NULL OR o.capacity <= $capacityTo)
       AND ($postedDateFrom = '' OR coalesce(o.postedDate, '') >= $postedDateFrom)
       AND ($postedDateTo = '' OR coalesce(o.postedDate, '') <= $postedDateTo)
     RETURN {
       id: o.id,
       title: o.title,
       companyId: c.id,
       companyName: c.name,
       capacity: o.capacity,
       category: o.category,
       workType: o.workType,
       practiceType: o.practiceType,
       employmentType: o.employmentType,
       workFormat: o.workFormat,
       salary: o.salary,
       postedDate: o.postedDate,
       responsibilities: o.responsibilities,
       requirements: o.requirements,
       conditions: o.conditions,
       address: o.address,
       directions: coalesce(o.directions, []),
       skills: skills
     } AS row
     ORDER BY o.postedDate DESC, o.title`,
    {
      id: parseText(filters.id),
      title: parseText(filters.title),
      companyId: parseText(filters.companyId),
      companyName: parseText(filters.companyName),
      category: parseText(filters.category),
      workType: parseText(filters.workType),
      practiceType: parseText(filters.practiceType),
      employmentType: parseText(filters.employmentType),
      workFormat: parseText(filters.workFormat),
      address: parseText(filters.address),
      skill: parseText(filters.skill),
      direction: parseText(filters.direction),
      salaryFrom: parseNumber(filters.salaryFrom),
      salaryTo: parseNumber(filters.salaryTo),
      capacityFrom: parseNumber(filters.capacityFrom),
      capacityTo: parseNumber(filters.capacityTo),
      postedDateFrom: parseText(filters.postedDateFrom),
      postedDateTo: parseText(filters.postedDateTo),
    }
  );

  return result.records.map((record) => mapRecord(record).row);
}

async function fetchSkills(session, filters = {}) {
  const result = await session.run(
    `MATCH (sk:Skill)
     OPTIONAL MATCH (sk)<-[:HAS_SKILL]-(s:Student)
     WITH sk, count(DISTINCT s) AS studentsCount
     OPTIONAL MATCH (sk)<-[:NEEDS_SKILL]-(o:Offer)
     WITH sk, studentsCount, count(DISTINCT o) AS vacanciesCount
     WHERE ($id = '' OR toLower(sk.id) CONTAINS toLower($id))
       AND ($name = '' OR toLower(sk.name) CONTAINS toLower($name))
       AND ($studentsFrom IS NULL OR studentsCount >= $studentsFrom)
       AND ($studentsTo IS NULL OR studentsCount <= $studentsTo)
       AND ($vacanciesFrom IS NULL OR vacanciesCount >= $vacanciesFrom)
       AND ($vacanciesTo IS NULL OR vacanciesCount <= $vacanciesTo)
     RETURN {
       id: sk.id,
       name: sk.name,
       studentsCount: studentsCount,
       vacanciesCount: vacanciesCount
     } AS row
     ORDER BY sk.name`,
    {
      id: parseText(filters.id),
      name: parseText(filters.name),
      studentsFrom: parseNumber(filters.studentsFrom),
      studentsTo: parseNumber(filters.studentsTo),
      vacanciesFrom: parseNumber(filters.vacanciesFrom),
      vacanciesTo: parseNumber(filters.vacanciesTo),
    }
  );

  return result.records.map((record) => mapRecord(record).row);
}

async function fetchResponses(session, filters = {}) {
  const result = await session.run(
    `MATCH (s:Student)-[r:RESPONDED_TO]->(o:Offer)<-[:OFFERS_JOB]-(c:Company)
     OPTIONAL MATCH (s)-[m:MATCHES_WITH]->(o)
     WITH s, r, o, c, m
     WHERE ($id = '' OR toLower(r.id) CONTAINS toLower($id))
       AND ($studentId = '' OR toLower(s.id) CONTAINS toLower($studentId))
       AND ($studentName = '' OR toLower(s.name) CONTAINS toLower($studentName))
       AND ($studentEmail = '' OR toLower(s.email) CONTAINS toLower($studentEmail))
       AND ($studentCategory = '' OR toLower(coalesce(s.category, '')) CONTAINS toLower($studentCategory))
       AND ($offerId = '' OR toLower(o.id) CONTAINS toLower($offerId))
       AND ($vacancyTitle = '' OR toLower(coalesce(o.title, '')) CONTAINS toLower($vacancyTitle))
       AND ($companyName = '' OR toLower(c.name) CONTAINS toLower($companyName))
       AND ($status = '' OR toLower(coalesce(r.status, '')) CONTAINS toLower($status))
       AND ($createdAtFrom = '' OR coalesce(r.createdAt, '') >= $createdAtFrom)
       AND ($createdAtTo = '' OR coalesce(r.createdAt, '') <= $createdAtTo)
       AND ($matchDistanceFrom IS NULL OR coalesce(m.matchDistance, 0) >= $matchDistanceFrom)
       AND ($matchDistanceTo IS NULL OR coalesce(m.matchDistance, 0) <= $matchDistanceTo)
     RETURN {
       id: r.id,
       studentId: s.id,
       studentName: s.name,
       studentEmail: s.email,
       studentCategory: s.category,
       offerId: o.id,
       vacancyTitle: o.title,
       companyName: c.name,
       status: r.status,
       createdAt: r.createdAt,
       matchDistance: m.matchDistance
     } AS row
     ORDER BY r.createdAt DESC`,
    {
      id: parseText(filters.id),
      studentId: parseText(filters.studentId),
      studentName: parseText(filters.studentName),
      studentEmail: parseText(filters.studentEmail),
      studentCategory: parseText(filters.studentCategory),
      offerId: parseText(filters.offerId),
      vacancyTitle: parseText(filters.vacancyTitle),
      companyName: parseText(filters.companyName),
      status: parseText(filters.status),
      createdAtFrom: parseText(filters.createdAtFrom),
      createdAtTo: parseText(filters.createdAtTo),
      matchDistanceFrom: parseNumber(filters.matchDistanceFrom),
      matchDistanceTo: parseNumber(filters.matchDistanceTo),
    }
  );

  return result.records.map((record) => mapRecord(record).row);
}

async function fetchEntityRows(session, entityType, filters = {}) {
  if (!ENTITY_TYPES.includes(entityType)) {
    throw new Error('Неизвестный тип данных');
  }

  if (entityType === 'students') {
    return fetchStudents(session, filters);
  }
  if (entityType === 'companies') {
    return fetchCompanies(session, filters);
  }
  if (entityType === 'vacancies') {
    return fetchVacancies(session, filters);
  }
  if (entityType === 'skills') {
    return fetchSkills(session, filters);
  }
  return fetchResponses(session, filters);
}

function paginate(rows, page, pageSize) {
  const total = rows.length;
  const safePageSize = Math.max(1, Math.min(500, Number(pageSize) || 20));
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.max(1, Math.min(totalPages, Number(page) || 1));
  const start = (safePage - 1) * safePageSize;
  return {
    rows: rows.slice(start, start + safePageSize),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

async function fetchEntityPage(session, entityType, query = {}) {
  const { page, pageSize, ...filters } = query;
  const rows = await fetchEntityRows(session, entityType, filters);
  return paginate(rows, page, pageSize);
}

async function fetchEntityById(session, entityType, id) {
  const rows = await fetchEntityRows(session, entityType, { id });
  return rows.find((row) => row.id === id) || rows[0] || null;
}

async function deleteEntity(tx, entityType, id) {
  if (!ENTITY_TYPES.includes(entityType)) {
    throw new Error('Неизвестный тип данных');
  }

  const map = {
    students: 'MATCH (n:Student {id: $id}) DETACH DELETE n',
    companies: 'MATCH (n:Company {id: $id}) DETACH DELETE n',
    vacancies: 'MATCH (n:Offer {id: $id}) DETACH DELETE n',
    skills: 'MATCH (n:Skill {id: $id}) DETACH DELETE n',
    responses: 'MATCH ()-[r:RESPONDED_TO {id: $id}]->() DELETE r',
  };

  await tx.run(map[entityType], { id });
}

function parseImportPayload(entityType, format, payload) {
  if (!ENTITY_TYPES.includes(entityType)) {
    throw new Error('Неизвестный тип данных для импорта');
  }

  if (format === 'json') {
    const parsed = JSON.parse(payload);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed.items)) {
      return parsed.items;
    }
    if (Array.isArray(parsed[entityType])) {
      return parsed[entityType];
    }
    throw new Error('JSON должен содержать массив записей');
  }

  if (format === 'csv') {
    return parseCsv(payload);
  }

  throw new Error('Поддерживаются только форматы json и csv');
}

module.exports = {
  ENTITY_TYPES,
  toCsv,
  parseImportPayload,
  fetchEntityRows,
  fetchEntityPage,
  fetchEntityById,
  upsertEntity,
  deleteEntity,
};
