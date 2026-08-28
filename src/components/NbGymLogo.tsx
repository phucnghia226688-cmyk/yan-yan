import React from 'react';

interface NbGymLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showSubtitle?: boolean;
}

export const NbGymLogo: React.FC<NbGymLogoProps> = ({ 
  className = '', 
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
    full: 'w-full h-auto'
  };

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 500 500"
        className="h-full w-full object-contain"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="shieldShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#059669" floodOpacity="0.3" />
          </filter>
        </defs>
        <g filter="url(#shieldShadow)">
          {/* Main Shield Body */}
          <path
            d="M 250 40 L 430 90 V 240 C 430 360 350 440 250 480 C 150 440 70 360 70 240 V 90 Z"
            fill="url(#shieldGrad)"
            stroke="#047857"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          {/* Security Checkmark */}
          <path
            d="M 170 260 L 230 320 L 340 190"
            fill="none"
            stroke="#ffffff"
            strokeWidth="35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
};

