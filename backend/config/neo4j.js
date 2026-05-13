const neo4j = require('neo4j-driver');

const requiredEnv = ['NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD'];
const missing = requiredEnv.filter((name) => !process.env[name]);

if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(`FATAL: missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  {
    disableLosslessIntegers: false,
  }
);

async function getSession(mode = 'WRITE') {
  return driver.session({ database: NEO4J_DATABASE, defaultAccessMode: mode });
}

async function verifyConnection() {
  return driver.verifyConnectivity();
}

module.exports = {
  neo4j,
  driver,
  getSession,
  verifyConnection,
  NEO4J_DATABASE,
};
