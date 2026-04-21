import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const demoUsers = [
  { role: 'student', email: 'student@example.com', password: 'student123', label: 'Студент' },
  { role: 'company', email: 'company@example.com', password: 'company123', label: 'Компания' },
  { role: 'admin', email: 'admin@example.com', password: 'admin123', label: 'Администратор' },
];

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const user = await login(formData.email, formData.password, formData.role);
      if (user.role === 'student') {
        navigate('/student');
      } else if (user.role === 'company') {
        navigate('/company');
      } else {
        navigate('/admin');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const fillDemoUser = (demoUser) => {
    setFormData({
      email: demoUser.email,
      password: demoUser.password,
      role: demoUser.role,
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Вход в систему</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Введите email"
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Введите пароль"
            />
          </div>

          <div className="form-group">
            <label>Роль</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="student">Студент</option>
              <option value="company">Представитель компании</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          {error && <div className="import-status error">❌ {error}</div>}

          <button type="submit" className="auth-btn" disabled={submitting}>
            {submitting ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="section" style={{ marginTop: 24 }}>
          <h3>Отладочные пользователи</h3>
          <div className="skills" style={{ gap: 12 }}>
            {demoUsers.map((demoUser) => (
              <button
                key={demoUser.role}
                type="button"
                className="details-btn"
                onClick={() => fillDemoUser(demoUser)}
              >
                {demoUser.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
