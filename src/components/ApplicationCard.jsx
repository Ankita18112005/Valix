import { useState } from 'react';
import { User, Globe, ExternalLink, Check, X, Clock } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { createNotification } from '../services/notificationService';
import './ApplicationCard.css';

export default function ApplicationCard({ application, isFounder, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    if (!isFounder) return;
    
    setLoading(true);
    try {
      const appRef = doc(db, 'applications', application.id);
      
      if (action === 'accept') {
        // Update application status
        await updateDoc(appRef, {
          status: 'accepted',
          updatedAt: serverTimestamp()
        });
        
        await createNotification(
          application.applicantId,
          'Application Accepted!',
          `Your application to join "${application.ideaTitle || 'the project'}" as a ${application.preferredRole} has been accepted.`,
          'application_accepted',
          application.ideaId
        );
        
        // Mark role as filled in the idea document
        const ideaRef = doc(db, 'ideas', application.ideaId);
        // We'll let a backend function or more complex logic handle the exact array update if needed,
        // but for now, we can just trigger a UI update.
        // In a real app, we'd update the specific role in the array.
      } else if (action === 'reject') {
        await updateDoc(appRef, {
          status: 'rejected',
          updatedAt: serverTimestamp()
        });
      }
      
      toast.success(`Application ${action}ed`);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(`Error ${action}ing application:`, err);
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    pending: 'var(--warning)',
    accepted: 'var(--success)',
    rejected: 'var(--error)'
  };

  return (
    <div className={`app-card status-${application.status}`}>
      <div className="app-card-header">
        <div className="app-card-user">
          <div className="app-avatar"><User size={16} /></div>
          <div>
            <h4 className="app-name">{application.applicantName}</h4>
            <span className="app-role">{application.preferredRole}</span>
          </div>
        </div>
        <div className="app-status" style={{ color: statusColors[application.status] }}>
          {application.status === 'pending' && <Clock size={14} />}
          {application.status === 'accepted' && <Check size={14} />}
          {application.status === 'rejected' && <X size={14} />}
          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
        </div>
      </div>

      <p className="app-intro">"{application.introduction}"</p>

      <div className="app-links">
        {application.github && (
          <a href={application.github} target="_blank" rel="noreferrer" className="app-link">
            <Globe size={14} /> GitHub
          </a>
        )}
        {application.linkedin && (
          <a href={application.linkedin} target="_blank" rel="noreferrer" className="app-link">
            <Globe size={14} /> LinkedIn
          </a>
        )}
        {application.portfolioLink && (
          <a href={application.portfolioLink} target="_blank" rel="noreferrer" className="app-link">
            <ExternalLink size={14} /> Portfolio
          </a>
        )}
      </div>

      {isFounder && application.status === 'pending' && (
        <div className="app-actions">
          <button 
            className="app-btn reject" 
            onClick={() => handleAction('reject')}
            disabled={loading}
          >
            <X size={16} /> Reject
          </button>
          <button 
            className="app-btn accept" 
            onClick={() => handleAction('accept')}
            disabled={loading}
          >
            <Check size={16} /> Accept
          </button>
        </div>
      )}
    </div>
  );
}
