const path = require('path');
const express = require('express');
const neo4j = require('neo4j-driver');
const { initDatabase } = require('./db/init');
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const vacancyRoutes = require('./routes/vacancies');
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');
const { driver } = require('./config/neo4j');
const { HttpError } = require('./utils/async');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.get(/^\/(?!api).*/, (_req, res) => {
  return res.sendFile(path.join(publicDir, 'index.html'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('[error]', err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err && err.code && typeof err.code === 'string' && err.code.startsWith('Neo.ClientError')) {
    return res.status(400).json({ message: 'Некорректный запрос к базе данных', details: err.message });
  }

  if (neo4j.isNeo4jError && neo4j.isNeo4jError(err)) {
    return res.status(503).json({ message: 'База данных недоступна', details: err.message });
  }

  return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  await driver.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await driver.close();
  process.exit(0);
});
