import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, buildQuery } from '../../api';
import { useAuth } from '../../context/AuthContext';

const categoryOptions = ['Бакалавр', 'Специалист', 'Магистр'];
const workTypeOptions = ['Трудоустройство', 'Стажировка', 'Практика', 'Другое'];
const practiceTypeOptions = ['Производственная', 'Учебная', 'Преддипломная'];
const employmentTypeOptions = ['Частичная', 'Полная'];
const workFormatOptions = ['Офис', 'Удаленная', 'Гибрид'];

function VacancyModal({ vacancy, onClose, onApply, canApply }) {
  if (!vacancy) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2>{vacancy.title}</h2>
          <p className="modal-company">{vacancy.companyFull}</p>
        </div>

        <div className="modal-body">
          <div className="modal-info-grid">
            <div className="info-item"><span className="info-label">Категория:</span><span className="info-value">{vacancy.category}</span></div>
            <div className="info-item"><span className="info-label">Вид работы:</span><span className="info-value">{vacancy.workType}</span></div>
            <div className="info-item"><span className="info-label">Тип практики:</span><span className="info-value">{vacancy.practiceType || '—'}</span></div>
            <div className="info-item"><span className="info-label">Тип занятости:</span><span className="info-value">{vacancy.employmentType}</span></div>
            <div className="info-item"><span className="info-label">Формат:</span><span className="info-value">{vacancy.workFormat}</span></div>
            <div className="info-item"><span className="info-label">Зарплата:</span><span className="info-value salary-value">{vacancy.salaryText}</span></div>
          </div>

          <div className="modal-section">
            <h3>Навыки</h3>
            <div className="vacancy-skills">
              {vacancy.skills.map((skill) => <span key={skill} className="skill-badge">{skill}</span>)}
            </div>
          </div>

          <div className="modal-section"><h3>Обязанности</h3><p className="modal-text">{vacancy.responsibilities}</p></div>
          <div className="modal-section"><h3>Требования</h3><p className="modal-text">{vacancy.requirements}</p></div>
          <div className="modal-section"><h3>Условия</h3><p className="modal-text">{vacancy.conditions}</p></div>
          <div className="modal-section"><h3>Адрес</h3><p className="modal-text">{vacancy.address || '—'}</p></div>
          <div className="modal-section"><h3>Направления подготовки</h3><p className="modal-text">{vacancy.directions?.join(', ') || '—'}</p></div>
        </div>

        <div className="modal-footer">
          <button className="apply-btn" onClick={() => onApply(vacancy)} disabled={!canApply || vacancy.hasResponded}>
            {vacancy.hasResponded ? 'Вы уже откликнулись' : 'Откликнуться на вакансию'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VacanciesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialCompanyId = useMemo(() => new URLSearchParams(location.search).get('companyId') || '', [location.search]);

  const [titleSearch, setTitleSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [descriptionSearch, setDescriptionSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedWorkTypes, setSelectedWorkTypes] = useState([]);
  const [selectedPracticeTypes, setSelectedPracticeTypes] = useState([]);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState([]);
  const [selectedWorkFormats, setSelectedWorkFormats] = useState([]);
  const [salaryFrom, setSalaryFrom] = useState('');
  const [salaryTo, setSalaryTo] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyIdFilter, setCompanyIdFilter] = useState(initialCompanyId);

  useEffect(() => {
    setCompanyIdFilter(initialCompanyId);
  }, [initialCompanyId]);

  useEffect(() => {
    let cancelled = false;

    async function loadFilterData() {
      try {
        const response = await apiFetch('/vacancies/meta');
        if (!cancelled) {
          setAvailableSkills(response.skills || []);
        }
      } catch (_error) {
        if (!cancelled) {
          setAvailableSkills([]);
        }
      }
    }

    loadFilterData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadVacancies() {
      setLoading(true);
      try {
        const query = buildQuery({
          title: titleSearch,
          company: companySearch,
          description: descriptionSearch,
          categories: selectedCategories,
          workTypes: selectedWorkTypes,
          practiceTypes: selectedPracticeTypes,
          employmentTypes: selectedEmploymentTypes,
          workFormats: selectedWorkFormats,
          salaryFrom,
          salaryTo,
          skills: selectedSkills,
          sort: sortBy,
          companyId: companyIdFilter,
        });
        const response = await apiFetch(`/vacancies${query}`);
        if (!cancelled) {
          const nextVacancies = response.vacancies || [];
          setVacancies(nextVacancies);
          setError('');
          setAvailableSkills((prev) => {
            if (prev.length) {
              return prev;
            }
            return Array.from(new Set(nextVacancies.flatMap((vacancy) => vacancy.skills || []))).sort((a, b) => a.localeCompare(b, 'ru'));
          });
        }
      } catch (requestError) {
        if (!cancelled) {
          setVacancies([]);
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVacancies();
    return () => {
      cancelled = true;
    };
  }, [titleSearch, companySearch, descriptionSearch, selectedCategories, selectedWorkTypes, selectedPracticeTypes, selectedEmploymentTypes, selectedWorkFormats, salaryFrom, salaryTo, selectedSkills, sortBy, companyIdFilter]);

  const toggleFilter = (array, setArray, value) => {
    setArray((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handleAddSkill = () => {
    if (!selectedSkillToAdd) {
      return;
    }

    setSelectedSkills((prev) => (prev.includes(selectedSkillToAdd) ? prev : [...prev, selectedSkillToAdd]));
    setSelectedSkillToAdd('');
  };

  const handleRemoveSkill = (skillName) => {
    setSelectedSkills((prev) => prev.filter((skill) => skill !== skillName));
  };

  const availableSkillOptions = availableSkills.filter((skill) => !selectedSkills.includes(skill));

  const clearAllFilters = () => {
    setTitleSearch('');
    setCompanySearch('');
    setDescriptionSearch('');
    setSelectedSkills([]);
    setSelectedSkillToAdd('');
    setSelectedCategories([]);
    setSelectedWorkTypes([]);
    setSelectedPracticeTypes([]);
    setSelectedEmploymentTypes([]);
    setSelectedWorkFormats([]);
    setSalaryFrom('');
    setSalaryTo('');
    setCompanyIdFilter('');
    navigate('/vacancies');
  };

  const getActiveFiltersCount = () => {
    let count = selectedSkills.length + selectedCategories.length + selectedWorkTypes.length + selectedPracticeTypes.length + selectedEmploymentTypes.length + selectedWorkFormats.length;
    if (titleSearch) count += 1;
    if (companySearch) count += 1;
    if (descriptionSearch) count += 1;
    if (salaryFrom) count += 1;
    if (salaryTo) count += 1;
    if (companyIdFilter) count += 1;
    return count;
  };

  const handleApply = async (vacancy) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'student') {
      alert('Откликаться на вакансии может только студент.');
      return;
    }

    try {
      await apiFetch(`/vacancies/${vacancy.id}/respond`, { method: 'POST' });
      setVacancies((prev) => prev.map((item) => (item.id === vacancy.id ? { ...item, hasResponded: true } : item)));
      setSelectedVacancy((prev) => (prev ? { ...prev, hasResponded: true } : prev));
      alert(`Отклик на вакансию "${vacancy.title}" отправлен.`);
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  return (
    <div className="vacancies-page">
      <div className="vacancies-header">
        <div>
          <h1>Все вакансии и практики</h1>
          <p className="vacancies-count">Найдено: {vacancies.length} вакансий</p>
        </div>
        <div className="header-controls">
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Сначала новые</option>
            <option value="salary_desc">По убыванию зарплаты</option>
            <option value="salary_asc">По возрастанию зарплаты</option>
          </select>
          <button className={`filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <span>🔍 Фильтры</span>
            {getActiveFiltersCount() > 0 && <span className="filter-badge">{getActiveFiltersCount()}</span>}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3>Поиск и фильтрация вакансий</h3>
            <button onClick={clearAllFilters} className="clear-all-btn">Очистить все</button>
          </div>

          <div className="filters-grid">
            <div className="filter-section search-section">
              <label>Название вакансии</label>
              <input className="search-input" value={titleSearch} onChange={(e) => setTitleSearch(e.target.value)} placeholder="Поиск по названию" />
            </div>
            <div className="filter-section search-section">
              <label>Компания</label>
              <input className="search-input" value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} placeholder="Поиск по компании" />
            </div>
            <div className="filter-section search-section">
              <label>Описание / требования / условия</label>
              <input className="search-input" value={descriptionSearch} onChange={(e) => setDescriptionSearch(e.target.value)} placeholder="Поиск по тексту вакансии" />
            </div>

            <div className="filter-section">
              <label>Категория соискателя</label>
              <div className="checkbox-group">
                {categoryOptions.map((category) => (
                  <label key={category} className="checkbox-label">
                    <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleFilter(selectedCategories, setSelectedCategories, category)} />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label>Вид работы</label>
              <div className="checkbox-group">
                {workTypeOptions.map((type) => (
                  <label key={type} className="checkbox-label">
                    <input type="checkbox" checked={selectedWorkTypes.includes(type)} onChange={() => toggleFilter(selectedWorkTypes, setSelectedWorkTypes, type)} />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label>Тип практики</label>
              <div className="checkbox-group">
                {practiceTypeOptions.map((type) => (
                  <label key={type} className="checkbox-label">
                    <input type="checkbox" checked={selectedPracticeTypes.includes(type)} onChange={() => toggleFilter(selectedPracticeTypes, setSelectedPracticeTypes, type)} />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label>Тип занятости</label>
              <div className="checkbox-group">
                {employmentTypeOptions.map((type) => (
                  <label key={type} className="checkbox-label">
                    <input type="checkbox" checked={selectedEmploymentTypes.includes(type)} onChange={() => toggleFilter(selectedEmploymentTypes, setSelectedEmploymentTypes, type)} />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label>Формат работы</label>
              <div className="checkbox-group">
                {workFormatOptions.map((format) => (
                  <label key={format} className="checkbox-label">
                    <input type="checkbox" checked={selectedWorkFormats.includes(format)} onChange={() => toggleFilter(selectedWorkFormats, setSelectedWorkFormats, format)} />
                    <span>{format}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label>Заработная плата</label>
              <div className="salary-range">
                <input type="number" placeholder="От" value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)} className="salary-input" min="0" step="1000" />
                <span className="salary-separator">—</span>
                <input type="number" placeholder="До" value={salaryTo} onChange={(e) => setSalaryTo(e.target.value)} className="salary-input" min="0" step="1000" />
              </div>
            </div>

            <div className="filter-section full-width">
              <label>Навыки</label>
              <div className="skill-selector responses-skill-selector">
                <select
                  value={selectedSkillToAdd}
                  onChange={(e) => setSelectedSkillToAdd(e.target.value)}
                  disabled={availableSkillOptions.length === 0}
                >
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
                {selectedSkills.length > 0 ? selectedSkills.map((skill) => (
                  <span key={skill} className="selected-tag">
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)}>×</button>
                  </span>
                )) : <span className="selected-placeholder">Фильтр по навыкам не выбран</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Загрузка вакансий...</p>
      ) : error ? (
        <div className="no-results"><p>{error}</p></div>
      ) : (
        <div className="vacancies-list">
          {vacancies.length > 0 ? vacancies.map((vacancy) => (
            <div key={vacancy.id} className="vacancy-card">
              <div className="vacancy-card-header">
                <div>
                  <h3>{vacancy.title}</h3>
                  <span className="company-name">{vacancy.company}</span>
                </div>
                <span className="posted-date">{new Date(vacancy.postedDate).toLocaleDateString('ru-RU')}</span>
              </div>

              <p className="vacancy-description">{vacancy.responsibilities?.substring(0, 120)}...</p>

              <div className="vacancy-tags">
                <span className="tag">🎓 {vacancy.category}</span>
                <span className="tag">💼 {vacancy.workType}</span>
                <span className="tag">📚 {vacancy.practiceType || '—'}</span>
                <span className="tag">⏰ {vacancy.employmentType}</span>
                <span className="tag">📍 {vacancy.workFormat}</span>
              </div>

              <div className="vacancy-skills">
                {vacancy.skills.map((skill) => (
                  <span key={skill} className={`skill-badge ${selectedSkills.includes(skill) ? 'selected' : ''}`} onClick={() => toggleFilter(selectedSkills, setSelectedSkills, skill)}>
                    {skill}
                  </span>
                ))}
              </div>

              <div className="vacancy-footer">
                <span className="salary">{vacancy.salaryText}</span>
                <button className="details-btn" onClick={() => setSelectedVacancy(vacancy)}>Подробнее</button>
              </div>
            </div>
          )) : (
            <div className="no-results">
              <p>Вакансий не найдено</p>
              <button onClick={clearAllFilters} className="clear-filters-btn">Сбросить все фильтры</button>
            </div>
          )}
        </div>
      )}

      {selectedVacancy && (
        <VacancyModal
          vacancy={selectedVacancy}
          onClose={() => setSelectedVacancy(null)}
          onApply={handleApply}
          canApply={user?.role === 'student'}
        />
      )}
    </div>
  );
}
