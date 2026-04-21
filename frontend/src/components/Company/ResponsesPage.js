import React, { useEffect, useState } from 'react';
import { apiFetch, buildQuery } from '../../api';

function StudentCard({ student, onUpdateStatus }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'viewed': return '#f59e0b';
      case 'interview': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'accepted': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="student-response-card">
      <div className="student-card-header">
        <div className="student-avatar">👨‍🎓</div>
        <div className="student-info">
          <h4>{student.name}</h4>
          <div className="student-contact">
            <span className="contact-email">📧 {student.email}</span>
          </div>
        </div>
        <div className="student-status">
          <select
            className="status-select"
            style={{ backgroundColor: getStatusColor(student.status), color: 'white' }}
            value={student.status}
            onChange={(e) => onUpdateStatus(student.id, e.target.value)}
          >
            <option value="new">Новый</option>
            <option value="viewed">Просмотрено</option>
            <option value="interview">Собеседование</option>
            <option value="accepted">Принят</option>
            <option value="rejected">Отказ</option>
          </select>
        </div>
      </div>

      <div className="student-card-body">
        <div className="response-info">
          <span className="response-vacancy">📋 Отклик на: {student.vacancyTitle}</span>
          <span className="response-date">📅 {new Date(student.responseDate).toLocaleDateString('ru-RU')}</span>
        </div>

        <div className="student-skills">
          <span className="skills-label">Навыки:</span>
          <div className="skills-tags">
            {student.skills.map((skill) => <span key={skill} className="skill-tag">{skill}</span>)}
          </div>
        </div>

        <div className="match-indicator">
          <span className="match-label">Совместимость с вакансией:</span>
          <div className="match-progress">
            <div
              className="match-progress-fill"
              style={{
                width: `${student.matchPercentage}%`,
                backgroundColor: student.matchPercentage >= 80 ? '#10b981' : student.matchPercentage >= 60 ? '#3b82f6' : '#f59e0b'
              }}
            />
            <span className="match-percentage">{student.matchPercentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResponsesPage() {
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState('');
  const [filters, setFilters] = useState({
    studentName: '',
    studentEmail: '',
    skills: [],
    status: 'all',
    vacancy: 'all',
    sort: 'newest',
    categories: [],
    minMatch: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      try {
        const response = await apiFetch('/vacancies/meta');
        if (!cancelled) {
          setAvailableSkills(Array.isArray(response.skills) ? response.skills : []);
        }
      } catch (_error) {
        if (!cancelled) {
          setAvailableSkills([]);
        }
      }
    }

    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadResponses() {
      setLoading(true);
      try {
        const query = buildQuery(filters);
        const response = await apiFetch(`/companies/me/responses${query}`);
        if (!cancelled) {
          setResponses(response.responses);
          setVacancies(response.vacancies);
        }
      } catch (_error) {
        if (!cancelled) {
          setResponses([]);
          setVacancies([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadResponses();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const handleUpdateStatus = async (responseId, status) => {
    const previous = responses;
    setResponses((prev) => prev.map((item) => (item.id === responseId ? { ...item, status } : item)));

    try {
      await apiFetch(`/companies/responses/${responseId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      alert(error.message);
      setResponses(previous);
    }
  };

  const toggleCategory = (category) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }));
  };

  const handleAddSkill = () => {
    if (!selectedSkillToAdd) {
      return;
    }
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(selectedSkillToAdd)
        ? prev.skills
        : [...prev.skills, selectedSkillToAdd],
    }));
    setSelectedSkillToAdd('');
  };

  const handleRemoveSkill = (skillName) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillName),
    }));
  };

  const availableSkillOptions = availableSkills.filter((skill) => !filters.skills.includes(skill));

  return (
    <div className="responses-page">
      <div className="section-header">
        <h3>Отклики студентов</h3>
        <span className="vacancies-count">Всего откликов: {responses.length}</span>
      </div>

      <div className="responses-filters">
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Имя студента</label>
              <input value={filters.studentName} onChange={(e) => setFilters({ ...filters, studentName: e.target.value })} placeholder="Поиск по имени" />
            </div>
            <div className="filter-group">
              <label>Email студента</label>
              <input value={filters.studentEmail} onChange={(e) => setFilters({ ...filters, studentEmail: e.target.value })} placeholder="Поиск по email" />
            </div>
            <div className="filter-group filter-group-wide">
              <label>Навыки студента</label>
              <div className="skill-selector responses-skill-selector">
                <select value={selectedSkillToAdd} onChange={(e) => setSelectedSkillToAdd(e.target.value)} disabled={availableSkillOptions.length === 0}>
                  <option value="">{availableSkillOptions.length ? 'Выберите навык' : 'Все навыки уже выбраны'}</option>
                  {availableSkillOptions.map((skill) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
                <button type="button" onClick={handleAddSkill} className="add-btn" disabled={!selectedSkillToAdd}>
                  Добавить
                </button>
              </div>
              <div className="selected-items">
                {filters.skills.length > 0 ? filters.skills.map((skill) => (
                  <span key={skill} className="selected-tag">
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)}>×</button>
                  </span>
                )) : <span className="selected-placeholder">Фильтр по навыкам не выбран</span>}
              </div>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Статус</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="all">Все статусы</option>
                <option value="new">Новые</option>
                <option value="viewed">Просмотренные</option>
                <option value="interview">Собеседование</option>
                <option value="accepted">Принятые</option>
                <option value="rejected">Отказы</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Вакансия</label>
              <select value={filters.vacancy} onChange={(e) => setFilters({ ...filters, vacancy: e.target.value })}>
                <option value="all">Все вакансии</option>
                {vacancies.map((vacancy) => <option key={vacancy.id} value={vacancy.id}>{vacancy.title}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Сортировка</label>
              <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="match_desc">По совместимости</option>
                <option value="name_asc">По имени (А-Я)</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Категория</label>
              <div className="checkbox-group">
                {['Бакалавр', 'Специалист', 'Магистр'].map((category) => (
                  <label key={category} className="checkbox-label">
                    <input type="checkbox" checked={filters.categories.includes(category)} onChange={() => toggleCategory(category)} />
                    {category}
                  </label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Минимальное совпадение</label>
              <div className="range-wrapper">
                <input type="range" min="0" max="100" value={filters.minMatch} onChange={(e) => setFilters({ ...filters, minMatch: e.target.value })} />
                <span className="range-value">{filters.minMatch}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Загрузка откликов...</p>
      ) : responses.length > 0 ? (
        <div className="students-responses-grid">
          {responses.map((response) => (
            <StudentCard key={response.id} student={response} onUpdateStatus={handleUpdateStatus} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>Откликов по выбранным фильтрам нет</p>
        </div>
      )}
    </div>
  );
}
