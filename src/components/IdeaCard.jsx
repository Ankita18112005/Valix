import { Link } from 'react-router-dom';
import { ThumbsUp, DollarSign, HelpCircle, MessageCircle, Clock, Users, Trash2, Bookmark } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import './IdeaCard.css';

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HighlightText = ({ text, highlight }) => {
  if (!highlight || !text) return text;

  const escaped = escapeRegExp(highlight);
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary)', padding: '0 2px', borderRadius: '2px', fontWeight: '600' }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const ScoreIndicator = ({ score }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div className="circular-score" title={`Score: ${score}`}>
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle
          cx="24" cy="24" r={radius}
          className="score-bg-circle"
          strokeWidth="4" fill="none"
        />
        <circle
          cx="24" cy="24" r={radius}
          className="score-progress-circle"
          strokeWidth="4" fill="none"
          stroke={getScoreColor(score)}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span className="circular-score-value">{score}</span>
    </div>
  );
};

export default function IdeaCard({ 
  idea, 
  onVote, 
  onBookmark,
  isBookmarked,
  forceScore, 
  highlightTerm 
}) {
  const { currentUser } = useAuth();

  const getScoreLabel = (score) => {
    if (score >= 75) return 'Strong Concept';
    if (score >= 35) return 'Moderate Potential';
    return 'Weak Concept';
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    let timeMs = dateStr;
    if (dateStr && typeof dateStr.toDate === 'function') {
      timeMs = dateStr.toDate().getTime();
    } else if (typeof dateStr === 'string' || typeof dateStr === 'number') {
      timeMs = new Date(dateStr).getTime();
    }
    const diff = Date.now() - timeMs;
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const totalVotes = idea.votes ? (idea.votes.useful + idea.votes.wouldPay + idea.votes.needsWork) : 0;
  const score = forceScore ?? idea.score ?? idea.validationScore ?? ((idea.votes?.useful || 0) * 2 + (idea.votes?.wouldPay || 0) * 3 - (idea.votes?.needsWork || 0));
  const commentCount = idea.commentCount ?? idea.commentsCount ?? 0;

  const isOwner = currentUser?.uid === idea.userId;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this idea?")) {
      try {
        await deleteDoc(doc(db, "ideas", idea.id));
      } catch (error) {
        console.error("Error deleting idea:", error);
        alert("Failed to delete idea.");
      }
    }
  };

  const hasVoted = currentUser && idea.votedUsers?.includes(currentUser.uid);

  return (
    <div className="idea-card animate-fade-in-up" id={`idea-card-${idea.id}`}>
      <div className="idea-card-header">
        <div className="idea-card-header-main">
          <Link to={`/idea/${idea.id}`} className="idea-card-title">
            <HighlightText text={idea.title} highlight={highlightTerm} />
          </Link>
          <div className="idea-card-meta-top">
            <span className="idea-meta-author">{idea.author?.name || 'Anonymous'}</span>
            <span className="idea-meta-divider">·</span>
            <span className="idea-meta-time">
              <Clock size={12} />
              {timeAgo(idea.createdAt)}
            </span>
          </div>
        </div>
        <div className="idea-score-container">
          <ScoreIndicator score={score} />
          <span className="idea-score-label">{getScoreLabel(score)}</span>
        </div>
      </div>

      <p className="idea-card-desc">
        <HighlightText text={idea.problem} highlight={highlightTerm} />
      </p>

      <div className="idea-card-tags">
        {idea.tags?.map((tag) => (
          <span key={tag} className="idea-tag"><HighlightText text={tag} highlight={highlightTerm} /></span>
        ))}
      </div>

      <div className="idea-card-footer">
        <div className="idea-card-actions-main">
          <button
            className={`idea-action-btn vote-useful ${hasVoted ? 'active' : ''}`}
            onClick={() => onVote?.(idea.id, 'useful')}
            title="Useful"
          >
            <ThumbsUp size={16} />
            <span>{idea.votes?.useful || 0}</span>
          </button>
          
          <button
            className={`idea-action-btn bookmark-btn ${isBookmarked ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onBookmark?.(idea.id);
            }}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Idea'}
          >
            <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="idea-card-actions-secondary">
          <div className="social-proof-badge" title={`${totalVotes} users have validated this idea`}>
            <Users size={14} />
            <span>{totalVotes} validating</span>
          </div>
          <Link to={`/idea/${idea.id}`} className="idea-action-btn neutral">
            <MessageCircle size={16} />
            <span>{commentCount}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
