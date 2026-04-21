import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../api';

const FALLBACK_DIRECTIONS = [
  '01.03.02 Прикладная математика и информатика',
  '09.03.01 Информатика и вычислительная техника',
  '09.03.02 Информационные системы и технологии',
  '09.03.03 Прикладная информатика',
  '02.04.02 Фундаментальная информатика и информационные технологии',
  '09.04.01 Информатика и вычислительная техника',
  '01.04.02 Прикладная математика и информатика',
];

export default function AddVacancyModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: '',
    company: 'ООО "Технологии будущего"',
    companyFull: 'ООО "Технологии будущего"',
    skills: [],
    category: 'Бакалавр',
    workType: 'Стажировка',
    practiceType: 'Производственная',
    employmentType: 'Полная',
    workFormat: 'Офис',
    salary: '',
    responsibilities: '',
    requirements: '',
    conditions: '',
    address: '',
    directions: [],
  });

  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableDirections, setAvailableDirections] = useState([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadMeta = async () => {
      setMetaLoading(true);
      setMetaError('');
      try {
        const response = await apiFetch('/vacancies/meta');
        if (!isMounted) {
          return;
        }

        setAvailableSkills(Array.isArray(response.skills) ? response.skills : []);
        setAvailableDirections(Array.isArray(response.directions) ? response.directions : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAvailableSkills([]);
        setAvailableDirections([]);
        setMetaError(error.message || 'Не удалось загрузить навыки и направления');
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

  const directionOptions = useMemo(() => {
    const merged = new Set([...FALLBACK_DIRECTIONS, ...availableDirections]);
    return Array.from(merged).sort((left, right) => left.localeCompare(right, 'ru'));
  }, [availableDirections]);

  const freeSkillOptions = useMemo(
    () => availableSkills.filter((skill) => !formData.skills.includes(skill)),
    [availableSkills, formData.skills]
  );

  const freeDirectionOptions = useMemo(
    () => directionOptions.filter((direction) => !formData.directions.includes(direction)),
    [directionOptions, formData.directions]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = () => {
    if (!selectedSkill || !freeSkillOptions.includes(selectedSkill)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, selectedSkill],
    }));
    setSelectedSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleAddDirection = () => {
    if (!selectedDirection || !freeDirectionOptions.includes(selectedDirection)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      directions: [...prev.directions, selectedDirection],
    }));
    setSelectedDirection('');
  };

  const handleRemoveDirection = (directionToRemove) => {
    setFormData((prev) => ({
      ...prev,
      directions: prev.directions.filter((direction) => direction !== directionToRemove),
    }));
  };

  const validateStep = (step) => {
    if (step === 1) {
      return formData.title.trim() && formData.category && formData.workType && formData.employmentType && formData.workFormat && String(formData.salary).trim() !== '';
    }

    if (step === 2) {
      return formData.responsibilities.trim() && formData.requirements.trim();
    }

    if (step === 3) {
      return formData.conditions.trim();
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) {
      setSubmitError('Заполните обязательные поля текущего шага, прежде чем переходить дальше.');
      return;
    }

    setSubmitError('');
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const goBack = () => {
    setSubmitError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePublish = async () => {
    if (submitting) {
      return;
    }

    if (!validateStep(3)) {
      setSubmitError('Заполните обязательные поля вакансии перед публикацией.');
      return;
    }

    const newVacancy = {
      ...formData,
      salary: parseInt(formData.salary, 10) || 0,
    };

    setSubmitting(true);
    setSubmitError('');

    try {
      await onAdd(newVacancy);
      onClose();
    } catch (error) {
      setSubmitError(error.message || 'Не удалось добавить вакансию');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormKeyDown = (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
      event.preventDefault();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-vacancy-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2>Добавить новую вакансию</h2>
          <div className="step-indicator">
            Шаг {currentStep} из {totalSteps}
          </div>
        </div>

        <form onSubmit={(event) => event.preventDefault()} onKeyDown={handleFormKeyDown}>
          <div className="modal-body">
            {currentStep === 1 && (
              <div className="form-step">
                <h3>Основная информация</h3>

                <div className="form-group">
                  <label>Название вакансии *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Например: Frontend-разработчик (стажер)"
                  />
                </div>

                <div className="form-group">
                  <label>Категория соискателя *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required>
                    <option value="Бакалавр">Бакалавр</option>
                    <option value="Специалист">Специалист</option>
                    <option value="Магистр">Магистр</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Вид работы *</label>
                    <select name="workType" value={formData.workType} onChange={handleChange} required>
                      <option value="Трудоустройство">Трудоустройство</option>
                      <option value="Стажировка">Стажировка</option>
                      <option value="Практика">Практика</option>
                      <option value="Другое">Другое</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Тип практики</label>
                    <select name="practiceType" value={formData.practiceType} onChange={handleChange}>
                      <option value="Производственная">Производственная</option>
                      <option value="Учебная">Учебная</option>
                      <option value="Преддипломная">Преддипломная</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Тип занятости *</label>
                    <select name="employmentType" value={formData.employmentType} onChange={handleChange} required>
                      <option value="Полная">Полная</option>
                      <option value="Частичная">Частичная</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Формат работы *</label>
                    <select name="workFormat" value={formData.workFormat} onChange={handleChange} required>
                      <option value="Офис">Офис</option>
                      <option value="Удаленная">Удаленная</option>
                      <option value="Гибрид">Гибрид</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Заработная плата (₽) *</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    required
                    min="0"
                    step="1000"
                    placeholder="30000"
                  />
                </div>

                <div className="form-group">
                  <label>Адрес</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="г. Москва, ул. Примерная, д. 1"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="form-step">
                <h3>Навыки и требования</h3>

                <div className="form-group">
                  <label>Требуемые навыки</label>
                  <div className="skill-selector">
                    <select
                      value={selectedSkill}
                      onChange={(event) => setSelectedSkill(event.target.value)}
                      disabled={metaLoading || freeSkillOptions.length === 0}
                    >
                      <option value="">
                        {metaLoading
                          ? 'Загрузка навыков...'
                          : freeSkillOptions.length
                            ? 'Выберите навык из базы'
                            : 'Нет доступных навыков'}
                      </option>
                      {freeSkillOptions.map((skill) => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="add-btn"
                      disabled={!selectedSkill}
                    >
                      Добавить
                    </button>
                  </div>

                  {metaError ? (
                    <p className="field-hint error-text">{metaError}</p>
                  ) : (
                    <p className="field-hint">Можно выбрать только существующие навыки из базы данных.</p>
                  )}

                  <div className="selected-items">
                    {formData.skills.length > 0 ? formData.skills.map((skill) => (
                      <span key={skill} className="selected-tag">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)}>×</button>
                      </span>
                    )) : <span className="selected-placeholder">Навыки пока не выбраны</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Обязанности *</label>
                  <textarea
                    name="responsibilities"
                    value={formData.responsibilities}
                    onChange={handleChange}
                    required
                    rows="5"
                    placeholder="Опишите обязанности кандидата..."
                  />
                </div>

                <div className="form-group">
                  <label>Требования к кандидату *</label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    required
                    rows="5"
                    placeholder="Опишите требования к кандидату..."
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="form-step">
                <h3>Условия работы и направления подготовки</h3>

                <div className="form-group">
                  <label>Условия работы *</label>
                  <textarea
                    name="conditions"
                    value={formData.conditions}
                    onChange={handleChange}
                    required
                    rows="5"
                    placeholder="Опишите условия работы, бонусы, преимущества..."
                  />
                </div>

                <div className="form-group">
                  <label>Направления подготовки</label>
                  <div className="direction-selector">
                    <select
                      value={selectedDirection}
                      onChange={(event) => setSelectedDirection(event.target.value)}
                      disabled={metaLoading || freeDirectionOptions.length === 0}
                    >
                      <option value="">
                        {metaLoading
                          ? 'Загрузка направлений...'
                          : freeDirectionOptions.length
                            ? 'Выберите направление подготовки'
                            : 'Все направления уже выбраны'}
                      </option>
                      {freeDirectionOptions.map((direction) => (
                        <option key={direction} value={direction}>{direction}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddDirection}
                      className="add-btn"
                      disabled={!selectedDirection}
                    >
                      Добавить
                    </button>
                  </div>

                  {!metaError && <p className="field-hint">Можно выбрать только направления из выпадающего списка.</p>}

                  <div className="selected-items">
                    {formData.directions.length > 0 ? formData.directions.map((direction) => (
                      <span key={direction} className="selected-tag">
                        {direction}
                        <button type="button" onClick={() => handleRemoveDirection(direction)}>×</button>
                      </span>
                    )) : <span className="selected-placeholder">Направления пока не выбраны</span>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="form-step">
                <h3>Предпросмотр вакансии</h3>

                <div className="preview-section">
                  <h4>{formData.title || 'Название вакансии'}</h4>

                  <div className="preview-info">
                    <p><strong>Категория:</strong> {formData.category}</p>
                    <p><strong>Вид работы:</strong> {formData.workType}</p>
                    {formData.practiceType && <p><strong>Тип практики:</strong> {formData.practiceType}</p>}
                    <p><strong>Занятость:</strong> {formData.employmentType}</p>
                    <p><strong>Формат:</strong> {formData.workFormat}</p>
                    <p><strong>Зарплата:</strong> {formData.salary ? `${formData.salary} ₽` : 'не указана'}</p>
                    <p><strong>Адрес:</strong> {formData.address || 'не указан'}</p>
                  </div>

                  {formData.skills.length > 0 && (
                    <div className="preview-skills">
                      <p><strong>Навыки:</strong></p>
                      <div className="preview-tags">
                        {formData.skills.map((skill) => (
                          <span key={skill} className="preview-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.directions.length > 0 && (
                    <div className="preview-directions">
                      <p><strong>Направления подготовки:</strong></p>
                      <ul>
                        {formData.directions.map((direction) => (
                          <li key={direction}>{direction}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="preview-directions">
                    <p><strong>Обязанности:</strong></p>
                    <p>{formData.responsibilities || '—'}</p>
                    <p><strong>Требования:</strong></p>
                    <p>{formData.requirements || '—'}</p>
                    <p><strong>Условия:</strong></p>
                    <p>{formData.conditions || '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {submitError && <div className="import-status error">❌ {submitError}</div>}

          <div className="modal-footer step-footer">
            <div className="step-buttons">
              {currentStep > 1 && (
                <button type="button" onClick={goBack} className="step-btn prev">
                  ← Назад
                </button>
              )}
              {currentStep < totalSteps ? (
                <button type="button" onClick={goNext} className="step-btn next">
                  {currentStep === totalSteps - 1 ? 'К предпросмотру →' : 'Далее →'}
                </button>
              ) : (
                <button type="button" className="submit-btn" disabled={submitting} onClick={handlePublish}>
                  {submitting ? 'Публикация...' : 'Опубликовать вакансию'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
