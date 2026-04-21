const neo4j = require('neo4j-driver');

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://db:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
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
