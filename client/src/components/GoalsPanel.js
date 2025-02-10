import React from 'react';
import '../styles/GoalsPanel.css';

const GoalsPanel = () => {
  const goals = [
    { id: 1, goal: "Increase positive mood frequency", progress: 60 },
    { id: 2, goal: "Reduce anxiety levels", progress: 40 },
    { id: 3, goal: "Improve sleep quality", progress: 80 }
  ];

  return (
    <div className="goals-panel">
      <h2>Goals</h2>
      <ul>
        {goals.map(goal => (
          <li key={goal.id}>
            <span>{goal.goal}</span>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${goal.progress}%` }}>
                {goal.progress}%
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoalsPanel;
