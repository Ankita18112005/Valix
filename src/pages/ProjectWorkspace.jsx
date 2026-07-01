import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, Settings, Plus, Play, CheckCircle2, Clock } from 'lucide-react';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { awardXP, XP_REWARDS } from '../services/reputationService';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import { toast } from 'react-hot-toast';
import './ProjectWorkspace.css';

export default function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [isFounder, setIsFounder] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // New task state
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('todo');

  useEffect(() => {
    if (!currentUser) return;

    const unsubs = [];

    // 1. Fetch Project Details
    const fetchProject = async () => {
      try {
        const projRef = doc(db, 'ideas', id);
        const projSnap = await getDoc(projRef);
        
        if (projSnap.exists()) {
          const data = projSnap.data();
          setProject({ id: projSnap.id, ...data });
          
          setIsFounder(data.userId === currentUser.uid);
          setIsMember(data.userId === currentUser.uid);
          
          // Also fetch accepted applications to get the team
          try {
            const teamQ = query(
              collection(db, 'applications'),
              where('ideaId', '==', id),
              where('status', '==', 'accepted')
            );
            
            const unsubTeam = onSnapshot(teamQ, (teamSnap) => {
              const members = teamSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              setTeamMembers(members);
              if (members.some(m => m.applicantId === currentUser.uid)) {
                setIsMember(true);
              }
            }, (err) => {
              console.warn("Team query error (composite index may be missing):", err);
            });
            unsubs.push(unsubTeam);
          } catch (err) {
            console.warn("Error setting up team listener:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();

    // 2. Fetch Tasks (subcollection — always fires even if empty)
    try {
      const taskQ = query(collection(db, `ideas/${id}/tasks`));
      
      const unsubTasks = onSnapshot(taskQ, (snap) => {
        const taskData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        taskData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setTasks(taskData);
      }, (err) => {
        console.warn("Tasks query error:", err);
      });
      unsubs.push(unsubTasks);
    } catch (err) {
      console.warn("Error setting up tasks listener:", err);
    }

    return () => {
      unsubs.forEach(u => u());
    };
  }, [id, currentUser]);

  if (!currentUser) return null;
  
  if (loading) return (
    <div className="workspace-page">
      <Navbar />
      <div className="workspace-container"><p>Loading workspace...</p></div>
    </div>
  );

  if (!isFounder && !isMember) {
    return (
      <div className="workspace-page">
        <Navbar />
        <div className="workspace-container">
          <h2>Access Denied</h2>
          <p>You must be a member of this project to view the workspace.</p>
          <Link to={`/idea/${id}`} className="workspace-btn primary">Back to Idea Page</Link>
        </div>
      </div>
    );
  }

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await addDoc(collection(db, `ideas/${id}/tasks`), {
        title: newTaskTitle,
        description: newTaskDesc,
        status: newTaskStatus,
        assigneeId: newTaskAssignee || null,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      toast.success("Task created");
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowNewTask(false);
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, `ideas/${id}/tasks`, taskId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      if (newStatus === 'done') {
        awardXP(currentUser.uid, 10, 'Completed Task');
      }
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error("Failed to update task");
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="workspace-page" id="project-workspace">
      <Navbar />
      
      <div className="workspace-header">
        <div className="workspace-header-inner">
          <div className="ws-title-area">
            <h1 className="ws-title">{project.title}</h1>
            <span className="ws-badge">Workspace</span>
          </div>
          <div className="ws-nav">
            <button className={`ws-nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <LayoutDashboard size={18} /> Overview
            </button>
            <button className={`ws-nav-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
              <CheckSquare size={18} /> Tasks
            </button>
            <button className={`ws-nav-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
              <Users size={18} /> Team
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-content animate-fade-in-up delay-1">
        
        {activeTab === 'overview' && (
          <div className="ws-tab-overview">
            <div className="ws-card">
              <h3>Project Brief</h3>
              <p><strong>Problem:</strong> {project.problem}</p>
              <p><strong>Solution:</strong> {project.solution}</p>
            </div>
            <div className="ws-grid">
              <div className="ws-card">
                <h3>Progress</h3>
                <div className="ws-progress-stats">
                  <div className="ws-stat">
                    <span>Total Tasks</span>
                    <strong>{tasks.length}</strong>
                  </div>
                  <div className="ws-stat">
                    <span>Completed</span>
                    <strong style={{color: 'var(--success)'}}>{doneTasks.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="ws-tab-tasks">
            <div className="ws-tasks-header">
              <h3>Task Board</h3>
              <button className="ws-btn primary" onClick={() => setShowNewTask(!showNewTask)}>
                <Plus size={16} /> New Task
              </button>
            </div>

            {showNewTask && (
              <form className="ws-new-task-form animate-fade-in-up" onSubmit={handleCreateTask}>
                <input 
                  type="text" className="ws-input" placeholder="Task title..."
                  value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required
                />
                <textarea 
                  className="ws-input" placeholder="Description (optional)" rows="2"
                  value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)}
                />
                <div className="ws-form-actions">
                  <select className="ws-input" value={newTaskStatus} onChange={e => setNewTaskStatus(e.target.value)}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button type="submit" className="ws-btn primary">Save Task</button>
                </div>
              </form>
            )}

            <div className="ws-kanban">
              {/* To Do Column */}
              <div className="kanban-column">
                <div className="kanban-col-header">
                  <span className="kanban-dot todo"></span>
                  <h4>To Do</h4>
                  <span className="kanban-count">{todoTasks.length}</span>
                </div>
                <div className="kanban-tasks">
                  {todoTasks.map(task => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleUpdateTaskStatus} />
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="kanban-column">
                <div className="kanban-col-header">
                  <span className="kanban-dot in-progress"></span>
                  <h4>In Progress</h4>
                  <span className="kanban-count">{inProgressTasks.length}</span>
                </div>
                <div className="kanban-tasks">
                  {inProgressTasks.map(task => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleUpdateTaskStatus} />
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div className="kanban-column">
                <div className="kanban-col-header">
                  <span className="kanban-dot done"></span>
                  <h4>Done</h4>
                  <span className="kanban-count">{doneTasks.length}</span>
                </div>
                <div className="kanban-tasks">
                  {doneTasks.map(task => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleUpdateTaskStatus} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="ws-tab-team">
            <div className="ws-card">
              <h3>Team Members</h3>
              <div className="ws-team-list">
                <div className="ws-team-member">
                  <div className="ws-member-avatar">{project.author?.name?.charAt(0) || 'F'}</div>
                  <div className="ws-member-info">
                    <strong>{project.author?.name || 'Founder'}</strong>
                    <span>Founder</span>
                  </div>
                </div>
                {teamMembers.map(member => (
                  <div key={member.id} className="ws-team-member">
                    <div className="ws-member-avatar">{member.applicantName?.charAt(0) || 'M'}</div>
                    <div className="ws-member-info">
                      <strong>{member.applicantName}</strong>
                      <span>{member.preferredRole}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
