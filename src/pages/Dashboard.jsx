import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, ThumbsUp, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { dashboardStats as mockStats } from '../data/mockData';
import './Dashboard.css';

const trendIcon = (t) => {
  if (t === 'up') return <ArrowUp size={14} className="trend-up" />;
  if (t === 'down') return <ArrowDown size={14} className="trend-down" />;
  return <Minus size={14} className="trend-stable" />;
};

export default function Dashboard() {
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
          const q = query(
            collection(db, 'ideas'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          ideasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (indexErr) {
          console.warn("Composite index may be missing, falling back to simple query:", indexErr);
          const fallbackQ = query(
            collection(db, 'ideas'),
            where('userId', '==', currentUser.uid)
          );
          const querySnapshot = await getDocs(fallbackQ);
          ideasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  const totalVotes = userIdeas.reduce((acc, idea) => acc + Object.values(idea.votes || {}).reduce((sum, v) => sum + v, 0), 0);

  const statCards = [
    {
      label: 'Total Ideas', value: userIdeas.length,
      icon: <Lightbulb size={20} />, color: 'primary',
    },
    {
      label: 'Total Votes', value: totalVotes,
      icon: <ThumbsUp size={20} />, color: 'accent',
    },
    {
      label: 'Avg Score', value: avgScore,
      icon: <TrendingUp size={20} />, color: 'secondary',
    },
  ];

  return (
    <div className="dash-page" id="dashboard-page">
      <Navbar />
      <div className="dash-container">
        <div className="dash-header animate-fade-in-up">
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">Track your ideas' performance and community reception</p>
        </div>

        {/* Stat Cards */}
        <div className="dash-stats">
          {statCards.map((s, i) => (
            <div key={i} className={`dash-stat-card dash-stat-${s.color} animate-fade-in-up delay-${i + 1}`}>
              <div className="dash-stat-icon">{s.icon}</div>
              <div className="dash-stat-info">
                <span className="dash-stat-value">{loading ? '...' : s.value}</span>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts - Keeping Mock Data for Visuals until proper analytics are recorded */}
        <div className="dash-charts">
          <div className="dash-chart-card animate-fade-in-up delay-3">
            <h3 className="dash-chart-title">Score Trend</h3>
            <div className="dash-chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={mockStats.scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[50, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--glass-card)', border: '1px solid var(--glass-border)',
                      borderRadius: '12px', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone" dataKey="score" stroke="#1A9A8A"
                    strokeWidth={2.5} dot={{ fill: '#1A9A8A', r: 4 }}
                    activeDot={{ r: 6, fill: '#1A9A8A' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dash-chart-card animate-fade-in-up delay-4">
            <h3 className="dash-chart-title">Vote Distribution</h3>
            <div className="dash-chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mockStats.voteDistribution} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--glass-card)', border: '1px solid var(--glass-border)',
                      borderRadius: '12px', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {mockStats.voteDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Ideas List */}
        <div className="dash-ideas-card animate-fade-in-up delay-5">
          <h3 className="dash-chart-title">Your Ideas</h3>
          <div className="dash-ideas-table">
            <div className="dash-ideas-header">
              <span>Idea</span><span>Score</span><span>Votes</span><span>Trend</span>
            </div>
            {loading ? (
              <p style={{padding: '1rem'}}>Loading your ideas...</p>
            ) : userIdeas.length === 0 ? (
              <p style={{padding: '1rem', color: '#6b7280'}}>You have not submitted any ideas yet.</p>
            ) : (
              userIdeas.map((idea) => {
                const score = idea.score ?? idea.validationScore ?? 0;
                const totalIdeaVotes = Object.values(idea.votes || {}).reduce((sum, v) => sum + v, 0);
                return (
                  <div key={idea.id} className="dash-ideas-row">
                    <span className="dash-idea-name">{idea.title}</span>
                    <span className="dash-idea-score">{score}</span>
                    <span className="dash-idea-votes">{totalIdeaVotes}</span>
                    <span className="dash-idea-trend">{trendIcon('up')}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
