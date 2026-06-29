import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Calendar, Lightbulb, TrendingUp, Award, ArrowRight, Edit3, X, Check
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { toast, Toaster } from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { currentUser, updateUserProfileData } = useAuth();
  const navigate = useNavigate();
  
  const [userIdeas, setUserIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('Entrepreneur & Builder');
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
       navigate('/login');
       return;
    }

    setEditName(currentUser.displayName || '');

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().bio) {
          setBio(userDoc.data().bio);
          setEditBio(userDoc.data().bio);
        } else {
          setEditBio('Entrepreneur & Builder');
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    const fetchUserIdeas = async () => {
      try {
        let ideasData = [];
        try {
          const q = query(
            collection(db, 'ideas'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          ideasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (indexErr) {
          const fallbackQ = query(collection(db, 'ideas'), where('userId', '==', currentUser.uid));
          const querySnapshot = await getDocs(fallbackQ);
          ideasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          ideasData.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
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

    fetchUserData();
    fetchUserIdeas();
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
       toast.error("Name cannot be empty");
       return;
    }
    
    setIsSaving(true);
    try {
      await updateUserProfileData(editName, editBio);
      setBio(editBio);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalScore = userIdeas.reduce((acc, curr) => acc + (curr.score ?? curr.validationScore ?? 0), 0);
  const avgScore = userIdeas.length > 0 ? Math.round(totalScore / userIdeas.length) : 0;
  const reputation = userIdeas.length * 10 + totalScore; 

  return (
    <div className="profile-page" id="profile-page">
      <Navbar />
      <Toaster position="bottom-center" />
      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card animate-fade-in-up">
          <div className="profile-avatar-lg">
            <User size={32} />
          </div>
          
          {isEditing ? (
            <div className="profile-edit-form">
              <input 
                type="text" 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                className="profile-edit-input"
                placeholder="Your Name"
              />
              <textarea 
                value={editBio} 
                onChange={e => setEditBio(e.target.value)} 
                className="profile-edit-textarea"
                placeholder="Tell us about yourself..."
                rows={3}
              />
              <div className="profile-edit-actions">
                <button 
                  className="profile-edit-btn profile-btn-cancel" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(currentUser.displayName || '');
                    setEditBio(bio);
                  }}
                  disabled={isSaving}
                >
                  <X size={16} /> Cancel
                </button>
                <button 
                  className="profile-edit-btn profile-btn-save" 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  <Check size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button className="profile-edit-toggle" onClick={() => setIsEditing(true)} title="Edit Profile">
                <Edit3 size={16} />
              </button>
              <h1 className="profile-name">{currentUser.displayName || 'User'}</h1>
              <p className="profile-bio">{bio}</p>
              <div className="profile-joined">
                <Calendar size={14} />
                Email: {currentUser.email}
              </div>
            </>
          )}
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
