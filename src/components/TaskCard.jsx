import { Clock } from 'lucide-react';
import './TaskCard.css';

export default function TaskCard({ task, onStatusChange }) {
  
  const handleStatusChange = (e) => {
    onStatusChange(task.id, e.target.value);
  };

  return (
    <div className="task-card">
      <h4 className="task-title">{task.title}</h4>
      {task.description && (
        <p className="task-desc">{task.description}</p>
      )}
      <div className="task-footer">
        <span className="task-date">
          <Clock size={12} />
          {task.createdAt?.toDate ? task.createdAt.toDate().toLocaleDateString() : 'New'}
        </span>
        <select 
          className="task-status-select" 
          value={task.status} 
          onChange={handleStatusChange}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
}
