import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import '../styles/TasksPage.css';

const statusColumns = [
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
];

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    api.get('/tasks').then(res => setTasks(res.data));
    const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000');
    socket.on('task-new', (task) => setTasks(prev => [task, ...prev]));
    socket.on('task-updated', (task) => setTasks(prev => prev.map(t => t.id === task.id ? task : t)));
    return () => socket.disconnect();
  }, []);

  const updateStatus = async (task, status) => {
    await api.put(`/tasks/${task.id}`, { status });
  };

  return (
    <div className="tasks-kanban-page">
      <h2>Escalation Tasks</h2>
      <div className="kanban-board">
        {statusColumns.map(col => (
          <div className="kanban-column" key={col.key}>
            <h3>{col.label}</h3>
            {tasks.filter(t => t.status === col.key).length === 0 ? (
              <div className="kanban-empty">No tasks</div>
            ) : (
              tasks.filter(t => t.status === col.key).map(task => (
                <div className={`kanban-card priority-${task.priority}`} key={task.id}>
                  <div className="kanban-card-header">
                    <span className="kanban-client">{task.client?.name || 'Unknown Client'}</span>
                    <span className="kanban-priority">{task.priority}</span>
                  </div>
                  <div className="kanban-alert">{task.alert?.message}</div>
                  <div className="kanban-due">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</div>
                  <div className="kanban-comments">{task.comments}</div>
                  <div className="kanban-actions">
                    {col.key !== 'done' && (
                      <button onClick={() => updateStatus(task, col.key === 'open' ? 'in-progress' : 'done')}>
                        Mark as {col.key === 'open' ? 'In Progress' : 'Done'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksPage; 