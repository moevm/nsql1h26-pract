import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiFetch } from './api';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Navbar from './components/Layout/Navbar';
import Login from './components/Auth/Login';
import VacanciesPage from './components/Vacancies/VacanciesPage';
import AddVacancyModal from './components/Company/AddVacancyModal';
import StudentAnalytics from './components/Student/StudentAnalytics';
import CompanyAnalytics from './components/Company/CompanyAnalytics';
import ResponsesPage from './components/Company/ResponsesPage';
import AdminPanel from './components/Admin/AdminPanel';
import './App.css';

function CompanyModal({ company, onClose }) {
  if (!company) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content company-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="company-modal-header">
          <div className="company-modal-icon">🏢</div>
          <h2>{company.name}</h2>
        </div>

        <div className="company-modal-body">
          <div className="company-modal-section">
            <h4>О компании</h4>
            <p className="company-description">{company.description}</p>
          </div>

          <div className="company-modal-section">
            <h4>Контакты</h4>
            <div className="company-contacts">
              {company.email && (
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <a href={`mailto:${company.email}`}>{company.email}</a>
                </div>
              )}
              {company.phone && (
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <a href={`tel:${company.phone}`}>{company.phone}</a>
                </div>
              )}
              {company.website && (
                <div className="contact-item">
                  <span className="contact-icon">🌐</span>
                  <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
                </div>
              )}
              {company.address && (
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <span>{company.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="company-modal-section">
            <h4>Статистика</h4>
            <div className="company-stats-modal">
              <div className="stat-item">
                <span className="stat-value">{company.vacancies}</span>
                <span className="stat-label">вакансий</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{company.students}</span>
                <span className="stat-label">студентов</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{company.year}</span>
                <span className="stat-label">год основания</span>
              </div>
            </div>
          </div>

          {company.industries?.length > 0 && (
            <div className="company-modal-section">
              <h4>Сферы деятельности</h4>
              <div className="industries-tags">
                {company.industries.map((industry) => (
                  <span key={industry} className="industry-tag">{industry}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="company-modal-footer">
          <Link to={`/vacancies?companyId=${company.id}`} className="view-vacancies-btn" onClick={onClose}>
            Смотреть вакансии компании
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const response = await apiFetch('/companies');
        setCompanies(response.companies);
      } catch (_error) {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    }

    loadCompanies();
  }, []);

  return (
    <div className="page">
      <h1>Все компании-партнеры</h1>
      {loading ? (
        <p>Загрузка компаний...</p>
      ) : (
        <div className="companies-grid">
          {companies.map((company) => (
            <div key={company.id} className="company-card">
              <h3>{company.name}</h3>
              <p className="company-short-desc">{company.description?.substring(0, 100)}...</p>
              <div className="company-stats">
                <span>📊 {company.vacancies} вакансий</span>
                <span>👥 {company.students} студентов</span>
              </div>
              <div className="company-card-buttons">
                <button className="company-info-btn" onClick={() => setSelectedCompany(company)}>
                  О компании
                </button>
                <Link to={`/vacancies?companyId=${company.id}`} className="company-link">
                  Вакансии
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCompany && <CompanyModal company={selectedCompany} onClose={() => setSelectedCompany(null)} />}
    </div>
  );
}

function StudentPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await apiFetch('/students/me');
        setProfile(response.student);
        setSkills(response.skills);
        setApplications(response.applications);
      } catch (_error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return <div className="page">Загрузка профиля...</div>;
  }

  return (
    <div className="page">
      <div className="student-header">
        <h1>Личный кабинет студента</h1>
        <div className="student-tabs">
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            Мой профиль
          </button>
          <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            Аналитика
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="profile">
          <div className="profile-header">
            <div className="avatar">👨‍🎓</div>
            <h2>{profile?.name || user?.name}</h2>
            <p>{profile?.degree || 'Студент'} • {profile?.category || '—'}</p>
          </div>

          <div className="section">
            <h3>Мои навыки</h3>
            <div className="skills">
              {skills.map((skill) => (
                <div key={skill} className="skill-item">
                  {skill}
                  <span className="skill-level">Есть в профиле</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Мои отклики</h3>
            {applications.length > 0 ? (
              applications.map((application) => (
                <div key={`${application.vacancyId}-${application.createdAt}`} className="application-item">
                  <div>
                    <h4>{application.title}</h4>
                    <p>
                      Компания: {application.company} • Статус:{' '}
                      <span className={`status ${application.status}`}>{application.status}</span>
                    </p>
                  </div>
                  <span className="date">{new Date(application.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              ))
            ) : (
              <p>Пока нет откликов. Перейдите на страницу вакансий и откликнитесь на интересующую позицию.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <StudentAnalytics studentSkills={skills} />}
    </div>
  );
}

function CompanyPage() {
  const [activeTab, setActiveTab] = useState('vacancies');
  const [showAddModal, setShowAddModal] = useState(false);
  const [companyVacancies, setCompanyVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVacancies = useCallback(async () => {
    try {
      const response = await apiFetch('/companies/me/vacancies');
      setCompanyVacancies(response.vacancies);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
      setCompanyVacancies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVacancies();
  }, [loadVacancies]);

  const handleAddVacancy = async (newVacancy) => {
    const response = await apiFetch('/vacancies', {
      method: 'POST',
      body: JSON.stringify(newVacancy),
    });

    if (!response?.vacancy) {
      await loadVacancies();
      return null;
    }

    setCompanyVacancies((prev) => [response.vacancy, ...prev]);
    return response.vacancy;
  };

  const handleDeleteVacancy = async (vacancyId) => {
    const confirmed = window.confirm('Удалить вакансию? Это действие нельзя отменить.');
    if (!confirmed) {
      return;
    }

    await apiFetch(`/vacancies/${vacancyId}`, {
      method: 'DELETE',
    });

    setCompanyVacancies((prev) => prev.filter((vacancy) => vacancy.id !== vacancyId));
  };

  return (
    <div className="page">
      <div className="company-header">
        <h1>Личный кабинет компании</h1>
        <div className="company-tabs">
          <button className={`tab-btn ${activeTab === 'vacancies' ? 'active' : ''}`} onClick={() => setActiveTab('vacancies')}>
            Мои вакансии
          </button>
          <button className={`tab-btn ${activeTab === 'responses' ? 'active' : ''}`} onClick={() => setActiveTab('responses')}>
            Отклики
          </button>
          <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            Аналитика
          </button>
        </div>
      </div>

      {activeTab === 'vacancies' && (
        <>
          <div className="section-header">
            <h3>Мои вакансии ({companyVacancies.length})</h3>
            <button className="add-vacancy-btn" onClick={() => setShowAddModal(true)}>
              + Добавить вакансию
            </button>
          </div>

          {loading ? (
            <p>Загрузка вакансий...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="vacancies-list">
              {companyVacancies.map((vacancy) => (
                <div key={vacancy.id} className="vacancy-item">
                  <div>
                    <h4>{vacancy.title}</h4>
                    <p>Требуемые навыки: {vacancy.skills?.join(', ') || '—'}</p>
                  </div>
                  <div className="stats">
                    <span>📊 {vacancy.responses} откликов</span>
                    <div className="vacancy-actions">
                      <button className="stats-btn" type="button">{vacancy.salaryText}</button>
                      <button className="delete-vacancy-btn" type="button" onClick={() => handleDeleteVacancy(vacancy.id)}>
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'responses' && <ResponsesPage />}
      {activeTab === 'analytics' && <CompanyAnalytics companyId={1} />}

      {showAddModal && (
        <AddVacancyModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddVacancy}
        />
      )}
    </div>
  );
}

function AppRoutes() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vacancies" element={<VacanciesPage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/student"
            element={(
              <ProtectedRoute allowedRole="student">
                <StudentPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/company"
            element={(
              <ProtectedRoute allowedRole="company">
                <CompanyPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin"
            element={(
              <ProtectedRoute allowedRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
