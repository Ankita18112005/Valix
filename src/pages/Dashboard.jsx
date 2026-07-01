import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lightbulb, ThumbsUp, Star, UserCheck, Plus, Edit, Compass, CheckCircle2,
  ShieldAlert, FileWarning, Activity, XOctagon, Tag, Zap, Award, Flame,
  Users, Target, Bell, Calendar, TrendingUp, ChevronRight
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { computeRoles, getLevelFromXP, getAchievements } from '../services/roleService';
import { RoleBadgeList } from '../components/RoleBadge';
import XPProgressBar from '../components/XPProgressBar';
import ApplicationCard from '../components/ApplicationCard';
import Navbar from '../components/Navbar';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [userIdeas, setUserIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const unsubs = [];

    // 1. Real-time Ideas Listener (user's ideas)
    const q = query(
      collection(db, 'ideas'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubIdeas = onSnapshot(q, (snapshot) => {
      const ideasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserIdeas(ideasData);
      setLoading(false);
    }, (error) => {
      console.warn("Snapshot error:", error);
      const fallbackQ = query(
        collection(db, 'ideas'),
        where('userId', '==', currentUser.uid)
      );
      onSnapshot(fallbackQ, (fbSnapshot) => {
        const fbIdeasData = fbSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        fbIdeasData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setUserIdeas(fbIdeasData);
        setLoading(false);
      });
    });
    unsubs.push(unsubIdeas);

    // 2. Recent Activity
    const fetchActivity = async () => {
      try {
        const actQ = query(
          collection(db, 'activity'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const actSnap = await getDocs(actQ);
        setRecentActivity(actSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.warn("Activity fetch error:", err);
      }
    };
    fetchActivity();

    // 3. Notifications
    const notifQ = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubNotif = onSnapshot(notifQ, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {
      // Index may not exist yet, silently handle
    });
    unsubs.push(unsubNotif);

    // 4. Team Applications received
    const appQ = query(
      collection(db, 'applications'),
      where('founderId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubApp = onSnapshot(appQ, (snap) => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.warn("Applications error:", error);
      const fbQ = query(collection(db, 'applications'), where('founderId', '==', currentUser.uid));
      onSnapshot(fbQ, (fbSnap) => {
        const d = fbSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApplications(d);
      });
    });
    unsubs.push(unsubApp);

    return () => {
      unsubs.forEach(u => u());
    };
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  // Derived data
  const xp = userData?.xp || 0;
  const trustScore = userData?.trustScore || 50;
  const streak = userData?.streak || 0;
  const roles = userData?.roles || computeRoles(userData);
  const level = getLevelFromXP(xp);
  const achievements = getAchievements(userData);
  const earnedAchievements = achievements.filter(a => a.earned);

  const totalIdeas = userData?.ideasCreated || userIdeas.length;
  const totalVotes = userIdeas.reduce((acc, idea) => acc + Object.values(idea.votes || {}).reduce((sum, v) => sum + v, 0), 0);
  const ideasValidated = userData?.ideasValidated || 0;
  const projectsJoined = userData?.projectsJoined || 0;

  const pendingAppsCount = applications.filter(a => a.status === 'pending').length;

  const getStatus = (idea, votes, score) => {
    const ageDays = (Date.now() - (idea.createdAt?.toMillis?.() || Date.now())) / (1000 * 60 * 60 * 24);
    if (ageDays < 7 && votes < 5) return { text: 'New', class: 'status-new' };
    if (score < 50 && votes > 5) return { text: 'Needs Work', class: 'status-needs-work' };
    if (votes > 15) return { text: 'Popular', class: 'status-popular' };
    return { text: 'Trending', class: 'status-trending' };
  };

  return (
    <div className="dash-page" id="dashboard-page">
      <Navbar />
      <div className="dash-container">
        
        {/* Main Content */}
        <div className="dash-main">
          {/* Welcome Header */}
          <div className="dash-header animate-fade-in-up">
            <div className="dash-header-top">
              <div>
                <h1 className="dash-title">Welcome back, {currentUser.displayName || 'Entrepreneur'}!</h1>
                <div style={{ marginTop: '8px' }}>
                  <RoleBadgeList roles={roles} size="sm" />
                </div>
              </div>
              <div className="dash-header-scores">
                <div className="dash-header-score-item">
                  <Zap size={16} />
                  <span className="dash-header-score-val">{xp.toLocaleString()} XP</span>
                </div>
                <div className="dash-header-score-item">
                  <Award size={16} />
                  <span className="dash-header-score-val">Trust {trustScore}</span>
                </div>
                <div className="dash-header-score-item">
                  <Flame size={16} style={{ color: streak >= 7 ? 'var(--primary)' : undefined }} />
                  <span className="dash-header-score-val">{streak}d streak</span>
                </div>
              </div>
            </div>
            
            {/* XP Progress */}
            <div style={{ marginTop: '16px' }}>
              <XPProgressBar xp={xp} compact />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="dash-stats">
            <div className="dash-stat-card dash-stat-primary animate-fade-in-up delay-1">
              <div className="dash-stat-header">
                <div className="dash-stat-icon"><Lightbulb size={20} /></div>
                <span className="dash-stat-label">Ideas Submitted</span>
              </div>
              <span className="dash-stat-value">{loading ? '...' : totalIdeas}</span>
            </div>
            <div className="dash-stat-card dash-stat-accent animate-fade-in-up delay-1">
              <div className="dash-stat-header">
                <div className="dash-stat-icon"><ThumbsUp size={20} /></div>
                <span className="dash-stat-label">Total Votes</span>
              </div>
              <span className="dash-stat-value">{loading ? '...' : totalVotes}</span>
            </div>
            <div className="dash-stat-card dash-stat-secondary animate-fade-in-up delay-2">
              <div className="dash-stat-header">
                <div className="dash-stat-icon"><Target size={20} /></div>
                <span className="dash-stat-label">Ideas Validated</span>
              </div>
              <span className="dash-stat-value">{loading ? '...' : ideasValidated}</span>
            </div>
            <div className="dash-stat-card dash-stat-primary animate-fade-in-up delay-2">
              <div className="dash-stat-header">
                <div className="dash-stat-icon"><Users size={20} /></div>
                <span className="dash-stat-label">Projects Joined</span>
              </div>
              <span className="dash-stat-value">{loading ? '...' : projectsJoined}</span>
            </div>
          </div>

          {/* Team Applications Section */}
          {applications.length > 0 && (
            <div className="dash-section animate-fade-in-up delay-2">
              <div className="dash-section-header" style={{display: 'flex', justifyContent: 'space-between'}}>
                <h2 className="dash-section-title">Team Applications</h2>
                {pendingAppsCount > 0 && (
                  <span className="badge-pill" style={{background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'}}>
                    {pendingAppsCount} pending
                  </span>
                )}
              </div>
              <div className="dash-apps-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px'}}>
                {applications.slice(0, 4).map(app => (
                  <ApplicationCard 
                    key={app.id} 
                    application={app} 
                    isFounder={true} 
                  />
                ))}
              </div>
            </div>
          )}

          {loading ? (
             <div className="dash-section"><p>Loading dashboard...</p></div>
          ) : totalIdeas === 0 ? (
            <div className="dash-section empty-state animate-fade-in-up delay-2">
              <div className="empty-icon"><Lightbulb size={40} /></div>
              <h2 className="empty-title">No ideas yet</h2>
              <p className="empty-desc">Start sharing your startup ideas with the community to get feedback.</p>
              <Link to="/create" className="qa-btn qa-btn-primary" style={{width: 'auto', padding: '12px 24px'}}>
                <Plus size={18} /> Submit First Idea
              </Link>
            </div>
          ) : (
            <>
              {/* Recent Ideas */}
              <div className="dash-section animate-fade-in-up delay-2">
                <div className="dash-section-header">
                  <h2 className="dash-section-title">Recent Ideas</h2>
                </div>
                <div className="dash-ideas-list">
                  {userIdeas.slice(0, 5).map(idea => {
                    const ideaScore = idea.score ?? idea.validationScore ?? 0;
                    const ideaVotes = Object.values(idea.votes || {}).reduce((sum, v) => sum + v, 0);
                    const status = getStatus(idea, ideaVotes, ideaScore);
                    const rating = (ideaScore / 20).toFixed(1);
                    const dateStr = idea.createdAt?.toDate ? idea.createdAt.toDate().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'Recently';

                    return (
                      <Link to={`/idea/${idea.id}`} key={idea.id} className="dash-idea-item">
                        <span className="dash-idea-title">{idea.title}</span>
                        <span className="dash-idea-category">{idea.tags?.[0] || 'General'}</span>
                        <span className="dash-idea-date">{dateStr}</span>
                        <span className="dash-idea-rating">{rating} ★ ({ideaVotes})</span>
                        <div><span className={`dash-idea-status ${status.class}`}>{status.text}</span></div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Idea Performance */}
              <div className="dash-section animate-fade-in-up delay-3">
                <div className="dash-section-header">
                  <h2 className="dash-section-title">Idea Performance</h2>
                </div>
                <div className="performance-list">
                  {userIdeas.map(idea => {
                    const ideaScore = idea.score ?? idea.validationScore ?? 0;
                    const ideaVotes = Object.values(idea.votes || {}).reduce((sum, v) => sum + v, 0);
                    const rating = (ideaScore / 20).toFixed(1);
                    const fullStars = Math.floor(ideaScore / 20);
                    const starsStr = "★".repeat(fullStars) + "☆".repeat(5 - fullStars);

                    return (
                      <div key={idea.id} className="perf-item">
                        <div className="perf-header">
                          <div>
                            <div className="perf-title">{idea.title}</div>
                            <span className="perf-stars">{starsStr}</span>
                            <span className="perf-score">{rating}</span>
                          </div>
                          <span className="perf-votes">Votes: {ideaVotes}</span>
                        </div>
                        <div className="perf-bar-bg">
                          <div className="perf-bar-fill" style={{ width: `${ideaScore}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Achievements */}
          <div className="dash-section animate-fade-in-up delay-3">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Achievements</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {earnedAchievements.length}/{achievements.length} earned
              </span>
            </div>
            <div className="dash-achievements-row">
              {achievements.slice(0, 6).map(a => (
                <div key={a.id} className={`dash-achievement ${a.earned ? 'earned' : 'locked'}`} title={a.description}>
                  <span className="dash-achievement-icon">{a.icon}</span>
                  <span className="dash-achievement-name">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="dash-sidebar animate-fade-in-up delay-4">
          
          <div className="dash-section">
            <h2 className="dash-section-title" style={{marginBottom: '16px'}}>Quick Actions</h2>
            <div className="qa-list">
              <Link to="/create" className="qa-btn qa-btn-primary">
                <Plus size={16} /> Submit New Idea
              </Link>
              <Link to="/profile" className="qa-btn">
                <Edit size={16} /> Edit Profile
              </Link>
              <Link to="/home" className="qa-btn">
                <Compass size={16} /> Browse Ideas
              </Link>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="dash-section">
            <h2 className="dash-section-title" style={{marginBottom: '16px'}}>
              <Bell size={16} /> Recent Notifications
            </h2>
            {notifications.length > 0 ? (
              <div className="dash-notif-list">
                {notifications.map(n => (
                  <div key={n.id} className={`dash-notif-item ${n.read ? '' : 'unread'}`}>
                    <p className="dash-notif-text">{n.message || n.title}</p>
                    <span className="dash-notif-time">
                      {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                No notifications yet.
              </p>
            )}
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="dash-section">
              <h2 className="dash-section-title" style={{marginBottom: '16px'}}>
                <Activity size={16} /> Recent Activity
              </h2>
              <div className="timeline">
                {recentActivity.slice(0, 5).map(act => (
                  <div key={act.id} className="tl-item">
                    <div className={`tl-icon ${act.xpChange > 0 ? 'tl-icon-create' : 'tl-icon-deduct'}`}>
                      {act.xpChange > 0 ? <CheckCircle2 size={16} /> : <XOctagon size={16} />}
                    </div>
                    <div className="tl-content">
                      <p className="tl-text">
                        {act.action}
                        <span className={`tl-xp ${act.xpChange > 0 ? 'positive' : 'negative'}`}>
                          {act.xpChange > 0 ? '+' : ''}{act.xpChange} XP
                        </span>
                      </p>
                      <p className="tl-date">
                        {act.createdAt?.toDate ? act.createdAt.toDate().toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
