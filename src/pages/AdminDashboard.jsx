import { useState, useEffect } from 'react';
import { ShieldAlert, FileWarning, Activity, XOctagon, Tag } from 'lucide-react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Navbar from '../components/Navbar';
import './AdminDashboard.css';

export default function AdminDashboard({ showToast }) {
  const [ideas, setIdeas] = useState([]);
  const [rejectedIdeas, setRejectedIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs = [];
    
    // Fetch valid ideas
    const qIdeas = query(collection(db, 'ideas'), orderBy('createdAt', 'desc'));
    const unsubIdeas = onSnapshot(qIdeas, (snapshot) => {
      const ideasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIdeas(ideasData);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching admin ideas:", error);
      const fallbackQ = query(collection(db, 'ideas'));
      const unsubFallback = onSnapshot(fallbackQ, (fbSnapshot) => {
        const fbIdeasData = fbSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        fbIdeasData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setIdeas(fbIdeasData);
        setLoading(false);
      });
      unsubs.push(unsubFallback);
    });
    unsubs.push(unsubIdeas);

    // Fetch rejected ideas
    const qRejected = query(collection(db, 'rejected_ideas'), orderBy('createdAt', 'desc'));
    const unsubRejected = onSnapshot(qRejected, (snapshot) => {
      const rejectedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRejectedIdeas(rejectedData);
    }, (error) => {
      console.warn("Error fetching rejected ideas:", error);
      const fallbackQ = query(collection(db, 'rejected_ideas'));
      const unsubFallback = onSnapshot(fallbackQ, (fbSnapshot) => {
        const fbRejectedData = fbSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        fbRejectedData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setRejectedIdeas(fbRejectedData);
      });
      unsubs.push(unsubFallback);
    });
    unsubs.push(unsubRejected);

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // Calculate Metrics
  // Since we strict validate now, ALL ideas in the 'ideas' collection are valid and passed checks.
  const validIdeas = ideas;
  const spamIdeas = rejectedIdeas.filter(i => i.isSpam);
  
  // Duplicate sub-check (though now duplicates are also just 'rejected_ideas')
  // We can look at rejectionReasons to see if they were rejected for duplicates
  const duplicateIdeas = rejectedIdeas.filter(i => 
    i.rejectionReasons && i.rejectionReasons.some(r => r.toLowerCase().includes('similar to'))
  );
  
  const avgQualityScore = validIdeas.length > 0
    ? Math.round(validIdeas.reduce((acc, curr) => acc + (curr.qualityScore || 0), 0) / validIdeas.length)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const rejectedToday = rejectedIdeas.filter(i => {
    if (!i.createdAt) return false;
    const date = i.createdAt.toDate ? i.createdAt.toDate() : new Date(i.createdAt);
    return date >= today;
  }).length;

  // Top Duplicate Categories
  const dupCategories = {};
  duplicateIdeas.forEach(idea => {
    if (idea.tags && idea.tags.length > 0) {
      idea.tags.forEach(tag => {
        dupCategories[tag] = (dupCategories[tag] || 0) + 1;
      });
    }
  });

  const topDupCategories = Object.entries(dupCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);

  // Combine for recent activity
  const allActivity = [...rejectedIdeas, ...validIdeas].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  return (
    <div className="admin-page" id="admin-dashboard-page">
      <Navbar showToast={showToast} />
      <div className="admin-container">
        
        <div className="admin-header animate-fade-in-up">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-sub">Platform Moderation & Quality Metrics</p>
        </div>

        {loading ? (
          <div className="admin-loading"><span className="auth-spinner"></span> Loading metrics...</div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card danger animate-fade-in-up delay-1">
                <div className="admin-stat-icon"><ShieldAlert size={24} /></div>
                <div className="admin-stat-info">
                  <span className="admin-stat-value">{rejectedIdeas.length}</span>
                  <span className="admin-stat-label">Total Rejected Ideas</span>
                </div>
              </div>

              <div className="admin-stat-card warning animate-fade-in-up delay-2">
                <div className="admin-stat-icon"><FileWarning size={24} /></div>
                <div className="admin-stat-info">
                  <span className="admin-stat-value">{duplicateIdeas.length}</span>
                  <span className="admin-stat-label">Duplicate Submissions</span>
                </div>
              </div>

              <div className="admin-stat-card primary animate-fade-in-up delay-3">
                <div className="admin-stat-icon"><Activity size={24} /></div>
                <div className="admin-stat-info">
                  <span className="admin-stat-value">{avgQualityScore}/100</span>
                  <span className="admin-stat-label">Avg Quality Score</span>
                </div>
              </div>

              <div className="admin-stat-card danger animate-fade-in-up delay-4">
                <div className="admin-stat-icon"><XOctagon size={24} /></div>
                <div className="admin-stat-info">
                  <span className="admin-stat-value">{rejectedToday}</span>
                  <span className="admin-stat-label">Rejected Today</span>
                </div>
              </div>
            </div>

            <div className="admin-content-grid animate-fade-in-up delay-5">
              
              {/* Top Duplicate Categories */}
              <div className="admin-panel">
                <h2 className="admin-panel-title"><Tag size={18} /> Top Duplicate Categories</h2>
                {topDupCategories.length === 0 ? (
                  <p className="admin-empty">No duplicates recorded yet.</p>
                ) : (
                  <ul className="admin-cat-list">
                    {topDupCategories.map((cat, idx) => (
                      <li key={cat} className="admin-cat-item">
                        <span className="admin-cat-rank">#{idx + 1}</span>
                        <span className="admin-cat-name">{cat}</span>
                        <span className="admin-cat-count">{dupCategories[cat]} duplicates</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent Moderation Activity */}
              <div className="admin-panel admin-activity-panel">
                <h2 className="admin-panel-title">Recent Moderation Activity</h2>
                <div className="admin-activity-list">
                  {allActivity.slice(0, 10).map(idea => {
                    if (idea.status === 'rejected') {
                      const isDup = idea.rejectionReasons?.some(r => r.toLowerCase().includes('similar to'));
                      return (
                        <div key={idea.id} className={`admin-activity-item ${isDup ? 'duplicate' : 'spam'}`}>
                          {isDup ? <FileWarning size={16} className="act-icon" /> : <ShieldAlert size={16} className="act-icon" />}
                          <div className="act-content">
                            <span className="act-text">Rejected idea: <strong>{idea.title || 'Unknown'}</strong></span>
                            <span className="act-reason">Reason: {idea.rejectionReasons?.[0] || idea.spamReason || 'Failed validation'}</span>
                          </div>
                        </div>
                      );
                    }
                    if (idea.qualityScore < 50 && idea.qualityScore > 0) {
                      return (
                        <div key={idea.id} className="admin-activity-item low-quality">
                          <Activity size={16} className="act-icon" />
                          <div className="act-content">
                            <span className="act-text">Low quality submission published: <strong>{idea.title}</strong></span>
                            <span className="act-reason">Score: {idea.qualityScore}/100</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                  {allActivity.filter(i => i.status === 'rejected' || (i.qualityScore < 50 && i.qualityScore > 0)).length === 0 && (
                    <p className="admin-empty">No significant moderation events recently.</p>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
