import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose }) {
  const icons = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
    warning: <AlertTriangle size={18} />,
  };

  return (
    <div className={`toast toast-${type}`} id="toast-notification">
      <div className="toast-icon">{icons[type]}</div>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}
