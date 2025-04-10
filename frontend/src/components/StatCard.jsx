import React from 'react';
import '../styles/StatCard.css';

const StatCard = ({ title, value, icon, growth, className }) => {
  // Determine growth direction and icon
  const isPositiveGrowth = growth > 0;
  const growthIcon = isPositiveGrowth ? '↑' : '↓';
  const growthClass = isPositiveGrowth ? 'positive' : 'negative';
  const absoluteGrowth = Math.abs(growth || 0);

  return (
    <div className={`stat-card ${className || ''}`}>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
        {growth !== undefined && (
          <div className={`stat-growth ${growthClass}`}>
            {growthIcon} {absoluteGrowth}% from last week
          </div>
        )}
      </div>
      <div className="stat-icon">
        {icon === 'users' && <i className="icon-users">👥</i>}
        {icon === 'check' && <i className="icon-check">✓</i>}
        {icon === 'warning' && <i className="icon-warning">⚠</i>}
      </div>
    </div>
  );
};

export default StatCard;