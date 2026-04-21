import React, { useState, useEffect } from 'react';

// Компонент для круговой диаграммы
function PieChart({ data, title }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="chart-card">
      <h4>{title}</h4>
      <div className="pie-chart-wrapper">
        <div 
          className="pie-chart"
          style={{
            background: `conic-gradient(${data.map((item, i) => {
              const start = data.slice(0, i).reduce((sum, d) => sum + d.value, 0) / total * 360;
              const end = start + (item.value / total * 360);
              return `${item.color} ${start}deg ${end}deg`;
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
              <span className="legend-color" style={{ backgroundColor: item.color }}></span>
              <span className="legend-label">{item.label}</span>
              <span className="legend-value">{item.value} ({Math.round(item.value / total * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Компонент для столбчатой диаграммы
function BarChart({ data, title }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="chart-card">
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

export default function CompanyAnalytics({ companyId }) {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      const mockData = {
        // Распределение по категориям студентов
        studentCategories: [
          { label: 'Бакалавр', value: 78, color: '#3b82f6' },
          { label: 'Специалист', value: 42, color: '#10b981' },
          { label: 'Магистр', value: 36, color: '#f59e0b' }
        ],
        
        // Навыки студентов (топ)
        studentSkills: [
          { label: 'JavaScript', value: 89, color: '#f7df1e' },
          { label: 'Python', value: 76, color: '#3776ab' },
          { label: 'React', value: 67, color: '#61dafb' },
          { label: 'SQL', value: 54, color: '#4479a1' },
          { label: 'Node.js', value: 48, color: '#339933' },
          { label: 'TypeScript', value: 42, color: '#3178c6' }
        ],
        
        // Динамика откликов по месяцам
        responsesOverTime: [
          { month: 'Янв', responses: 12 },
          { month: 'Фев', responses: 18 },
          { month: 'Мар', responses: 25 },
          { month: 'Апр', responses: 22 },
          { month: 'Май', responses: 31 },
          { month: 'Июн', responses: 28 },
          { month: 'Июл', responses: 20 }
        ]
      };
      
      setAnalyticsData(mockData);
      setLoading(false);
    }, 1500);
  }, [timeRange, companyId]);

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Загружаем аналитику...</p>
      </div>
    );
  }

  return (
    <div className="company-analytics">
      <div className="analytics-header">
        <h2>Аналитика откликов</h2>
      </div>

      {/* График динамики откликов */}
      <div className="chart-card full-width">
        <h4>Динамика откликов</h4>
        <div className="line-chart">
          {analyticsData.responsesOverTime.map((item, index) => (
            <div key={index} className="chart-column">
              <div 
                className="chart-bar" 
                style={{ 
                  height: `${(item.responses / Math.max(...analyticsData.responsesOverTime.map(d => d.responses))) * 200}px`
                }}
              >
                <span className="chart-tooltip">{item.responses}</span>
              </div>
              <span className="chart-label">{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Две колонки с диаграммами */}
      <div className="charts-row">
        <PieChart 
          data={analyticsData.studentCategories}
          title="Распределение по категориям студентов"
        />
        
        <BarChart 
          data={analyticsData.studentSkills}
          title="Навыки откликнувшихся студентов"
        />
      </div>
    </div>
  );
}