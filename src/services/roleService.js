/**
 * roleService.js
 * Computes roles dynamically based on user stats.
 */

export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Novice', minXP: 0 },
  { level: 2, name: 'Apprentice', minXP: 100 },
  { level: 3, name: 'Contributor', minXP: 300 },
  { level: 4, name: 'Innovator', minXP: 600 },
  { level: 5, name: 'Visionary', minXP: 1000 },
  { level: 6, name: 'Master', minXP: 1500 },
  { level: 7, name: 'Legend', minXP: 2500 }
];

export const getLevelFromXP = (xp) => {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];
  
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].minXP) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || null;
    } else {
      break;
    }
  }

  const progress = nextLevel 
    ? ((xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100 
    : 100;

  return {
    ...currentLevel,
    currentXP: xp,
    nextLevelXP: nextLevel ? nextLevel.minXP : currentLevel.minXP,
    progress: Math.min(100, Math.max(0, progress)),
    isMaxLevel: !nextLevel
  };
};

export const computeRoles = (userData) => {
  if (!userData) return ['Explorer'];
  
  const roles = ['Explorer'];
  
  if (userData.ideasCreated > 0) roles.push('Founder');
  if (userData.ideasValidated > 0) roles.push('Validator');
  if (userData.projectsJoined > 0) roles.push('Collaborator');
  
  return roles;
};

export const ROLE_COLORS = {
  Explorer: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9CA3AF', border: 'rgba(107, 114, 128, 0.3)' },
  Founder: { bg: 'rgba(255, 122, 0, 0.15)', text: 'var(--primary)', border: 'rgba(255, 122, 0, 0.3)' },
  Validator: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  Collaborator: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' }
};

export const getAchievements = (userData) => {
  const xp = userData?.xp || 0;
  return [
    { id: 'first_idea', name: 'First Pitch', description: 'Submit your first idea', icon: '💡', earned: (userData?.ideasCreated || 0) > 0 },
    { id: 'validator', name: 'Validator', description: 'Give feedback on 5 ideas', icon: '🎯', earned: (userData?.ideasValidated || 0) >= 5 },
    { id: 'team_player', name: 'Team Player', description: 'Join a project', icon: '🤝', earned: (userData?.projectsJoined || 0) > 0 },
    { id: 'hot_streak', name: 'On Fire', description: '7 day streak', icon: '🔥', earned: (userData?.streak || 0) >= 7 },
    { id: 'level_5', name: 'Visionary', description: 'Reach Level 5', icon: '⭐', earned: xp >= 1000 },
  ];
};
