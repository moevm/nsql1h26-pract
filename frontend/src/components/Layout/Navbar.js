import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          🎓 ЛК Партнер 2.0
        </Link>
        
        <div className="nav-links">
          <Link to="/">Главная</Link>
          <Link to="/vacancies">Вакансии</Link>
          
          {!user ? (
            <>
              <Link to="/login">Войти</Link>
            </>
          ) : (
            <>
              {user.role === 'student' && (
                <Link to="/student">Личный кабинет студента</Link>
              )}
              {user.role === 'company' && (
                <Link to="/company">Личный кабинет компании</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin">Админ-панель</Link> 
              )}
              <button onClick={handleLogout} className="logout-btn">
                Выйти ({user.name})
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}