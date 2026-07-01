import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createNotification } from '../services/notificationService';
import { toast } from 'react-hot-toast';
import './ApplyModal.css';

export default function ApplyModal({ isOpen, onClose, idea, currentUser, userData }) {
  const [role, setRole] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [intro, setIntro] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser || !idea) return;

    // Check if user has already applied
    const checkExistingApplication = async () => {
      try {
        const q = query(
          collection(db, 'applications'),
          where('ideaId', '==', idea.id),
          where('applicantId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setHasApplied(true);
        }
      } catch (err) {
        console.error("Error checking applications:", err);
      }
    };

    checkExistingApplication();
  }, [isOpen, currentUser, idea]);

  if (!isOpen) return null;

  const availableRoles = idea.team?.roles?.filter(r => !r.filled).map(r => r.title) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      toast.error('Please select a preferred role');
      return;
    }
    if (!intro.trim()) {
      toast.error('Please provide a short introduction');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'applications'), {
        ideaId: idea.id,
        ideaTitle: idea.title,
        applicantId: currentUser.uid,
        applicantName: currentUser.displayName || 'Anonymous',
        applicantEmail: currentUser.email,
        founderId: idea.userId,
        preferredRole: role,
        portfolioLink: portfolio,
        github: github,
        linkedin: linkedin,
        introduction: intro,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Also create a notification for the founder
      await createNotification(
        idea.userId,
        'New Team Application',
        `${currentUser.displayName || 'Someone'} applied to join ${idea.title}`,
        'application_received',
        idea.id
      );

      toast.success('Application submitted successfully!');
      setHasApplied(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error("Error submitting application:", err);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content apply-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="apply-modal-header">
          <h2 className="apply-modal-title">Apply to Join Team</h2>
          <p className="apply-modal-sub">Tell the founder why you'd be a great fit for <strong>{idea.title}</strong>.</p>
        </div>

        {hasApplied ? (
          <div className="apply-success-state">
            <Send size={40} className="apply-success-icon" />
            <h3>Application Sent</h3>
            <p>You have already applied to join this team. The founder will review your application.</p>
            <button className="apply-btn secondary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form className="apply-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Preferred Role <span className="req">*</span></label>
              <select 
                className="form-input" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="" disabled>Select a role...</option>
                {availableRoles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">GitHub (Optional)</label>
                <input 
                  type="url" className="form-input" placeholder="https://github.com/..."
                  value={github} onChange={(e) => setGithub(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn (Optional)</label>
                <input 
                  type="url" className="form-input" placeholder="https://linkedin.com/in/..."
                  value={linkedin} onChange={(e) => setLinkedin(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Portfolio Website (Optional)</label>
              <input 
                type="url" className="form-input" placeholder="https://..."
                value={portfolio} onChange={(e) => setPortfolio(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Short Introduction <span className="req">*</span></label>
              <textarea 
                className="form-textarea" 
                rows="4"
                placeholder="Why do you want to join this startup? What experience do you bring?"
                value={intro} onChange={(e) => setIntro(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="apply-actions">
              <button type="button" className="apply-btn secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="apply-btn primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
