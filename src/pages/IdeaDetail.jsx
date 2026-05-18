import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ThumbsUp, DollarSign, HelpCircle, User, Calendar,
} from 'lucide-react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './IdeaDetail.css';
import CommunityFeedback from '../components/CommunityFeedback';

export default function IdeaDetail({ showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIdea = async () => {
      try {
        const docRef = doc(db, 'ideas', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setIdea({ id: docSnap.id, ...docSnap.data() });
        } else {
          showToast?.('Idea not found', 'error');
          navigate('/home');
        }
      } catch (e) {
        console.error("Error fetching idea:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchIdea();

  }, [id, navigate, showToast]);

  const handleVote = async (type) => {
    if (!currentUser) {
      showToast?.('Sign in to continue', 'error');
      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      const ideaRef = doc(db, 'ideas', id);
      await updateDoc(ideaRef, {
        [`votes.${type}`]: increment(1)
      });
      setIdea(prev => ({
        ...prev,
        votes: {
          ...prev.votes,
          [type]: (prev.votes?.[type] || 0) + 1
        }
      }));
      const labels = { useful: '👍 Useful', wouldPay: '💰 Would Pay', needsWork: '🤔 Needs Work' };
      showToast?.(`Voted: ${labels[type]}`, 'success');
    } catch (e) {
       console.error("Error voting:", e);
    }
  };

  const getScoreClass = (s) => s >= 75 ? 'detail-score-strong' : s >= 50 ? 'detail-score-moderate' : 'detail-score-weak';

  if (loading) return <div className="detail-page"><Navbar /><div className="detail-container"><p>Loading...</p></div></div>;
  if (!idea) return null;

  const score = idea.score ?? idea.validationScore ?? 0;

  return (
    <div className="detail-page" id="idea-detail-page">
      <Navbar showToast={showToast} />
      <div className="detail-container">
        {/* Header */}
        <div className="detail-header animate-fade-in-up">
          <div className="detail-header-top">
            <div className="detail-tags">
              {idea.tags?.map((t) => <span key={t} className="idea-tag">{t}</span>)}
            </div>
            <div className={`detail-score ${getScoreClass(score)}`}>
              <span className="detail-score-num">{score}</span>
              <span className="detail-score-label">Validation Score</span>
            </div>
          </div>
          <h1 className="detail-title">{idea.title}</h1>
          <div className="detail-meta">
            <div className="detail-author">
              <div className="detail-avatar"><User size={14} /></div>
              <span>{idea.author?.name || 'Anonymous'}</span>
            </div>
            <span className="detail-meta-sep">·</span>
            <span className="detail-date">
              <Calendar size={13} />
              {idea.createdAt ? new Date(idea.createdAt?.toDate ? idea.createdAt.toDate() : idea.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="detail-content animate-fade-in-up delay-1">
          <section className="detail-section">
            <h2 className="detail-section-title">Problem</h2>
            <p className="detail-section-text">{idea.problem}</p>
          </section>
          <section className="detail-section">
            <h2 className="detail-section-title">Solution</h2>
            <p className="detail-section-text">{idea.solution}</p>
          </section>
          <div className="detail-grid">
            <section className="detail-section detail-section-sm">
              <h2 className="detail-section-title">Target Users</h2>
              <p className="detail-section-text">{idea.targetUsers}</p>
            </section>
            <section className="detail-section detail-section-sm">
              <h2 className="detail-section-title">Monetization</h2>
              <p className="detail-section-text">{idea.monetization}</p>
            </section>
          </div>
        </div>

        {/* Vote Section */}
        <div className="detail-vote-section animate-fade-in-up delay-2">
          <h3 className="detail-vote-title">Cast your vote</h3>
          <div className="detail-vote-buttons">
            <button className="detail-vote-btn vote-useful-lg" onClick={() => handleVote('useful')}>
              <ThumbsUp size={20} />
              <span className="detail-vote-label">Useful</span>
              <span className="detail-vote-count">{idea.votes?.useful || 0}</span>
            </button>
            <button className="detail-vote-btn vote-pay-lg" onClick={() => handleVote('wouldPay')}>
              <DollarSign size={20} />
              <span className="detail-vote-label">Would Pay</span>
              <span className="detail-vote-count">{idea.votes?.wouldPay || 0}</span>
            </button>
            <button className="detail-vote-btn vote-improve-lg" onClick={() => handleVote('needsWork')}>
              <HelpCircle size={20} />
              <span className="detail-vote-label">Needs Work</span>
              <span className="detail-vote-count">{idea.votes?.needsWork || 0}</span>
            </button>
          </div>
        </div>

        {/* Comments */}
        <CommunityFeedback ideaId={id} />
      </div>
    </div>
  );
}