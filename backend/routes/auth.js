const express = require('express');
const bcrypt = require('bcryptjs');
const { driver, NEO4J_DATABASE } = require('../config/neo4j');
const { mapRecord } = require('../utils/neo4j');
const { signToken, requireAuth } = require('../middleware/auth');
const { asyncHandler, HttpError } = require('../utils/async');

const router = express.Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { email = '', password = '' } = req.body || {};

  if (!email || !password) {
    throw new HttpError(400, 'Email и пароль обязательны');
  }

  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });

  try {
    const result = await session.run(
      `CALL {
         MATCH (s:Student {email: $email})
         RETURN s.id AS entityId, s.name AS name, s.email AS email, s.password AS passwordHash, 'student' AS role
         UNION
         MATCH (c:Company {email: $email})
         RETURN c.id AS entityId, c.name AS name, c.email AS email, c.password AS passwordHash, 'company' AS role
         UNION
         MATCH (a:Admin {email: $email})
         RETURN a.id AS entityId, a.name AS name, a.email AS email, a.password AS passwordHash, 'admin' AS role
       }
       RETURN entityId, name, email, passwordHash, role
       LIMIT 1`,
      { email }
    );

    if (!result.records.length) {
      throw new HttpError(401, 'Неверный логин или пароль');
    }

    const record = mapRecord(result.records[0]);
    const passwordHash = record.passwordHash || '';

    let ok = false;
    if (passwordHash.startsWith('$2')) {
      ok = await bcrypt.compare(password, passwordHash);
    } else {
      ok = passwordHash === password;
    }

    if (!ok) {
      throw new HttpError(401, 'Неверный логин или пароль');
    }

    const user = {
      entityId: record.entityId,
      name: record.name,
      email: record.email,
      role: record.role,
      isAdmin: record.role === 'admin',
    };
    const token = signToken(user);

    return res.json({ token, user });
  } finally {
    await session.close();
  }
}));

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
