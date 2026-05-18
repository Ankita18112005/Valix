import { X, ThumbsUp, MessageCircle, TrendingUp } from 'lucide-react';
import { notifications } from '../data/mockData';
import './NotificationsPanel.css';

export default function NotificationsPanel({ isOpen, onClose }) {
  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'vote': return <ThumbsUp size={16} />;
      case 'comment': return <MessageCircle size={16} />;
      case 'trending': return <TrendingUp size={16} />;
      default: return <ThumbsUp size={16} />;
    }
  };

  const getIconClass = (type) => {
    switch (type) {
      case 'vote': return 'notif-icon-vote';
      case 'comment': return 'notif-icon-comment';
      case 'trending': return 'notif-icon-trending';
      default: return '';
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
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${!n.read ? 'notif-unread' : ''}`}
            >
              <div className={`notif-icon ${getIconClass(n.type)}`}>
                {getIcon(n.type)}
              </div>
              <div className="notif-content">
                <p className="notif-message">{n.message}</p>
                <p className="notif-idea">{n.ideaTitle}</p>
                <span className="notif-time">{n.time}</span>
              </div>
              {!n.read && <span className="notif-dot" />}
            </div>
          ))}
        </div>

        <div className="notif-footer">
          <button className="notif-mark-read">Mark all as read</button>
        </div>
      </div>
    </>
  );
}
