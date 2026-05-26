import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { TrendingUp, Tag, Search, Filter, Hash } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Navbar from '../components/Navbar';
import IdeaCard from '../components/IdeaCard';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { motion, AnimatePresence } from 'framer-motion';
import './Home.css';

export default function Home({ showToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { searchTerm, isSearching } = useSearch();
  const [ideaList, setIdeaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    if (searchTerm) {
      const fetchSearchResults = async () => {
        try {
          const q = query(
            collection(db, 'ideas'),
            where('keywords', 'array-contains', searchTerm.toLowerCase())
          );
          const snapshot = await getDocs(q);
          const ideasData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Sort client-side to avoid needing a composite index
          ideasData.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || Date.parse(a.createdAt) || 0;
            const timeB = b.createdAt?.toMillis?.() || Date.parse(b.createdAt) || 0;
            return timeB - timeA;
          });
          setIdeaList(ideasData);
        } catch (error) {
          console.error("Error fetching search results:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchSearchResults();
    } else {
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
    }
  }, [searchTerm]);

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

  const filteredIdeas = processedIdeas; // Filtering is now done via Firestore

  const handleVote = async (id, type) => {
    if (!currentUser) {
      showToast?.('Sign in to continue', 'error');
      navigate('/login', { state: { from: location } });
      return;
    }

    // Optimistically update UI
    setIdeaList((prev) =>
      prev.map((idea) =>
        idea.id === id
          ? { ...idea, votes: { ...idea.votes, [type]: (idea.votes?.[type] || 0) + 1 } }
          : idea
      )
    );

    // Save vote to Firestore
    try {
      const ideaRef = doc(db, 'ideas', id);
      await updateDoc(ideaRef, {
        [`votes.${type}`]: increment(1)
      });
      // Not awaiting the score update to save writes/time, we compute on front end anyway
      const labels = { useful: '👍 Useful', wouldPay: '💰 Would Pay', needsWork: '🤔 Needs Work' };
      showToast?.(`Voted: ${labels[type]}`, 'success');
    } catch (error) {
      console.error("Error voting:", error);
      showToast?.('Failed to save vote', 'error');
    }
  };

  return (
    <div className="home-page" id="home-page">
      <Navbar showToast={showToast} />
      <div className="home-layout">
        <main className="home-feed" style={{ maxWidth: '800px', margin: '0 auto', gridColumn: '1 / -1' }}>
          <div className="home-feed-header animate-fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="home-feed-title">Idea Feed</h1>
            </div>
            <p className="home-feed-sub">Discover and validate startup ideas from the community</p>
          </div>

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
                 transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <IdeaCard idea={idea} onVote={handleVote} forceScore={idea.calculatedScore} highlightTerm={searchTerm} />
              </motion.div>
            )) : (
               <div className="empty-state">
                  <div className="empty-icon"><Search size={32} /></div>
                  <h3>No matching ideas found {searchTerm ? `for "${searchTerm}"` : ''} 🚀</h3>
                  <p>Try adjusting your search to find what you're looking for.</p>
               </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
