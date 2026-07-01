import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Zap, Award, Flame, Lightbulb, MapPin, Globe } from 'lucide-react';
import { computeRoles, getLevelFromXP, getAchievements } from '../services/roleService';
import { RoleBadgeList } from '../components/RoleBadge';
import XPProgressBar from '../components/XPProgressBar';
import Navbar from '../components/Navbar';
import './PublicProfile.css';

export default function PublicProfile() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [userIdeas, setUserIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setProfileData({ id: userSnap.id, ...userSnap.data() });
        } else {
          setProfileData(null);
        }

        const ideasQ = query(collection(db, 'ideas'), where('userId', '==', id));
        const ideasSnap = await getDocs(ideasQ);
        setUserIdeas(ideasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
      } catch (err) {
        console.error("Error fetching public profile:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <div className="pub-profile-page">
        <Navbar />
        <div className="pub-profile-container"><p>Loading profile...</p></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="pub-profile-page">
        <Navbar />
        <div className="pub-profile-container">
          <div className="pub-not-found">
            <User size={48} />
            <h2>User not found</h2>
            <p>This profile may have been deleted or doesn't exist.</p>
            <Link to="/home" className="pub-btn primary">Go to Explore</Link>
          </div>
        </div>
      </div>
    );
  }

  const xp = profileData.xp || 0;
  const roles = profileData.roles || computeRoles(profileData);
  const achievements = getAchievements(profileData).filter(a => a.earned);

  return (
    <div className="pub-profile-page">
      <Navbar />
      <div className="pub-profile-container">
        {/* Header */}
        <div className="pub-header animate-fade-in-up">
          <div className="pub-avatar-lg">
            {profileData.displayName ? profileData.displayName[0].toUpperCase() : 'U'}
          </div>
          <div className="pub-info">
            <h1 className="pub-name">{profileData.displayName || 'Entrepreneur'}</h1>
            {profileData.bio && <p className="pub-bio">{profileData.bio}</p>}
            
            <div className="pub-meta">
              {profileData.location && (
                <span className="pub-meta-item"><MapPin size={14} /> {profileData.location}</span>
              )}
              {profileData.website && (
                <a href={profileData.website} target="_blank" rel="noreferrer" className="pub-meta-item link">
                  <Globe size={14} /> Website
                </a>
              )}
            </div>

            <div style={{ marginTop: '16px' }}>
              <RoleBadgeList roles={roles} size="md" />
            </div>
          </div>

          <div className="pub-stats">
            <div className="pub-stat">
              <Zap size={18} className="text-primary" />
              <div className="pub-stat-val">{xp} XP</div>
            </div>
            <div className="pub-stat">
              <Award size={18} className="text-success" />
              <div className="pub-stat-val">Trust {profileData.trustScore || 50}</div>
            </div>
            <div className="pub-stat">
              <Flame size={18} className="text-warning" />
              <div className="pub-stat-val">{profileData.streak || 0}d</div>
            </div>
          </div>
        </div>

        <div className="pub-grid">
          {/* Main Column */}
          <div className="pub-main">
            <div className="pub-section animate-fade-in-up delay-1">
              <h2>Ideas by {profileData.displayName?.split(' ')[0] || 'User'}</h2>
              {userIdeas.length === 0 ? (
                <p className="pub-empty">No ideas published yet.</p>
              ) : (
                <div className="pub-ideas">
                  {userIdeas.map(idea => (
                    <Link to={`/idea/${idea.id}`} key={idea.id} className="pub-idea-card">
                      <div className="pub-idea-icon"><Lightbulb size={20} /></div>
                      <div className="pub-idea-content">
                        <h4>{idea.title}</h4>
                        <p>{idea.problem?.substring(0, 80)}...</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="pub-sidebar animate-fade-in-up delay-2">
            <div className="pub-section">
              <h2>Level Progress</h2>
              <XPProgressBar xp={xp} />
            </div>

            <div className="pub-section">
              <h2>Achievements</h2>
              {achievements.length === 0 ? (
                <p className="pub-empty">No achievements earned yet.</p>
              ) : (
                <div className="pub-achievements">
                  {achievements.map(a => (
                    <div key={a.id} className="pub-achieve-item" title={a.description}>
                      <span className="pub-achieve-icon">{a.icon}</span>
                      <span className="pub-achieve-name">{a.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
