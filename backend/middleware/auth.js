const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

function signToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }

    return next();
  };
}

function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (_error) {
    req.user = null;
  }

  return next();
}

module.exports = {
  signToken,
  requireAuth,
  requireRole,
  optionalAuth,
};
