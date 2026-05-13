const bcrypt = require('bcryptjs');
const { driver, NEO4J_DATABASE, verifyConnection } = require('../config/neo4j');
const { skillId, normalizeSkillName } = require('../utils/neo4j');
const seed = require('./seedData');

const constraints = [
  'CREATE CONSTRAINT company_id_unique IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE',
  'CREATE CONSTRAINT student_id_unique IF NOT EXISTS FOR (s:Student) REQUIRE s.id IS UNIQUE',
  'CREATE CONSTRAINT offer_id_unique IF NOT EXISTS FOR (o:Offer) REQUIRE o.id IS UNIQUE',
  'CREATE CONSTRAINT skill_id_unique IF NOT EXISTS FOR (sk:Skill) REQUIRE sk.id IS UNIQUE',
  'CREATE CONSTRAINT admin_id_unique IF NOT EXISTS FOR (a:Admin) REQUIRE a.id IS UNIQUE',
  'CREATE CONSTRAINT company_email_unique IF NOT EXISTS FOR (c:Company) REQUIRE c.email IS UNIQUE',
  'CREATE CONSTRAINT student_email_unique IF NOT EXISTS FOR (s:Student) REQUIRE s.email IS UNIQUE',
  'CREATE CONSTRAINT admin_email_unique IF NOT EXISTS FOR (a:Admin) REQUIRE a.email IS UNIQUE',
];

function buildSkills(skills) {
  return skills.map((name) => ({
    id: skillId(name),
    name: normalizeSkillName(name),
  }));
}

function computeMatchDistance(studentSkillNames, offerSkillNames) {
  if (!offerSkillNames.length) {
    return 100;
  }
  const matches = offerSkillNames.filter((skill) => studentSkillNames.includes(skill)).length;
  const percentage = Math.round((matches / offerSkillNames.length) * 100);
  return 100 - percentage;
}

async function waitForNeo4j(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await verifyConnection();
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function isDatabaseEmpty(session) {
  const result = await session.run(
    `OPTIONAL MATCH (s:Student) WITH count(s) AS students
     OPTIONAL MATCH (c:Company) WITH students, count(c) AS companies
     OPTIONAL MATCH (o:Offer) WITH students, companies, count(o) AS offers
     OPTIONAL MATCH (a:Admin) WITH students, companies, offers, count(a) AS admins
     RETURN students + companies + offers + admins AS total`
  );
  const total = result.records[0]?.get('total');
  const value = typeof total === 'object' && total !== null && 'toNumber' in total ? total.toNumber() : Number(total || 0);
  return value === 0;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function applyConstraints(session) {
  for (const statement of constraints) {
    await session.run(statement);
  }
}

async function seedAll(session) {
  await session.run(
    `MERGE (a:Admin {id: $id})
     SET a.name = $name, a.email = $email, a.password = $password, a.role = $role`,
    { ...seed.admin, password: await hashPassword(seed.admin.password) }
  );

  for (const company of seed.companies) {
    await session.run(
      `MERGE (c:Company {id: $id})
       SET c.name = $name, c.email = $email, c.password = $password,
           c.description = $description, c.phone = $phone, c.website = $website,
           c.address = $address, c.year = $year, c.industries = $industries`,
      { ...company, password: await hashPassword(company.password) }
    );
  }

  for (const student of seed.students) {
    await session.run(
      `MERGE (s:Student {id: $id})
       SET s.name = $name, s.email = $email, s.password = $password,
           s.degree = $degree, s.category = $category`,
      { ...student, password: await hashPassword(student.password) }
    );

    const studentSkills = buildSkills(student.skills);
    await session.run(
      `MATCH (s:Student {id: $studentId})
       UNWIND $skills AS skill
       MERGE (sk:Skill {id: skill.id}) ON CREATE SET sk.name = skill.name ON MATCH SET sk.name = skill.name
       MERGE (s)-[:HAS_SKILL]->(sk)`,
      { studentId: student.id, skills: studentSkills }
    );
  }

  for (const offer of seed.offers) {
    const offerSkills = buildSkills(offer.skills);
    await session.run(
      `MATCH (c:Company {id: $companyId})
       MERGE (o:Offer {id: $id})
       SET o.name = $title, o.title = $title, o.capacity = $capacity,
           o.category = $category, o.workType = $workType, o.practiceType = $practiceType,
           o.employmentType = $employmentType, o.workFormat = $workFormat, o.salary = $salary,
           o.postedDate = $postedDate, o.responsibilities = $responsibilities,
           o.requirements = $requirements, o.conditions = $conditions,
           o.address = $address, o.directions = $directions
       MERGE (c)-[:OFFERS_JOB]->(o)`,
      offer
    );

    await session.run(
      `MATCH (o:Offer {id: $offerId})
       UNWIND $skills AS skill
       MERGE (sk:Skill {id: skill.id}) ON CREATE SET sk.name = skill.name ON MATCH SET sk.name = skill.name
       MERGE (o)-[:NEEDS_SKILL]->(sk)`,
      { offerId: offer.id, skills: offerSkills }
    );
  }

  for (const [skillA, skillB, matchDistance] of seed.skillPairs) {
    await session.run(
      `MATCH (a:Skill {id: $skillA}), (b:Skill {id: $skillB})
       MERGE (a)-[r:MATCHES_WITH]->(b)
       SET r.matchDistance = $matchDistance`,
      { skillA: skillId(skillA), skillB: skillId(skillB), matchDistance }
    );
  }

  for (const response of seed.responses) {
    const offer = seed.offers.find((item) => item.id === response.offerId);
    const student = seed.students.find((item) => item.id === response.studentId);
    if (!offer || !student) continue;
    const matchDistance = computeMatchDistance(student.skills, offer.skills);

    await session.run(
      `MATCH (s:Student {id: $studentId}), (o:Offer {id: $offerId})
       MERGE (s)-[r:RESPONDED_TO {id: $id}]->(o)
       SET r.status = $status, r.createdAt = $createdAt
       MERGE (s)-[m:MATCHES_WITH]->(o)
       SET m.matchDistance = $matchDistance`,
      { ...response, matchDistance }
    );
  }
}

async function initDatabase() {
  await waitForNeo4j();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    await applyConstraints(session);

    if (await isDatabaseEmpty(session)) {
      // eslint-disable-next-line no-console
      console.log('[seed] Database is empty, loading seed dump...');
      await seedAll(session);
      // eslint-disable-next-line no-console
      console.log('[seed] Done.');
    } else {
      // eslint-disable-next-line no-console
      console.log('[seed] Database already populated, skipping seed.');
    }
  } finally {
    await session.close();
  }
}

module.exports = {
  initDatabase,
};
