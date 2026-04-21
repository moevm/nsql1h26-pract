function convertNeo4jValue(value) {
  if (value && typeof value === 'object') {
    if (typeof value.toNumber === 'function') {
      return value.toNumber();
    }

    if (Array.isArray(value)) {
      return value.map(convertNeo4jValue);
    }

    const converted = {};
    Object.entries(value).forEach(([key, nestedValue]) => {
      converted[key] = convertNeo4jValue(nestedValue);
    });
    return converted;
  }

  return value;
}

function mapRecord(record) {
  const result = {};
  record.keys.forEach((key) => {
    result[key] = convertNeo4jValue(record.get(key));
  });
  return result;
}

function formatSalary(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '';
  }

  return `${Number(value).toLocaleString('ru-RU')} ₽`;
}

function normalizeSkillName(skillName = '') {
  const trimmed = String(skillName).trim();
  return trimmed;
}

function skillId(skillName = '') {
  return `skill:${String(skillName)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-zа-яё0-9_+.#-]/gi, '')}`;
}

module.exports = {
  convertNeo4jValue,
  mapRecord,
  formatSalary,
  normalizeSkillName,
  skillId,
};
