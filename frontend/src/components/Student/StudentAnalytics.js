import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Компонент для отображения графика (простая версия без библиотек)
function SimpleBarChart({ data, title }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="chart-container">
      <h4>{title}</h4>
      <div className="bar-chart">
        {data.map((item, index) => (
          <div key={index} className="bar-item">
            <div className="bar-label">{item.label}</div>
            <div className="bar-wrapper">
              <div 
                className="bar-fill" 
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || '#3b82f6'
                }}
              >
                <span className="bar-value">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент для отображения круговой диаграммы (простая версия)
function SimplePieChart({ data, title }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;
  
  const getPieSlice = (percent, index) => {
    const start = cumulativePercent * 360;
    cumulativePercent += percent;
    const end = cumulativePercent * 360;
    
    return {
      background: `conic-gradient(${data.map((item, i) => {
        const itemStart = data.slice(0, i).reduce((sum, d) => sum + d.value / total, 0) * 360;
        const itemEnd = itemStart + (data[i].value / total) * 360;
        return `${data[i].color || '#3b82f6'} ${itemStart}deg ${itemEnd}deg`;
      }).join(', ')})`
    };
  };

  return (
    <div className="chart-container">
      <h4>{title}</h4>
      <div className="pie-chart-wrapper">
        <div 
          className="pie-chart"
          style={{
            background: `conic-gradient(${data.map((item, i) => {
              const start = data.slice(0, i).reduce((sum, d) => sum + d.value, 0) / total * 360;
              const end = start + (item.value / total * 360);
              return `${item.color || '#3b82f6'} ${start}deg ${end}deg`;
            }).join(', ')})`
          }}
        >
          <div className="pie-center">
            <span>{total}</span>
          </div>
        </div>
        <div className="pie-legend">
          {data.map((item, index) => (
            <div key={index} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: item.color || '#3b82f6' }}></span>
              <span className="legend-label">{item.label}</span>
              <span className="legend-value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Компонент для карточки рекомендации
function RecommendationCard({ skill, demand, currentLevel, recommendation, onAddSkill }) {
  const getDemandLevel = (level) => {
    if (level >= 80) return 'Очень высокий';
    if (level >= 60) return 'Высокий';
    if (level >= 40) return 'Средний';
    return 'Низкий';
  };

  const getDemandColor = (level) => {
    if (level >= 80) return '#10b981';
    if (level >= 60) return '#3b82f6';
    if (level >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="recommendation-card">
      <div className="recommendation-header">
        <h4>{skill}</h4>
        <span className="demand-badge" style={{ backgroundColor: getDemandColor(demand) }}>
          {getDemandLevel(demand)}
        </span>
      </div>
      
      <div className="skill-progress">
        <div className="progress-label">
          <span>Текущий уровень</span>
          <span>{currentLevel}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${currentLevel}%` }}></div>
        </div>
      </div>
      
      <div className="recommendation-text">
        <p>{recommendation}</p>
      </div>
      
      <button className="add-skill-btn" onClick={() => onAddSkill(skill)}>
        + Добавить в профиль
      </button>
    </div>
  );
}

export default function StudentAnalytics({ studentSkills = [] }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [vacancyMatches, setVacancyMatches] = useState([]);
  const [marketDemand, setMarketDemand] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [selectedView, setSelectedView] = useState('matches'); // 'matches', 'demand', 'development'

  // Моковые данные для демонстрации
  useEffect(() => {
    // Имитация загрузки данных
    setTimeout(() => {
      // Вакансии с оценкой совместимости
      const mockVacancyMatches = [
        {
          id: 1,
          title: 'Frontend-разработчик (React)',
          company: 'ООО "Технологии будущего"',
          matchPercentage: 92,
          matchedSkills: ['React', 'JavaScript', 'CSS'],
          missingSkills: ['TypeScript', 'Redux'],
          salary: 'от 80 000 ₽',
          priority: 'high'
        },
        {
          id: 2,
          title: 'Fullstack-разработчик',
          company: 'Компания 3',
          matchPercentage: 78,
          matchedSkills: ['React', 'JavaScript', 'Node.js'],
          missingSkills: ['TypeScript', 'MongoDB', 'Docker'],
          salary: 'от 100 000 ₽',
          priority: 'medium'
        },
        {
          id: 3,
          title: 'JavaScript-разработчик',
          company: 'Стартап "Инновации"',
          matchPercentage: 85,
          matchedSkills: ['JavaScript', 'CSS', 'HTML'],
          missingSkills: ['React', 'Redux'],
          salary: 'от 70 000 ₽',
          priority: 'high'
        },
        {
          id: 4,
          title: 'Backend-разработчик (Node.js)',
          company: 'ООО "Бэкенд Солюшнс"',
          matchPercentage: 65,
          matchedSkills: ['JavaScript', 'Node.js'],
          missingSkills: ['Python', 'SQL', 'Docker'],
          salary: 'от 90 000 ₽',
          priority: 'medium'
        },
        {
          id: 5,
          title: 'QA Инженер',
          company: 'Тест Лаб',
          matchPercentage: 45,
          matchedSkills: ['Внимательность'],
          missingSkills: ['Тестирование', 'Selenium', 'Postman'],
          salary: 'от 60 000 ₽',
          priority: 'low'
        }
      ];

      // Востребованность навыков на рынке
      const mockMarketDemand = [
        { skill: 'React', demand: 95, growth: '+15%' },
        { skill: 'TypeScript', demand: 88, growth: '+25%' },
        { skill: 'Python', demand: 92, growth: '+10%' },
        { skill: 'Node.js', demand: 85, growth: '+8%' },
        { skill: 'Docker', demand: 82, growth: '+20%' },
        { skill: 'SQL', demand: 90, growth: '+5%' },
        { skill: 'JavaScript', demand: 100, growth: '+2%' },
        { skill: 'CSS', demand: 75, growth: '-5%' }
      ];

      // Рекомендации по развитию
      const mockRecommendations = [
        {
          skill: 'TypeScript',
          demand: 88,
          currentLevel: 0,
          recommendation: 'TypeScript становится стандартом в крупных проектах. Рекомендуем изучить типы, интерфейсы и дженерики.'
        },
        {
          skill: 'Docker',
          demand: 82,
          currentLevel: 0,
          recommendation: 'Контейнеризация обязательна для современной разработки. Начните с основ Docker и Docker Compose.'
        },
        {
          skill: 'Redux',
          demand: 70,
          currentLevel: 0,
          recommendation: 'Для управления состоянием в React-приложениях. Изучите Redux Toolkit и RTK Query.'
        },
        {
          skill: 'Python',
          demand: 92,
          currentLevel: 0,
          recommendation: 'Универсальный язык. Углубитесь в веб-разработку (Django/Flask) или анализ данных.'
        }
      ];

      // Распределение навыков по категориям
      const mockSkillCategories = [
        { category: 'Frontend', value: 45, color: '#3b82f6' },
        { category: 'Backend', value: 25, color: '#10b981' },
        { category: 'DevOps', value: 10, color: '#f59e0b' },
        { category: 'Базы данных', value: 15, color: '#ef4444' },
        { category: 'Другое', value: 5, color: '#8b5cf6' }
      ];

      setVacancyMatches(mockVacancyMatches);
      setMarketDemand(mockMarketDemand);
      setRecommendations(mockRecommendations);
      setSkillCategories(mockSkillCategories);
      setLoading(false);
    }, 1000);
  }, []);

  const getMatchColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const handleAddSkill = (skill) => {
    alert(`Навык "${skill}" добавлен в ваш профиль! (демо-режим)`);
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Загружаем аналитику...</p>
      </div>
    );
  }

  return (
    <div className="student-analytics">
      <div className="analytics-header">
        <h2>Аналитика для {user?.name}</h2>
        <div className="analytics-tabs">
          <button 
            className={`tab-btn ${selectedView === 'matches' ? 'active' : ''}`}
            onClick={() => setSelectedView('matches')}
          >
            Подходящие вакансии
          </button>
          <button 
            className={`tab-btn ${selectedView === 'demand' ? 'active' : ''}`}
            onClick={() => setSelectedView('demand')}
          >
            Востребованность навыков
          </button>
          <button 
            className={`tab-btn ${selectedView === 'development' ? 'active' : ''}`}
            onClick={() => setSelectedView('development')}
          >
            Рекомендации по развитию
          </button>
        </div>
      </div>

      {/* Вкладка с подходящими вакансиями */}
      {selectedView === 'matches' && (
        <div className="analytics-section">
          <div className="section-header">
            <h3>Вакансии по совместимости навыков</h3>
            <p className="section-description">
              Отсортировано по проценту совпадения ваших навыков с требованиями вакансии
            </p>
          </div>

          <div className="vacancy-matches-list">
            {vacancyMatches.map(vacancy => (
              <div key={vacancy.id} className="vacancy-match-card">
                <div className="match-header">
                  <div>
                    <h4>{vacancy.title}</h4>
                    <span className="company">{vacancy.company}</span>
                  </div>
                  <div className="match-percentage" style={{ color: getMatchColor(vacancy.matchPercentage) }}>
                    <span className="percentage">{vacancy.matchPercentage}%</span>
                    <span className="percentage-label">совпадение</span>
                  </div>
                </div>

                <div className="match-details">
                  <div className="skills-match">
                    <div className="matched-skills">
                      <span className="skill-label">Ваши навыки:</span>
                      <div className="skill-tags">
                        {vacancy.matchedSkills.map(skill => (
                          <span key={skill} className="skill-tag matched">✓ {skill}</span>
                        ))}
                      </div>
                    </div>
                    
                    {vacancy.missingSkills.length > 0 && (
                      <div className="missing-skills">
                        <span className="skill-label">Не хватает:</span>
                        <div className="skill-tags">
                          {vacancy.missingSkills.map(skill => (
                            <span key={skill} className="skill-tag missing">+ {skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="match-footer">
                    <span className="salary">{vacancy.salary}</span>
                    <button className="view-vacancy-btn">Подробнее</button>
                  </div>
                </div>

                <div className="match-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${vacancy.matchPercentage}%`,
                        backgroundColor: getMatchColor(vacancy.matchPercentage)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Вкладка с востребованностью навыков */}
      {selectedView === 'demand' && (
        <div className="analytics-section">
          <div className="section-header">
            <h3>Востребованность навыков на рынке</h3>
          </div>

          <div className="demand-analytics">
            <SimpleBarChart 
              data={marketDemand.map(item => ({
                label: item.skill,
                value: item.demand,
                color: '#3b82f6'
              }))}
              title="Востребованность навыков (%)"
            />
          </div>
        </div>
      )}

      {/* Вкладка с рекомендациями по развитию */}
      {selectedView === 'development' && (
        <div className="analytics-section">
          <div className="section-header">
            <h3>Рекомендации по развитию</h3>
            <p className="section-description">
              На основе ваших текущих навыков и требований рынка
            </p>
          </div>

          <div className="recommendations-grid">
            {recommendations.map(rec => (
              <RecommendationCard 
                key={rec.skill}
                skill={rec.skill}
                demand={rec.demand}
                currentLevel={rec.currentLevel}
                recommendation={rec.recommendation}
                onAddSkill={handleAddSkill}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}