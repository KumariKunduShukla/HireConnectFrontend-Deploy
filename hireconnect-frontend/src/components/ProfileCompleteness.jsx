import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { calculateProfileCompleteness } from '../utils/profileUtils';
import './ProfileCompleteness.css';

export default function ProfileCompleteness({ profile, role }) {
  const { percentage, missingItems } = useMemo(
    () => calculateProfileCompleteness(profile, role),
    [profile, role]
  );

  if (percentage === 100) {
    return (
      <div className="completeness-card card premium-card fade-in">
        <div className="completeness-header">
          <div className="completeness-icon-success">🏆</div>
          <div>
            <h3>Profile Perfected!</h3>
            <p>Your professional identity is fully optimized.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="completeness-card card fade-in">
      <div className="completeness-top">
        <div className="progress-ring-container">
          <svg className="progress-ring" width="60" height="60">
            <circle
              className="progress-ring-bg"
              stroke="#e2e8f0"
              strokeWidth="4"
              fill="transparent"
              r="26"
              cx="30"
              cy="30"
            />
            <circle
              className="progress-ring-fill"
              stroke="var(--accent)"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              fill="transparent"
              r="26"
              cx="30"
              cy="30"
            />
          </svg>
          <span className="progress-text">{percentage}%</span>
        </div>
        <div className="completeness-info">
          <h3>Profile Strength</h3>
          <p>{percentage < 50 ? 'Low visibility' : percentage < 80 ? 'Good progress' : 'Almost there!'}</p>
        </div>
      </div>

      <div className="missing-list">
        <h4>Next Steps:</h4>
        <ul>
          {missingItems.slice(0, 3).map((item, idx) => (
            <li key={idx}>
              <Link to="/profile">
                <span>➕</span> Add {item}
              </Link>
            </li>
          ))}
          {missingItems.length > 3 && (
            <li className="more-items">
              <Link to="/profile">+{missingItems.length - 3} more items</Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
