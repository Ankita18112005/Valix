import { getLevelFromXP } from '../services/roleService';
import './XPProgressBar.css';

/**
 * XPProgressBar — Shows current XP, level, and progress to next level.
 * @param {{ xp: number, compact?: boolean }} props
 */
export default function XPProgressBar({ xp = 0, compact = false }) {
  const level = getLevelFromXP(xp);

  return (
    <div className={`xp-progress ${compact ? 'xp-progress-compact' : ''}`}>
      <div className="xp-progress-header">
        <div className="xp-progress-level">
          <span className="xp-level-badge">Lv.{level.level}</span>
          <span className="xp-level-name">{level.name}</span>
        </div>
        <span className="xp-progress-text">
          {level.isMaxLevel
            ? `${level.currentXP.toLocaleString()} XP (Max)`
            : `${level.currentXP.toLocaleString()} / ${level.nextLevelXP.toLocaleString()} XP`
          }
        </span>
      </div>
      <div className="xp-bar-track">
        <div
          className="xp-bar-fill"
          style={{ width: `${level.progress}%` }}
        />
      </div>
    </div>
  );
}
