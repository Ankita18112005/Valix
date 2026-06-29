import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lightbulb, ThumbsUp, Star, UserCheck, Plus, Edit, Compass, Bookmark, Settings, CheckCircle2 } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userIdeas, setUserIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // 1. Fetch Profile Completion
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        let completion = 0;
        if (currentUser.displayName) completion += 25;
        if (currentUser.email) completion += 25;
        if (currentUser.photoURL) completion += 25;
        if (userDoc.exists() && userDoc.data().bio) completion += 25;
        setProfileCompletion(completion);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();

    // 2. Real-time Ideas Listener
    const q = query(
      collection(db, 'ideas'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ideasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserIdeas(ideasData);
      setLoading(false);
    }, (error) => {
      console.warn("Snapshot error (composite index might be missing):", error);
      // Fallback if missing index for orderBy
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

    return () => unsubscribe();
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  // Derived Stats
  const totalIdeas = userIdeas.length;
  const totalVotes = userIdeas.reduce((acc, idea) => acc + Object.values(idea.votes || {}).reduce((sum, v) => sum + v, 0), 0);
  const totalScore = userIdeas.reduce((acc, curr) => acc + (curr.score ?? curr.validationScore ?? 0), 0);
  const avgScore = totalIdeas > 0 ? Math.round(totalScore / totalIdeas) : 0;
  
  // Format rating (e.g. 90/100 -> 4.5)
  const avgRating = totalIdeas > 0 ? (avgScore / 20).toFixed(1) : 0;

  const statCards = [
    { label: 'Total Ideas', value: totalIdeas, icon: <Lightbulb size={20} />, color: 'primary' },
    { label: 'Total Votes', value: totalVotes, icon: <ThumbsUp size={20} />, color: 'accent' },
    { label: 'Avg Rating', value: totalIdeas > 0 ? `${avgRating} ★` : 'N/A', icon: <Star size={20} />, color: 'secondary' },
    { label: 'Profile', value: `${profileCompletion}%`, icon: <UserCheck size={20} />, color: 'primary' },
  ];

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
          <div className="dash-header animate-fade-in-up">
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-sub">Welcome back, {currentUser.displayName || 'Entrepreneur'}!</p>
          </div>

          {/* Stats */}
          <div className="dash-stats">
            {statCards.map((s, i) => (
              <div key={i} className={`dash-stat-card dash-stat-${s.color} animate-fade-in-up delay-${i + 1}`}>
                <div className="dash-stat-header">
                  <div className="dash-stat-icon">{s.icon}</div>
                  <span className="dash-stat-label">{s.label}</span>
                </div>
                <span className="dash-stat-value">{loading ? '...' : s.value}</span>
                {s.label === 'Profile' && profileCompletion < 100 && (
                  <Link to="/profile" style={{fontSize: '11px', color: 'var(--primary)', marginTop: '4px', textDecoration: 'none'}}>Complete Profile →</Link>
                )}
              </div>
            ))}
          </div>

          {loading ? (
             <div className="dash-section"><p>Loading dashboard...</p></div>
          ) : totalIdeas === 0 ? (
            /* Empty State */
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

          {/* Timeline */}
          {userIdeas.length > 0 && (
            <div className="dash-section">
              <h2 className="dash-section-title" style={{marginBottom: '16px'}}>Recent Activity</h2>
              <div className="timeline">
                {userIdeas.slice(0, 4).map(idea => (
                  <div key={idea.id} className="tl-item">
                    <div className="tl-icon tl-icon-create">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="tl-content">
                      <p className="tl-text">You submitted a new idea: <strong>{idea.title}</strong></p>
                      <p className="tl-date">
                        {idea.createdAt?.toDate ? idea.createdAt.toDate().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'Recently'}
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
