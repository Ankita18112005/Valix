import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Calendar, Lightbulb, TrendingUp, Award, ArrowRight,
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Profile.css';

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userIdeas, setUserIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
       navigate('/login');
       return;
    }

    const fetchUserIdeas = async () => {
      try {
        let ideasData = [];
        try {
          // Try the compound query first (requires a composite index)
          const q = query(
            collection(db, 'ideas'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          ideasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (indexErr) {
          // Fallback: query without orderBy if composite index is missing,
          // then sort client-side
          console.warn("Composite index may be missing, falling back to simple query:", indexErr);
          const fallbackQ = query(
            collection(db, 'ideas'),
            where('userId', '==', currentUser.uid)
          );
          const querySnapshot = await getDocs(fallbackQ);
          ideasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort by createdAt descending client-side
          ideasData.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return bTime - aTime;
          });
        }
        setUserIdeas(ideasData);
      } catch (err) {
        console.error("Error fetching user ideas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserIdeas();
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const totalScore = userIdeas.reduce((acc, curr) => acc + (curr.score ?? curr.validationScore ?? 0), 0);
  const avgScore = userIdeas.length > 0 ? Math.round(totalScore / userIdeas.length) : 0;
  const reputation = userIdeas.length * 10 + totalScore; // basic mockup of reputation calculation

  return (
    <div className="profile-page" id="profile-page">
      <Navbar />
      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card animate-fade-in-up">
          <div className="profile-avatar-lg">
            <User size={32} />
          </div>
          <h1 className="profile-name">{currentUser.displayName || 'User'}</h1>
          <p className="profile-bio">Entrepreneur & Builder</p>
          <div className="profile-joined">
            <Calendar size={14} />
            Email: {currentUser.email}
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats animate-fade-in-up delay-1">
          <div className="profile-stat-item">
            <Lightbulb size={18} className="profile-stat-icon" />
            <span className="profile-stat-value">{userIdeas.length}</span>
            <span className="profile-stat-label">Ideas</span>
          </div>
          <div className="profile-stat-sep" />
          <div className="profile-stat-item">
            <TrendingUp size={18} className="profile-stat-icon" />
            <span className="profile-stat-value">{avgScore}</span>
            <span className="profile-stat-label">Avg Score</span>
          </div>
          <div className="profile-stat-sep" />
          <div className="profile-stat-item">
            <Award size={18} className="profile-stat-icon" />
            <span className="profile-stat-value">{reputation.toLocaleString()}</span>
            <span className="profile-stat-label">Reputation</span>
          </div>
        </div>

        {/* User's Ideas */}
        <div className="profile-ideas animate-fade-in-up delay-2">
          <h2 className="profile-ideas-title">My Ideas</h2>
          {loading ? (
             <p style={{textAlign: 'center', margin: '2rem'}}>Loading...</p>
          ) : userIdeas.length > 0 ? (
            <div className="profile-ideas-list">
              {userIdeas.map((idea) => {
                const score = idea.score ?? idea.validationScore ?? 0;
                return (
                <Link to={`/idea/${idea.id}`} key={idea.id} className="profile-idea-card">
                  <div className="profile-idea-info">
                    <h3 className="profile-idea-title">{idea.title}</h3>
                    <p className="profile-idea-desc">{idea.problem}</p>
                    <div className="profile-idea-tags">
                      {idea.tags?.slice(0, 3).map((t) => (
                        <span key={t} className="idea-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="profile-idea-score-wrap">
                    <span className={`profile-idea-score ${
                      score >= 75 ? 'score-strong' : score >= 50 ? 'score-moderate' : 'score-weak'
                    }`}>
                      {score}
                    </span>
                    <ArrowRight size={16} className="profile-idea-arrow" />
                  </div>
                </Link>
              )})}
            </div>
          ) : (
            <div className="profile-empty">
              <Lightbulb size={40} className="profile-empty-icon" />
              <p className="profile-empty-text">No ideas yet</p>
              <p className="profile-empty-sub">Submit your first startup idea and get it validated!</p>
              <Link to="/create" className="profile-empty-btn">Post an Idea</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
