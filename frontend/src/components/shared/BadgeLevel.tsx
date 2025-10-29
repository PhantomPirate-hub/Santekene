'use client';

import React from 'react';

interface BadgeLevel {
  level: 'BRONZE' | 'ARGENT' | 'OR' | 'PLATINE' | 'VIP';
  name: string;
  minKNP: number;
  maxKNP: number | null;
  color: string;
  icon: string;
  benefits: string[];
}

interface BadgeLevelProps {
  badge: BadgeLevel;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const BadgeLevel: React.FC<BadgeLevelProps> = ({
  badge,
  size = 'md',
  showName = true,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-4xl',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center shadow-lg`}
        style={{
          background: `linear-gradient(135deg, ${badge.color}dd, ${badge.color})`,
        }}
        title={badge.name}
      >
        <span className="drop-shadow">{badge.icon}</span>
      </div>
      {showName && (
        <span className={`font-semibold ${textSizeClasses[size]}`} style={{ color: badge.color }}>
          {badge.name}
        </span>
      )}
    </div>
  );
};

interface BadgeProgressProps {
  current: BadgeLevel;
  next: BadgeLevel | null;
  progressPercentage: number;
  kpToNext: number;
}

export const BadgeProgress: React.FC<BadgeProgressProps> = ({
  current,
  next,
  progressPercentage,
  kpToNext,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <BadgeLevel badge={current} size="md" />
        {next && (
          <>
            <div className="flex-1 mx-3">
              <div className="relative">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercentage}%`,
                      backgroundColor: next.color,
                    }}
                  />
                </div>
              </div>
            </div>
            <BadgeLevel badge={next} size="md" showName={false} />
          </>
        )}
      </div>
      {next && (
        <p className="text-xs text-gray-600 text-center">
          Plus que <span className="font-bold text-vert-kene">{kpToNext} KNP</span> pour atteindre{' '}
          <span className="font-bold" style={{ color: next.color }}>
            {next.name}
          </span>
        </p>
      )}
      {!next && (
        <p className="text-xs text-purple-600 font-semibold text-center">
          🎉 Niveau maximum atteint !
        </p>
      )}
    </div>
  );
};

