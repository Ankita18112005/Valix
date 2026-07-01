import { useState, useEffect } from 'react';
import { X, ThumbsUp, MessageCircle, TrendingUp, Users, Check, Bell } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';
import './NotificationsPanel.css';

export default function NotificationsPanel({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Notifications error:", error);
      const fallbackQ = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid)
      );
      onSnapshot(fallbackQ, (fbSnap) => {
        const data = fbSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setNotifications(data.slice(0, 20));
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'vote': return <ThumbsUp size={16} />;
      case 'comment': return <MessageCircle size={16} />;
      case 'trending': return <TrendingUp size={16} />;
      case 'application_received': return <Users size={16} />;
      case 'application_accepted': return <Check size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getIconClass = (type) => {
    switch (type) {
      case 'vote': return 'notif-icon-vote';
      case 'comment': return 'notif-icon-comment';
      case 'trending': return 'notif-icon-trending';
      case 'application_received': return 'notif-icon-app';
      case 'application_accepted': return 'notif-icon-success';
      default: return '';
    }
  };

  const handleMarkAllRead = () => {
    if (currentUser) {
      markAllNotificationsAsRead(currentUser.uid);
    }
  };

  return (
    <>
      <div className="notif-overlay" onClick={onClose} />
      <div className="notif-panel" id="notifications-panel">
        <div className="notif-header">
          <h3 className="notif-title">Notifications</h3>
          <button className="notif-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${!n.read ? 'notif-unread' : ''}`}
                onClick={() => { if (!n.read) markNotificationAsRead(n.id); }}
                style={{ cursor: n.read ? 'default' : 'pointer' }}
              >
                <div className={`notif-icon ${getIconClass(n.type)}`}>
                  {getIcon(n.type)}
                </div>
                <div className="notif-content">
                  <p className="notif-message">{n.message}</p>
                  {n.title && <p className="notif-idea" style={{fontWeight: 600}}>{n.title}</p>}
                  <span className="notif-time">
                    {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                {!n.read && <span className="notif-dot" />}
              </div>
            ))
          )}
        </div>

        {notifications.some(n => !n.read) && (
          <div className="notif-footer">
            <button className="notif-mark-read" onClick={handleMarkAllRead}>
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </>
  );
}
