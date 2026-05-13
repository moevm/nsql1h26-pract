import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch, buildQuery } from '../../api';

const STUDENT_CATEGORY_OPTIONS = ['Бакалавр', 'Специалист', 'Магистр'];

const ENTITY_CONFIG = {
  students: {
    label: 'Студенты',
    filters: [
      { name: 'id', label: 'ID', type: 'text' },
      { name: 'name', label: 'Имя', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'degree', label: 'Направление', type: 'text' },
      { name: 'category', label: 'Категория', type: 'text' },
      { name: 'skill', label: 'Навык', type: 'text' },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Имя' },
      { key: 'email', label: 'Email' },
      { key: 'degree', label: 'Направление' },
      { key: 'category', label: 'Категория' },
      { key: 'skills', label: 'Навыки' },
    ],
    createFields: [
      { name: 'id', label: 'ID', type: 'text', placeholder: 'Можно оставить пустым' },
      { name: 'name', label: 'Имя', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Пароль', type: 'text', placeholder: 'По умолчанию student123' },
      { name: 'degree', label: 'Направление', type: 'text' },
      { name: 'category', label: 'Категория', type: 'select', options: STUDENT_CATEGORY_OPTIONS },
      { name: 'skills', label: 'Навыки', type: 'text', placeholder: 'React, SQL, Docker' },
    ],
  },
  companies: {
    label: 'Компании',
    filters: [
      { name: 'id', label: 'ID', type: 'text' },
      { name: 'name', label: 'Название', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'description', label: 'Описание', type: 'text' },
      { name: 'phone', label: 'Телефон', type: 'text' },
      { name: 'website', label: 'Сайт', type: 'text' },
      { name: 'address', label: 'Адрес', type: 'text' },
      { name: 'industry', label: 'Индустрия', type: 'text' },
      { name: 'yearFrom', label: 'Год от', type: 'number' },
      { name: 'yearTo', label: 'Год до', type: 'number' },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Телефон' },
      { key: 'website', label: 'Сайт' },
      { key: 'address', label: 'Адрес' },
      { key: 'year', label: 'Год' },
      { key: 'industries', label: 'Индустрии' },
      { key: 'description', label: 'Описание' },
    ],
    createFields: [
      { name: 'id', label: 'ID', type: 'text', placeholder: 'Можно оставить пустым' },
      { name: 'name', label: 'Название', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Пароль', type: 'text', placeholder: 'По умолчанию company123' },
      { name: 'phone', label: 'Телефон', type: 'text' },
      { name: 'website', label: 'Сайт', type: 'text' },
      { name: 'address', label: 'Адрес', type: 'text' },
      { name: 'year', label: 'Год основания', type: 'number' },
      { name: 'industries', label: 'Индустрии', type: 'text', placeholder: 'Разработка ПО, AI' },
      { name: 'description', label: 'Описание', type: 'textarea' },
    ],
  },
  vacancies: {
    label: 'Вакансии',
    filters: [
      { name: 'id', label: 'ID', type: 'text' },
      { name: 'title', label: 'Название', type: 'text' },
      { name: 'companyId', label: 'ID компании', type: 'text' },
      { name: 'companyName', label: 'Компания', type: 'text' },
      { name: 'category', label: 'Категория', type: 'text' },
      { name: 'workType', label: 'Тип работы', type: 'text' },
      { name: 'practiceType', label: 'Тип практики', type: 'text' },
      { name: 'employmentType', label: 'Занятость', type: 'text' },
      { name: 'workFormat', label: 'Формат работы', type: 'text' },
      { name: 'address', label: 'Адрес', type: 'text' },
      { name: 'skill', label: 'Навык', type: 'text' },
      { name: 'direction', label: 'Направление подготовки', type: 'text' },
      { name: 'salaryFrom', label: 'Зарплата от', type: 'number' },
      { name: 'salaryTo', label: 'Зарплата до', type: 'number' },
      { name: 'capacityFrom', label: 'Мест от', type: 'number' },
      { name: 'capacityTo', label: 'Мест до', type: 'number' },
      { name: 'postedDateFrom', label: 'Дата публикации от', type: 'date' },
      { name: 'postedDateTo', label: 'Дата публикации до', type: 'date' },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Название' },
      { key: 'companyId', label: 'ID компании' },
      { key: 'companyName', label: 'Компания' },
      { key: 'category', label: 'Категория' },
      { key: 'workType', label: 'Тип работы' },
      { key: 'practiceType', label: 'Тип практики' },
      { key: 'employmentType', label: 'Занятость' },
      { key: 'workFormat', label: 'Формат' },
      { key: 'capacity', label: 'Мест' },
      { key: 'salary', label: 'Зарплата' },
      { key: 'postedDate', label: 'Дата' },
      { key: 'skills', label: 'Навыки' },
      { key: 'directions', label: 'Направления' },
      { key: 'address', label: 'Адрес' },
      { key: 'requirements', label: 'Требования' },
      { key: 'responsibilities', label: 'Обязанности' },
      { key: 'conditions', label: 'Условия' },
    ],
    createFields: [
      { name: 'id', label: 'ID', type: 'text', placeholder: 'Можно оставить пустым' },
      { name: 'companyId', label: 'ID компании', type: 'text', required: true },
      { name: 'title', label: 'Название', type: 'text', required: true },
      { name: 'category', label: 'Категория', type: 'text' },
      { name: 'workType', label: 'Тип работы', type: 'text' },
      { name: 'practiceType', label: 'Тип практики', type: 'text' },
      { name: 'employmentType', label: 'Занятость', type: 'text' },
      { name: 'workFormat', label: 'Формат работы', type: 'text' },
      { name: 'capacity', label: 'Количество мест', type: 'number' },
      { name: 'salary', label: 'Зарплата', type: 'number' },
      { name: 'postedDate', label: 'Дата публикации', type: 'date' },
      { name: 'address', label: 'Адрес', type: 'text' },
      { name: 'skills', label: 'Навыки', type: 'skill-multiselect', initialValue: [] },
      { name: 'directions', label: 'Направления', type: 'direction-multiselect', initialValue: [] },
      { name: 'requirements', label: 'Требования', type: 'textarea' },
      { name: 'responsibilities', label: 'Обязанности', type: 'textarea' },
      { name: 'conditions', label: 'Условия', type: 'textarea' },
    ],
  },
  skills: {
    label: 'Навыки',
    filters: [
      { name: 'id', label: 'ID', type: 'text' },
      { name: 'name', label: 'Название', type: 'text' },
      { name: 'studentsFrom', label: 'Студентов от', type: 'number' },
      { name: 'studentsTo', label: 'Студентов до', type: 'number' },
      { name: 'vacanciesFrom', label: 'Вакансий от', type: 'number' },
      { name: 'vacanciesTo', label: 'Вакансий до', type: 'number' },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название' },
      { key: 'studentsCount', label: 'Студентов' },
      { key: 'vacanciesCount', label: 'Вакансий' },
    ],
    createFields: [
      { name: 'id', label: 'ID', type: 'text', placeholder: 'Можно оставить пустым' },
      { name: 'name', label: 'Название навыка', type: 'text', required: true },
    ],
  },
  responses: {
    label: 'Отклики',
    filters: [
      { name: 'id', label: 'ID', type: 'text' },
      { name: 'studentId', label: 'ID студента', type: 'text' },
      { name: 'studentName', label: 'Имя студента', type: 'text' },
      { name: 'studentEmail', label: 'Email студента', type: 'text' },
      { name: 'studentCategory', label: 'Категория', type: 'text' },
      { name: 'offerId', label: 'ID вакансии', type: 'text' },
      { name: 'vacancyTitle', label: 'Название вакансии', type: 'text' },
      { name: 'companyName', label: 'Компания', type: 'text' },
      { name: 'status', label: 'Статус', type: 'text' },
      { name: 'createdAtFrom', label: 'Дата отклика от', type: 'datetime-local' },
      { name: 'createdAtTo', label: 'Дата отклика до', type: 'datetime-local' },
      { name: 'matchDistanceFrom', label: 'Совпадение от', type: 'number' },
      { name: 'matchDistanceTo', label: 'Совпадение до', type: 'number' },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'studentId', label: 'ID студента' },
      { key: 'studentName', label: 'Студент' },
      { key: 'studentEmail', label: 'Email' },
      { key: 'studentCategory', label: 'Категория' },
      { key: 'offerId', label: 'ID вакансии' },
      { key: 'vacancyTitle', label: 'Вакансия' },
      { key: 'companyName', label: 'Компания' },
      { key: 'status', label: 'Статус' },
      { key: 'createdAt', label: 'Дата отклика' },
      { key: 'matchDistance', label: 'matchDistance' },
    ],
    createFields: [
      { name: 'id', label: 'ID', type: 'text', placeholder: 'Можно оставить пустым' },
      { name: 'studentId', label: 'ID студента', type: 'text', required: true },
      { name: 'offerId', label: 'ID вакансии', type: 'text', required: true },
      { name: 'status', label: 'Статус', type: 'text', placeholder: 'new / viewed / interview / accepted / rejected' },
      { name: 'createdAt', label: 'Дата отклика', type: 'datetime-local' },
    ],
  },
};

const MAIN_TABS = [
  { key: 'browser', label: 'Просмотр БД' },
  { key: 'data', label: 'Импорт / Экспорт' },
];

function createInitialState(fields) {
  return fields.reduce((acc, field) => ({
    ...acc,
    [field.name]: field.initialValue !== undefined ? field.initialValue : '',
  }), {});
}

function normalizeCreatePayload(entityType, values) {
  if (entityType === 'responses') {
    const payload = { ...values };
    if (payload.createdAt && !payload.createdAt.includes(':00')) {
      payload.createdAt = `${payload.createdAt}:00`;
    }
    return payload;
  }

  if (entityType === 'vacancies') {
    return {
      ...values,
      skills: Array.isArray(values.skills) ? values.skills : [],
      directions: Array.isArray(values.directions) ? values.directions : [],
    };
  }

  return { ...values };
}

function renderCell(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (value == null || value === '') {
    return '—';
  }
  return String(value);
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('browser');

  const [selectedEntity, setSelectedEntity] = useState('students');
  const [filters, setFilters] = useState(() => createInitialState(ENTITY_CONFIG.students.filters));
  const [rows, setRows] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState('');

  const [createValues, setCreateValues] = useState(() => createInitialState(ENTITY_CONFIG.students.createFields));
  const [createStatus, setCreateStatus] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableDirections, setAvailableDirections] = useState([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState('');
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState('');
  const [selectedDirectionToAdd, setSelectedDirectionToAdd] = useState('');

  const [exportContent, setExportContent] = useState('');
  const [exportFilename, setExportFilename] = useState('');
  const [exportStatus, setExportStatus] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [importPayload, setImportPayload] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  const entityConfig = useMemo(() => ENTITY_CONFIG[selectedEntity], [selectedEntity]);

  useEffect(() => {
    let isMounted = true;

    const loadMeta = async () => {
      setMetaLoading(true);
      setMetaError('');
      try {
        const response = await apiFetch('/vacancies/meta');
        if (isMounted) {
          setAvailableSkills(Array.isArray(response.skills) ? response.skills : []);
          setAvailableDirections(Array.isArray(response.directions) ? response.directions : []);
        }
      } catch (error) {
        if (isMounted) {
          setAvailableSkills([]);
          setAvailableDirections([]);
          setMetaError(error.message);
        }
      } finally {
        if (isMounted) {
          setMetaLoading(false);
        }
      }
    };

    loadMeta();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadRows = async (entity = selectedEntity, queryFilters = filters) => {
    setRowsLoading(true);
    setRowsError('');
    try {
      const query = buildQuery(queryFilters);
      const response = await apiFetch(`/admin/entities/${entity}${query}`);
      setRows(response.rows);
    } catch (error) {
      setRowsError(error.message);
      setRows([]);
    } finally {
      setRowsLoading(false);
    }
  };

  useEffect(() => {
    const nextFilters = createInitialState(entityConfig.filters);
    setFilters(nextFilters);
    setCreateValues(createInitialState(entityConfig.createFields));
    setRows([]);
    setRowsError('');
    setCreateStatus(null);
    setSelectedSkillToAdd('');
    setSelectedDirectionToAdd('');
    if (activeTab === 'browser') {
      loadRows(selectedEntity, nextFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityConfig]);

  useEffect(() => {
    if (activeTab === 'browser') {
      loadRows(selectedEntity, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedEntity]);

  const handleFilterChange = (fieldName, value) => {
    setFilters((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleCreateChange = (fieldName, value) => {
    setCreateValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const addSelectedValue = (key, value) => {
    if (!value) {
      return;
    }
    setCreateValues((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      if (current.includes(value)) {
        return prev;
      }
      return {
        ...prev,
        [key]: [...current, value],
      };
    });
  };

  const removeSelectedValue = (key, value) => {
    setCreateValues((prev) => ({
      ...prev,
      [key]: (Array.isArray(prev[key]) ? prev[key] : []).filter((item) => item !== value),
    }));
  };

  const resetFilters = () => {
    const nextFilters = createInitialState(entityConfig.filters);
    setFilters(nextFilters);
    loadRows(selectedEntity, nextFilters);
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setCreateLoading(true);
    setCreateStatus(null);
    try {
      const payload = normalizeCreatePayload(selectedEntity, createValues);
      const response = await apiFetch(`/admin/entities/${selectedEntity}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCreateStatus({ type: 'success', message: response.message || 'Запись успешно сохранена' });
      setCreateValues(createInitialState(entityConfig.createFields));
      setSelectedSkillToAdd('');
      setSelectedDirectionToAdd('');
      await loadRows(selectedEntity, filters);
    } catch (error) {
      setCreateStatus({ type: 'error', message: error.message });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleExportAll = async () => {
    setExportLoading(true);
    setExportStatus(null);
    try {
      const response = await apiFetch('/admin/export-all');
      setExportContent(response.content);
      setExportFilename(response.filename);
      const counts = Object.entries(response.counts || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
      setExportStatus({ type: 'success', message: `Экспорт готов (${counts})` });
    } catch (error) {
      setExportStatus({ type: 'error', message: error.message });
      setExportContent('');
      setExportFilename('');
    } finally {
      setExportLoading(false);
    }
  };

  const downloadExport = () => {
    if (!exportContent || !exportFilename) {
      return;
    }
    const blob = new Blob([exportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFilename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAll = async (event) => {
    event.preventDefault();
    setImportLoading(true);
    setImportStatus(null);
    try {
      const response = await apiFetch('/admin/import-all', {
        method: 'POST',
        body: JSON.stringify({ payload: importPayload }),
      });
      const counts = Object.entries(response.counts || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
      setImportStatus({ type: 'success', message: `${response.message}. ${counts}` });
      setImportPayload('');
      if (activeTab === 'browser') {
        await loadRows(selectedEntity, filters);
      }
    } catch (error) {
      setImportStatus({ type: 'error', message: error.message });
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setImportPayload(text);
  };

  const renderMultiSelectField = (field) => {
    const isSkillField = field.type === 'skill-multiselect';
    const selectedValues = Array.isArray(createValues[field.name]) ? createValues[field.name] : [];
    const allOptions = isSkillField ? availableSkills : availableDirections;
    const freeOptions = allOptions.filter((item) => !selectedValues.includes(item));
    const currentSelectedValue = isSkillField ? selectedSkillToAdd : selectedDirectionToAdd;
    const setSelectedValue = isSkillField ? setSelectedSkillToAdd : setSelectedDirectionToAdd;
    const loadingText = isSkillField ? 'Загрузка навыков...' : 'Загрузка направлений...';
    const placeholderText = isSkillField ? 'Выберите существующий навык' : 'Выберите направление подготовки';
    const emptyText = isSkillField ? 'Нет доступных навыков' : 'Нет доступных направлений';
    const hintText = isSkillField ? 'Можно выбрать только уже существующие навыки из базы данных.' : 'Можно выбрать только направления из выпадающего списка.';
    const emptySelectedText = isSkillField ? 'Навыки пока не выбраны' : 'Направления пока не выбраны';

    return (
      <div key={field.name} className="form-group compact-group full-width">
        <span>{field.label}</span>
        <div className="admin-skill-picker">
          <select
            className="styled-select"
            value={currentSelectedValue}
            onChange={(event) => setSelectedValue(event.target.value)}
            disabled={metaLoading || freeOptions.length === 0}
          >
            <option value="">
              {metaLoading ? loadingText : freeOptions.length ? placeholderText : emptyText}
            </option>
            {freeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            type="button"
            className="add-btn"
            onClick={() => addSelectedValue(field.name, currentSelectedValue)}
            disabled={!currentSelectedValue}
          >
            Добавить
          </button>
        </div>

        {metaError && isSkillField ? <span className="field-hint error-text">{metaError}</span> : <span className="field-hint">{hintText}</span>}

        <div className="selected-items">
          {selectedValues.length > 0 ? (
            selectedValues.map((item) => (
              <span key={item} className="selected-tag">
                {item}
                <button type="button" onClick={() => removeSelectedValue(field.name, item)}>×</button>
              </span>
            ))
          ) : (
            <span className="selected-placeholder">{emptySelectedText}</span>
          )}
        </div>
      </div>
    );
  };

  const renderCreateField = (field) => {
    if (field.type === 'skill-multiselect' || field.type === 'direction-multiselect') {
      return renderMultiSelectField(field);
    }

    return (
      <label key={field.name} className={`form-group compact-group ${field.type === 'textarea' ? 'full-width' : ''}`}>
        <span>{field.label}</span>
        {field.type === 'textarea' ? (
          <textarea
            value={createValues[field.name] || ''}
            onChange={(event) => handleCreateChange(field.name, event.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            rows={4}
          />
        ) : field.type === 'select' ? (
          <select
            value={createValues[field.name] || ''}
            onChange={(event) => handleCreateChange(field.name, event.target.value)}
            required={field.required}
          >
            <option value="">Выберите значение</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            value={createValues[field.name] || ''}
            onChange={(event) => handleCreateChange(field.name, event.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
          />
        )}
      </label>
    );
  };

  return (
    <div className="page admin-page">
      <div className="admin-header-block">
        <h1>Админ-панель</h1>
        <p>
          Просмотр содержимого базы данных, добавление записей по каждому типу данных и единый импорт/экспорт всех данных приложения.
        </p>
      </div>

      <div className="tab-row admin-main-tabs">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'browser' && (
        <section className="admin-section">
          <div className="section-header compact-header">
            <h3>Просмотр БД</h3>
            <div className="inline-actions admin-browser-actions">
              <label className="form-group compact-group admin-entity-picker">
                <span>Сущность для просмотра</span>
                <select
                  className="styled-select"
                  value={selectedEntity}
                  onChange={(event) => setSelectedEntity(event.target.value)}
                >
                  {Object.entries(ENTITY_CONFIG).map(([entityKey, config]) => (
                    <option key={entityKey} value={entityKey}>{config.label}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="details-btn entity-refresh-btn" onClick={() => loadRows(selectedEntity, filters)}>
                Обновить таблицу
              </button>
            </div>
          </div>

          <div className="admin-browser-grid">
            <div className="admin-card">
              <h4>Фильтры</h4>
              <div className="admin-form-grid">
                {entityConfig.filters.map((field) => (
                  <label key={field.name} className="form-group compact-group">
                    <span>{field.label}</span>
                    <input
                      type={field.type}
                      value={filters[field.name] || ''}
                      onChange={(event) => handleFilterChange(field.name, event.target.value)}
                    />
                  </label>
                ))}
              </div>
              <div className="form-actions">
                <button type="button" className="auth-btn" onClick={() => loadRows(selectedEntity, filters)}>Применить фильтры</button>
                <button type="button" className="secondary-btn" onClick={resetFilters}>Сбросить</button>
              </div>
            </div>

            <div className="admin-card">
              <h4>Добавление новой записи</h4>
              <form onSubmit={handleCreateSubmit}>
                <div className="admin-form-grid">
                  {entityConfig.createFields.map((field) => renderCreateField(field))}
                </div>
                <div className="form-actions">
                  <button type="submit" className="auth-btn" disabled={createLoading}>
                    {createLoading ? 'Сохранение...' : 'Добавить запись'}
                  </button>
                </div>
                {createStatus && (
                  <div className={`import-status ${createStatus.type === 'error' ? 'error' : 'success'}`}>
                    {createStatus.type === 'error' ? '❌' : '✅'} {createStatus.message}
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="admin-card admin-table-card">
            <div className="section-header compact-header">
              <h4>Таблица: {entityConfig.label}</h4>
              <span className="vacancies-count">Записей: {rows.length}</span>
            </div>

            {rowsLoading ? (
              <p>Загрузка таблицы...</p>
            ) : rowsError ? (
              <div className="import-status error">❌ {rowsError}</div>
            ) : rows.length === 0 ? (
              <p>По выбранным фильтрам записи не найдены.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="results-table admin-db-table">
                  <thead>
                    <tr>
                      {entityConfig.columns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.id || index}-${index}`}>
                        {entityConfig.columns.map((column) => (
                          <td key={column.key}>{renderCell(row[column.key])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'data' && (
        <section className="admin-section admin-card">
          <div className="section-header compact-header">
            <h3>Экспорт всех данных</h3>
          </div>
          <p>Одна кнопка выгружает все данные приложения в JSON-файл.</p>
          <div className="form-actions">
            <button type="button" className="auth-btn" onClick={handleExportAll} disabled={exportLoading}>
              {exportLoading ? 'Экспорт...' : 'Экспортировать все данные'}
            </button>
            <button type="button" className="secondary-btn" onClick={downloadExport} disabled={!exportContent}>
              Скачать файл
            </button>
          </div>
          {exportStatus && (
            <div className={`import-status ${exportStatus.type === 'error' ? 'error' : 'success'}`}>
              {exportStatus.type === 'error' ? '❌' : '✅'} {exportStatus.message}
            </div>
          )}
          {exportContent && (
            <label className="form-group compact-group">
              <span>Содержимое экспорта ({exportFilename})</span>
              <textarea rows={12} value={exportContent} readOnly />
            </label>
          )}

          <hr style={{ margin: '24px 0' }} />

          <div className="section-header compact-header">
            <h3>Импорт всех данных</h3>
          </div>
          <p>Одна кнопка загружает все данные приложения из JSON-дампа (формат — результат экспорта выше).</p>
          <form onSubmit={handleImportAll}>
            <label className="form-group compact-group">
              <span>Файл дампа (JSON)</span>
              <input type="file" accept="application/json,.json" onChange={handleImportFile} />
            </label>
            <label className="form-group compact-group">
              <span>или вставьте содержимое</span>
              <textarea
                rows={10}
                value={importPayload}
                onChange={(e) => setImportPayload(e.target.value)}
                placeholder='{"skills":[...],"companies":[...],"students":[...],"vacancies":[...],"responses":[...]}'
                required
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="auth-btn" disabled={importLoading || !importPayload}>
                {importLoading ? 'Импорт...' : 'Импортировать все данные'}
              </button>
            </div>
            {importStatus && (
              <div className={`import-status ${importStatus.type === 'error' ? 'error' : 'success'}`}>
                {importStatus.type === 'error' ? '❌' : '✅'} {importStatus.message}
              </div>
            )}
          </form>
        </section>
      )}
    </div>
  );
}
