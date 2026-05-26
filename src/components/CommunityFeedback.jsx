import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

import {
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";

import { Toaster, toast } from "react-hot-toast";
import { Star, Send, User, MessageSquareDashed } from "lucide-react";

const CommunityFeedback = ({ ideaId }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [feedback, setFeedback] = useState("");
  const [clarity, setClarity] = useState(0);
  const [market, setMarket] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ideaId) return;
    const q = query(
      collection(db, `ideas/${ideaId}/comments`),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFeedbacks(data);
    });

    return () => unsubscribe();
  }, [ideaId]);

  const handleSubmitFeedback = async () => {
    if (!currentUser) {
      toast.error("Please sign in to share feedback");
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!feedback.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, `ideas/${ideaId}/comments`), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        feedback: feedback,
        text: feedback,
        clarity,
        market,
        difficulty,
        ratings: {
          problemClarity: clarity,
          marketDemand: market,
          executionDifficulty: difficulty
        },
        problemClarity: clarity,
        marketDemand: market,
        executionDifficulty: difficulty,
        createdAt: serverTimestamp(),
      });

      try {
        await updateDoc(doc(db, 'ideas', ideaId), {
           commentCount: increment(1)
        });
      } catch (updateErr) {
        console.error("Failed to update comment count:", updateErr);
      }

      toast.success("Feedback submitted successfully!");

      setFeedback("");
      setClarity(0);
      setMarket(0);
      setDifficulty(0);

    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message ? `Error: ${error.message}` : "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  const RatingStars = ({ value, setValue }) => {
    return (
      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={20}
            onClick={() => setValue(star)}
            style={{
              cursor: 'pointer',
              transition: 'color 0.15s, fill 0.15s, transform 0.15s',
              fill: star <= value ? '#FBBF24' : 'none',
              color: star <= value ? '#FBBF24' : '#D1D5DB',
              transform: star <= value ? 'scale(1.1)' : 'scale(1)',
            }}
            onMouseEnter={(e) => { if (star > value) e.currentTarget.style.color = '#FCD34D'; }}
            onMouseLeave={(e) => { if (star > value) e.currentTarget.style.color = '#D1D5DB'; }}
          />
        ))}
      </div>
    );
  };

  return (
      <div
        id="comments-section"
        style={{
          maxWidth: '56rem',
          margin: '2rem auto 0',
          background: 'var(--glass-card)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
        }}
      >
      {/* ── Feedback Form Section ── */}
      <div style={{ padding: '28px 32px 24px' }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <MessageSquareDashed size={22} style={{ color: 'var(--primary)' }} />
          Community Feedback
          <span style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginLeft: '4px',
          }}>
            ({feedbacks.length})
          </span>
        </h2>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What's your take on this idea?"
          rows={4}
          style={{
            width: '100%',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '0.9375rem',
            lineHeight: '1.6',
            color: 'var(--text-primary)',
            resize: 'vertical',
            outline: 'none',
            transition: 'all 0.2s',
            background: 'var(--surface)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.boxShadow = '0 0 0 3px var(--primary-50)';
            e.target.style.background = 'var(--surface-hover)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.boxShadow = 'none';
            e.target.style.background = 'var(--surface)';
          }}
        />

        {/* Rating Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginTop: '16px',
        }}>
          {[
            { label: 'Problem Clarity', value: clarity, setter: setClarity, emoji: '🎯' },
            { label: 'Market Demand', value: market, setter: setMarket, emoji: '📈' },
            { label: 'Execution Difficulty', value: difficulty, setter: setDifficulty, emoji: '⚙️' },
          ].map(({ label, value: val, setter, emoji }) => (
            <div key={label} style={{
              background: 'var(--surface)',
              borderRadius: '10px',
              padding: '14px 16px',
              border: '1px solid var(--border-light)',
              transition: 'border-color 0.2s',
            }}>
              <div style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>{emoji}</span> {label}
              </div>
              <RatingStars value={val} setValue={setter} />
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={handleSubmitFeedback}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: loading ? 'var(--text-tertiary)' : 'var(--gradient-primary)',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
              transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.35)'; }}}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(79,70,229,0.25)'; }}
          >
            <Send size={16} />
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </div>

      {/* ── Responses Section ── */}
      <div style={{
        borderTop: '1px solid var(--border-light)',
        background: 'var(--bg)',
        padding: '24px 32px 28px',
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '16px',
          letterSpacing: '-0.01em',
        }}>
          Community Responses
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {feedbacks.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'var(--glass-card)',
                backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '18px 20px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Author row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}>
                  <User size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    textTransform: 'capitalize',
                  }}>
                    {item.userName || 'Anonymous'}
                  </p>
                  <p style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-tertiary)',
                    lineHeight: 1.3,
                  }}>
                    {item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                      : "Just now"}
                  </p>
                </div>
              </div>

              {/* Feedback text */}
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                marginBottom: '12px',
              }}>
                {item.feedback || item.text}
              </p>

              {/* Rating badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { label: 'Problem', val: item.clarity || item.ratings?.problemClarity || item.problemClarity || 0 },
                  { label: 'Demand', val: item.market || item.ratings?.marketDemand || item.marketDemand || 0 },
                  { label: 'Difficulty', val: item.difficulty || item.ratings?.executionDifficulty || item.executionDifficulty || 0 },
                ].map(({ label, val }) => (
                  <div key={label} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '5px 10px',
                  }}>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}>{label}</span>
                    <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>
                      {val > 0 ? "⭐".repeat(val) : <span style={{ color: '#D1D5DB', fontSize: '0.6875rem' }}>—</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {feedbacks.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
            }}>
              <MessageSquareDashed size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>
                No responses yet
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                Be the first to share your thoughts with the community!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityFeedback;
