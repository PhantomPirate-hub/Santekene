/**
 * Service pour calculer le niveau de badge selon les KenePoints
 * Modèle "Gain uniquement" - Gamification
 */

export interface BadgeLevel {
  level: 'BRONZE' | 'ARGENT' | 'OR' | 'PLATINE' | 'VIP';
  name: string;
  minKNP: number;
  maxKNP: number | null;
  color: string;
  icon: string;
  benefits: string[];
}

export const BADGE_LEVELS: BadgeLevel[] = [
  {
    level: 'BRONZE',
    name: 'Bronze',
    minKNP: 0,
    maxKNP: 999,
    color: '#CD7F32',
    icon: '🥉',
    benefits: ['Membre standard', 'Accès communauté'],
  },
  {
    level: 'ARGENT',
    name: 'Argent',
    minKNP: 1000,
    maxKNP: 4999,
    color: '#C0C0C0',
    icon: '🥈',
    benefits: ['Badge profil', 'Accès early features'],
  },
  {
    level: 'OR',
    name: 'Or',
    minKNP: 5000,
    maxKNP: 9999,
    color: '#FFD700',
    icon: '🥇',
    benefits: ['Support prioritaire', 'Badge profil doré'],
  },
  {
    level: 'PLATINE',
    name: 'Platine',
    minKNP: 10000,
    maxKNP: 24999,
    color: '#E5E4E2',
    icon: '💎',
    benefits: ['Support VIP', 'Accès bêta fonctionnalités'],
  },
  {
    level: 'VIP',
    name: 'VIP',
    minKNP: 25000,
    maxKNP: null,
    color: '#9B59B6',
    icon: '👑',
    benefits: ['Support dédié', 'Avantages exclusifs', 'Badge VIP'],
  },
];

/**
 * Calcule le niveau de badge en fonction des KenePoints
 */
export function getBadgeLevel(kenePoints: number): BadgeLevel {
  // Parcourir les niveaux du plus élevé au plus bas
  for (let i = BADGE_LEVELS.length - 1; i >= 0; i--) {
    const level = BADGE_LEVELS[i];
    if (level && kenePoints >= level.minKNP) {
      return level;
    }
  }
  
  // Par défaut, retourner Bronze
  return BADGE_LEVELS[0] as BadgeLevel;
}

/**
 * Calcule la progression vers le prochain niveau
 */
export function getBadgeProgress(kenePoints: number): {
  current: BadgeLevel;
  next: BadgeLevel | null;
  progressPercentage: number;
  kpToNext: number;
} {
  const current = getBadgeLevel(kenePoints);
  const currentIndex = BADGE_LEVELS.findIndex(l => l.level === current.level);
  const next = currentIndex < BADGE_LEVELS.length - 1 ? BADGE_LEVELS[currentIndex + 1] : null;

  if (!next) {
    // Déjà au niveau max (VIP)
    return {
      current,
      next: null,
      progressPercentage: 100,
      kpToNext: 0,
    };
  }

  const kpInCurrentLevel = kenePoints - current.minKNP;
  const kpNeededForNextLevel = next.minKNP - current.minKNP;
  const progressPercentage = Math.min(100, (kpInCurrentLevel / kpNeededForNextLevel) * 100);
  const kpToNext = next.minKNP - kenePoints;

  return {
    current,
    next,
    progressPercentage: Math.round(progressPercentage),
    kpToNext: Math.max(0, kpToNext),
  };
}

/**
 * Singleton export
 */
export const badgeLevelService = {
  getBadgeLevel,
  getBadgeProgress,
  BADGE_LEVELS,
};

