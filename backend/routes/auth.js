const express = require('express');
const { driver, NEO4J_DATABASE } = require('../config/neo4j');
const { mapRecord } = require('../utils/neo4j');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email = '', password = '', role = '' } = req.body || {};
  const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });

  try {
    const result = await session.run(
      `CALL {
         MATCH (s:Student {email: $email, password: $password})
         RETURN s.id AS entityId, s.name AS name, s.email AS email, 'student' AS role, false AS isAdmin
         UNION
         MATCH (c:Company {email: $email, password: $password})
         RETURN c.id AS entityId, c.name AS name, c.email AS email, 'company' AS role, false AS isAdmin
         UNION
         MATCH (a:Admin {email: $email, password: $password})
         RETURN a.id AS entityId, a.name AS name, a.email AS email, 'admin' AS role, true AS isAdmin
       }
       WITH entityId, name, email, role, isAdmin
       WHERE $role = '' OR role = $role
       RETURN entityId, name, email, role, isAdmin
       LIMIT 1`,
      { email, password, role }
    );

    if (!result.records.length) {
      return res.status(401).json({ message: 'Неверный логин, пароль или роль' });
    }

    const user = mapRecord(result.records[0]);
    const token = signToken(user);

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: 'Не удалось выполнить вход', details: error.message });
  } finally {
    await session.close();
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
