const crypto = require('crypto');
const { driver, NEO4J_DATABASE, verifyConnection } = require('../config/neo4j');
const { skillId, normalizeSkillName } = require('../utils/neo4j');

const companies = [
  {
    id: 'company-1',
    name: 'ООО "Технологии будущего"',
    email: 'company@example.com',
    password: 'company123',
    description:
      'Крупная IT-компания, специализирующаяся на разработке программного обеспечения для бизнеса. Мы создаем инновационные решения уже более 10 лет.',
    phone: '+7 (495) 123-45-67',
    website: 'https://future-tech.ru',
    address: 'г. Москва, ул. Тверская, д. 15',
    year: 2015,
    industries: ['Разработка ПО', 'Искусственный интеллект', 'Облачные технологии'],
  },
  {
    id: 'company-2',
    name: 'ОАО «Производственная фирма «КМТ»',
    email: 'hr-kmt@example.com',
    password: 'company123',
    description:
      'Производственное предприятие, активно внедряющее современные IT-решения в производственные процессы.',
    phone: '+7 (812) 765-43-21',
    website: 'https://kmt.ru',
    address: 'г. Санкт-Петербург, г. Ломоносов, ул. Федюнинского, д.3',
    year: 2005,
    industries: ['Производство', 'Автоматизация', 'Промышленный софт'],
  },
  {
    id: 'company-3',
    name: 'ООО "Бэкенд Солюшнс"',
    email: 'backend@example.com',
    password: 'company123',
    description: 'Компания-разработчик высоконагруженных backend-систем.',
    phone: '+7 (495) 987-65-43',
    website: 'https://backend.ru',
    address: 'г. Москва, ул. Новый Арбат, д.24',
    year: 2018,
    industries: ['Высоконагруженные системы', 'Микросервисы', 'Базы данных'],
  },
  {
    id: 'company-4',
    name: 'ООО "Тест Лаб"',
    email: 'testlab@example.com',
    password: 'company123',
    description: 'Специализируемся на тестировании программного обеспечения.',
    phone: '+7 (812) 456-78-90',
    website: 'https://testlab.ru',
    address: 'г. Санкт-Петербург, м. Петроградская',
    year: 2020,
    industries: ['Тестирование ПО', 'Автоматизация', 'Контроль качества'],
  },
  {
    id: 'company-5',
    name: 'ООО "Дата Аналитикс"',
    email: 'data@example.com',
    password: 'company123',
    description: 'Аналитическая компания, работающая с большими данными.',
    phone: '+7 (495) 234-56-78',
    website: 'https://data.ru',
    address: 'г. Москва, ул. Ленина, д. 10',
    year: 2019,
    industries: ['Аналитика данных', 'Big Data', 'Машинное обучение'],
  },
  {
    id: 'company-6',
    name: 'ООО "Веб Студия"',
    email: 'webstudio@example.com',
    password: 'company123',
    description: 'Студия веб-разработки. Создаем современные сайты и веб-приложения.',
    phone: '+7 (495) 345-67-89',
    website: 'https://webstudio.ru',
    address: 'г. Москва, ул. Арбат, д. 5',
    year: 2021,
    industries: ['Веб-разработка', 'Дизайн', 'UX/UI'],
  },
];

const students = [
  {
    id: 'student-1',
    name: 'Иван Петров',
    email: 'student@example.com',
    password: 'student123',
    degree: 'Программная инженерия',
    category: 'Бакалавр',
    skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Git'],
  },
  {
    id: 'student-2',
    name: 'Анна Смирнова',
    email: 'anna.smirnova@example.com',
    password: 'student123',
    degree: 'Информатика и вычислительная техника',
    category: 'Бакалавр',
    skills: ['Python', 'Django', 'SQL', 'Git'],
  },
  {
    id: 'student-3',
    name: 'Дмитрий Козлов',
    email: 'd.kozlov@example.com',
    password: 'student123',
    degree: 'Компьютерные науки',
    category: 'Магистр',
    skills: ['Java', 'Spring', 'PostgreSQL', 'Docker', 'Kafka'],
  },
  {
    id: 'student-4',
    name: 'Елена Новикова',
    email: 'e.novikova@example.com',
    password: 'student123',
    degree: 'Информационные системы и технологии',
    category: 'Бакалавр',
    skills: ['Тестирование', 'Selenium', 'Postman', 'SQL', 'Jira'],
  },
  {
    id: 'student-5',
    name: 'Алексей Морозов',
    email: 'a.morozov@example.com',
    password: 'student123',
    degree: 'Прикладная математика и информатика',
    category: 'Специалист',
    skills: ['Python', 'Excel', 'Pandas', 'SQL'],
  },
];

const offers = [
  {
    id: 'offer-1',
    companyId: 'company-2',
    title: 'Системный администратор (практика)',
    capacity: 2,
    skills: ['Сетевое администрирование', 'Windows Server', 'Linux', 'Офисная техника'],
    category: 'Бакалавр',
    workType: 'Практика',
    practiceType: 'Производственная',
    employmentType: 'Полная',
    workFormat: 'Офис',
    salary: 28750,
    postedDate: '2026-03-15',
    responsibilities: 'Проверка и настройка компьютерной техники, администрирование серверов и поддержка офисной инфраструктуры.',
    requirements:
      'Приглашаются студенты по направлениям 01.03.02, 09.03.02 и 09.03.01. Базовые навыки администрирования обязательны.',
    conditions: 'Практика на реальном производстве с официальным оформлением.',
    address: 'г. Ломоносов, ул. Федюнинского, д.3, литера А',
    directions: [
      '01.03.02 Прикладная математика и информатика',
      '09.03.02 Информационные системы и технологии',
      '09.03.01 Информатика и вычислительная техника',
    ],
  },
  {
    id: 'offer-2',
    companyId: 'company-1',
    title: 'Frontend-разработчик (стажер)',
    capacity: 3,
    skills: ['React', 'JavaScript', 'CSS', 'HTML'],
    category: 'Бакалавр',
    workType: 'Стажировка',
    practiceType: 'Производственная',
    employmentType: 'Частичная',
    workFormat: 'Удаленная',
    salary: 30000,
    postedDate: '2026-03-14',
    responsibilities: 'Разработка пользовательских интерфейсов на React и интеграция с REST API.',
    requirements: 'Знание React, JavaScript, HTML, CSS и Git.',
    conditions: 'Гибкий график, наставничество и перспектива трудоустройства.',
    address: 'г. Москва, ул. Тверская, д.15 (офис 401)',
    directions: [
      '09.03.01 Информатика и вычислительная техника',
      '09.03.02 Информационные системы и технологии',
      '09.03.03 Прикладная информатика',
    ],
  },
  {
    id: 'offer-3',
    companyId: 'company-3',
    title: 'Backend-разработчик',
    capacity: 1,
    skills: ['Node.js', 'Python', 'SQL', 'API'],
    category: 'Магистр',
    workType: 'Трудоустройство',
    practiceType: 'Производственная',
    employmentType: 'Полная',
    workFormat: 'Офис',
    salary: 80000,
    postedDate: '2026-03-13',
    responsibilities: 'Разработка серверной части приложений, проектирование API и оптимизация запросов.',
    requirements: 'Опыт с Node.js или Python, понимание REST API и SQL.',
    conditions: 'Полный рабочий день, ДМС и обучение за счет компании.',
    address: 'г. Москва, ул. Новый Арбат, д.24',
    directions: [
      '02.04.02 Фундаментальная информатика и информационные технологии',
      '09.04.01 Информатика и вычислительная техника',
    ],
  },
  {
    id: 'offer-4',
    companyId: 'company-4',
    title: 'QA Инженер',
    capacity: 2,
    skills: ['Тестирование', 'Selenium', 'Postman', 'SQL'],
    category: 'Бакалавр',
    workType: 'Стажировка',
    practiceType: 'Производственная',
    employmentType: 'Полная',
    workFormat: 'Гибрид',
    salary: 45000,
    postedDate: '2026-03-12',
    responsibilities: 'Функциональное и регрессионное тестирование веб-приложений.',
    requirements: 'Понимание тестирования, базовые знания SQL, ответственность.',
    conditions: 'Гибридный формат, наставничество и карьерный рост.',
    address: 'г. Санкт-Петербург, м. Петроградская',
    directions: [
      '09.03.01 Информатика и вычислительная техника',
      '09.03.02 Информационные системы и технологии',
    ],
  },
  {
    id: 'offer-5',
    companyId: 'company-5',
    title: 'Аналитик данных',
    capacity: 1,
    skills: ['Python', 'SQL', 'Excel', 'Pandas'],
    category: 'Магистр',
    workType: 'Трудоустройство',
    practiceType: 'Производственная',
    employmentType: 'Полная',
    workFormat: 'Удаленная',
    salary: 95000,
    postedDate: '2026-03-11',
    responsibilities: 'Сбор данных, построение отчетов и проведение аналитики.',
    requirements: 'Высшее образование, Python, SQL и статистика.',
    conditions: 'Удаленная работа и современный стек технологий.',
    address: 'Удаленно',
    directions: [
      '01.04.02 Прикладная математика и информатика',
      '09.04.01 Информатика и вычислительная техника',
    ],
  },
];

const responses = [
  {
    id: 'response-1',
    studentId: 'student-1',
    offerId: 'offer-2',
    status: 'new',
    createdAt: '2026-03-15T10:00:00.000Z',
  },
  {
    id: 'response-2',
    studentId: 'student-2',
    offerId: 'offer-2',
    status: 'viewed',
    createdAt: '2026-03-14T12:00:00.000Z',
  },
  {
    id: 'response-3',
    studentId: 'student-3',
    offerId: 'offer-3',
    status: 'interview',
    createdAt: '2026-03-13T15:00:00.000Z',
  },
  {
    id: 'response-4',
    studentId: 'student-4',
    offerId: 'offer-4',
    status: 'rejected',
    createdAt: '2026-03-12T09:00:00.000Z',
  },
  {
    id: 'response-5',
    studentId: 'student-5',
    offerId: 'offer-5',
    status: 'accepted',
    createdAt: '2026-03-11T16:30:00.000Z',
  },
];

const admin = {
  id: 'admin-1',
  name: 'Администратор',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
};

const skillPairs = [
  ['React', 'JavaScript', 10],
  ['Python', 'Pandas', 15],
  ['Selenium', 'Тестирование', 8],
  ['SQL', 'PostgreSQL', 12],
];

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

async function initDatabase() {
  await waitForNeo4j();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    for (const statement of constraints) {
      await session.run(statement);
    }

    await session.run(
      `MERGE (a:Admin {id: $id})
       SET a.name = $name,
           a.email = $email,
           a.password = $password,
           a.role = $role`,
      admin
    );

    for (const company of companies) {
      await session.run(
        `MERGE (c:Company {id: $id})
         SET c.name = $name,
             c.email = $email,
             c.password = $password,
             c.description = $description,
             c.phone = $phone,
             c.website = $website,
             c.address = $address,
             c.year = $year,
             c.industries = $industries`,
        company
      );
    }

    for (const student of students) {
      await session.run(
        `MERGE (s:Student {id: $id})
         SET s.name = $name,
             s.email = $email,
             s.password = $password,
             s.degree = $degree,
             s.category = $category`,
        student
      );

      const studentSkills = buildSkills(student.skills);
      await session.run(
        `MATCH (s:Student {id: $studentId})
         UNWIND $skills AS skill
         MERGE (sk:Skill {id: skill.id})
           ON CREATE SET sk.name = skill.name
           ON MATCH SET sk.name = skill.name
         MERGE (s)-[:HAS_SKILL]->(sk)`,
        {
          studentId: student.id,
          skills: studentSkills,
        }
      );
    }

    for (const offer of offers) {
      const offerId = offer.id || crypto.randomUUID();
      const offerSkills = buildSkills(offer.skills);

      await session.run(
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
         MERGE (c)-[:OFFERS_JOB]->(o)`,
        {
          ...offer,
          id: offerId,
        }
      );

      await session.run(
        `MATCH (o:Offer {id: $offerId})
         UNWIND $skills AS skill
         MERGE (sk:Skill {id: skill.id})
           ON CREATE SET sk.name = skill.name
           ON MATCH SET sk.name = skill.name
         MERGE (o)-[:NEEDS_SKILL]->(sk)`,
        {
          offerId,
          skills: offerSkills,
        }
      );
    }

    for (const [skillA, skillB, matchDistance] of skillPairs) {
      await session.run(
        `MATCH (a:Skill {id: $skillA}), (b:Skill {id: $skillB})
         MERGE (a)-[r:MATCHES_WITH]->(b)
         SET r.matchDistance = $matchDistance`,
        {
          skillA: skillId(skillA),
          skillB: skillId(skillB),
          matchDistance,
        }
      );
    }

    for (const response of responses) {
      const offer = offers.find((item) => item.id === response.offerId);
      const student = students.find((item) => item.id === response.studentId);
      const matchDistance = computeMatchDistance(student.skills, offer.skills);

      await session.run(
        `MATCH (s:Student {id: $studentId}), (o:Offer {id: $offerId})
         MERGE (s)-[r:RESPONDED_TO {id: $id}]->(o)
         SET r.status = $status,
             r.createdAt = $createdAt
         MERGE (s)-[m:MATCHES_WITH]->(o)
         SET m.matchDistance = $matchDistance`,
        {
          ...response,
          matchDistance,
        }
      );
    }
  } finally {
    await session.close();
  }
}

module.exports = {
  initDatabase,
};
