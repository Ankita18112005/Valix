import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { TrendingUp, Tag, Search, Filter, Hash, Lightbulb, X } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Navbar from '../components/Navbar';
import IdeaCard from '../components/IdeaCard';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useSearchFilter } from '../hooks/useSearchFilter';
import { motion } from 'framer-motion';
import './Home.css';

export default function Home({ showToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { searchTerm, isSearching, clearSearch } = useSearch();
  const [ideaList, setIdeaList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single Firestore fetch with real-time listener (NO per-keypress queries)
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'ideas'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ideasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIdeaList(ideasData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const calculateInfo = (idea) => {
    const u = idea.votes?.useful || 0;
    const p = idea.votes?.wouldPay || 0;
    const n = idea.votes?.needsWork || 0;
    const score = (u * 2) + (p * 3) - (n * 1);
    const totalVotes = u + p + n;
    return { score, totalVotes };
  };

  const processedIdeas = useMemo(() => {
    return ideaList.map(idea => {
      const { score, totalVotes } = calculateInfo(idea);
      return { ...idea, calculatedScore: score, totalVotes };
    });
  }, [ideaList]);

  // Client-side filtering using the custom hook
  const filteredIdeas = useSearchFilter(processedIdeas, searchTerm);

  const handleVote = async (id, type) => {
    if (!currentUser) {
      showToast?.('Sign in to continue', 'error');
      navigate('/login', { state: { from: location } });
      return;
    }

    const ideaToVote = ideaList.find(i => i.id === id);
    if (!ideaToVote) return;
    
    const hasVoted = ideaToVote.votedUsers?.includes(currentUser.uid);

    // Optimistically update UI
    setIdeaList((prev) =>
      prev.map((idea) =>
        idea.id === id
          ? { 
              ...idea, 
              votedUsers: hasVoted 
                ? (idea.votedUsers || []).filter(uid => uid !== currentUser.uid)
                : [...(idea.votedUsers || []), currentUser.uid],
              votes: { 
                ...idea.votes, 
                [type]: hasVoted ? Math.max((idea.votes?.[type] || 0) - 1, 0) : (idea.votes?.[type] || 0) + 1 
              } 
            }
          : idea
      )
    );

    // Save vote to Firestore
    try {
      const ideaRef = doc(db, 'ideas', id);
      await setDoc(ideaRef, {
        votes: {
          [type]: hasVoted ? increment(-1) : increment(1)
        },
        votedUsers: hasVoted ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
      }, { merge: true });
    } catch (error) {
      console.error("Error voting:", error);
      showToast?.('Failed to save vote', 'error');
    }
  };

  return (
    <div className="home-page" id="home-page">
      <Navbar showToast={showToast} />
      <div className="home-layout">
        <main className="home-feed" style={{ maxWidth: '600px', margin: '0 auto', gridColumn: '1 / -1', padding: '0 var(--space-2)' }}>
          <div className="home-feed-header animate-fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="home-feed-title">Idea Feed</h1>
            </div>
            <p className="home-feed-sub">Discover and validate startup ideas from the community</p>
          </div>

          {/* Active Search Indicator */}
          {searchTerm && (
            <div className="search-active-bar animate-fade-in-up">
              <span>Showing results for "<strong>{searchTerm}</strong>" — {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''} found</span>
              <button className="search-clear-btn" onClick={clearSearch}>
                <X size={14} /> Clear
              </button>
            </div>
          )}

          <div className="home-feed-list">
            {(loading || isSearching) ? (
               Array.from({length: 3}).map((_, i) => (
                 <div key={i} className="idea-card skeleton-card" style={{padding: '1.5rem', background: 'var(--glass-card)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'var(--glass-blur)'}}>
                   <div className="skeleton skeleton-title"></div>
                   <div className="skeleton skeleton-text"></div>
                   <div className="skeleton skeleton-text" style={{width: '80%'}}></div>
                   <div style={{display: 'flex', gap: '10px', marginTop: '1rem'}}>
                      <div className="skeleton skeleton-avatar"></div>
                      <div className="skeleton skeleton-text" style={{width: '200px'}}></div>
                   </div>
                 </div>
               ))
            ) : filteredIdeas.length > 0 ? filteredIdeas.map((idea, i) => (
              <motion.div 
                 key={idea.id} 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <IdeaCard idea={idea} onVote={handleVote} forceScore={idea.calculatedScore} highlightTerm={searchTerm} />
              </motion.div>
            )) : (
               <div className="no-results-state animate-fade-in-up">
                  <div className="no-results-icon">
                    <Lightbulb size={40} />
                  </div>
                  <h3 className="no-results-title">No matching ideas</h3>
                  <p className="no-results-desc">
                    {searchTerm 
                      ? `We couldn't find any ideas matching "${searchTerm}". Try another keyword or category.`
                      : 'No ideas have been submitted yet. Be the first!'
                    }
                  </p>
                  {searchTerm && (
                    <button className="no-results-btn" onClick={clearSearch}>
                      <X size={16} /> Clear Search
                    </button>
                  )}
               </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
