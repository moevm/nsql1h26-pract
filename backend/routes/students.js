const express = require('express');
const { driver, NEO4J_DATABASE } = require('../config/neo4j');
const { requireAuth, requireRole } = require('../middleware/auth');
const { mapRecord } = require('../utils/neo4j');
const { asyncHandler, HttpError } = require('../utils/async');

const router = express.Router();

router.get('/me', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });

  try {
    const profileResult = await session.run(
      `MATCH (s:Student {id: $studentId})
       OPTIONAL MATCH (s)-[:HAS_SKILL]->(skill:Skill)
       RETURN s {
         .id,
         .name,
         .email,
         .degree,
         .category
       } AS student,
       collect(DISTINCT skill.name) AS skills`,
      { studentId: req.user.entityId }
    );

    if (!profileResult.records.length) {
      throw new HttpError(404, 'Студент не найден');
    }

    const profile = mapRecord(profileResult.records[0]);

    const responsesResult = await session.run(
      `MATCH (s:Student {id: $studentId})-[r:RESPONDED_TO]->(o:Offer)<-[:OFFERS_JOB]-(c:Company)
       RETURN o.id AS vacancyId,
              o.title AS title,
              c.name AS company,
              r.status AS status,
              r.createdAt AS createdAt
       ORDER BY r.createdAt DESC`,
      { studentId: req.user.entityId }
    );

    return res.json({
      student: profile.student,
      skills: profile.skills,
      applications: responsesResult.records.map((record) => mapRecord(record)),
    });
  } finally {
    await session.close();
  }
}));

module.exports = router;
