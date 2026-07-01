import { ROLE_COLORS } from '../services/roleService';
import './RoleBadge.css';

/**
 * RoleBadge Component
 * @param {{ role: string, size?: 'sm' | 'md' }} props
 */
export default function RoleBadge({ role, size = 'md' }) {
  const colors = ROLE_COLORS[role] || ROLE_COLORS['Explorer'];
  
  const icons = {
    Founder: '🚀',
    Validator: '🎯',
    Collaborator: '🤝',
    Explorer: '🔭'
  };

  return (
    <span 
      className={`role-badge role-badge-${size}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border
      }}
      title={`Role: ${role}`}
    >
      <span className="role-badge-icon">{icons[role] || '✨'}</span>
      <span className="role-badge-label">{role}</span>
    </span>
  );
}

/**
 * RoleBadgeList Component - Renders a list of badges
 * @param {{ roles: string[], size?: 'sm' | 'md' }} props
 */
export function RoleBadgeList({ roles = [], size = 'md' }) {
  if (!roles || roles.length === 0) return null;
  
  return (
    <div className="role-badge-list">
      {roles.map(r => (
        <RoleBadge key={r} role={r} size={size} />
      ))}
    </div>
  );
}
