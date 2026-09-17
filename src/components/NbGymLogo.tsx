import React from 'react';

interface NbGymLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showSubtitle?: boolean;
  glow?: boolean;
}

export const NbGymLogo: React.FC<NbGymLogoProps> = ({ 
  className = '', 
  size = 'md',
  glow = true
}) => {
  const sizeClasses = {
    xs: 'h-7 w-7',
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
    '2xl': 'h-32 w-32',
    full: 'w-full h-auto'
  };

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 500 500"
        className="h-full w-full object-contain filter"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Titanium Obsidian Background Gradient */}
          <linearGradient id="nbTitaniumBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B0F19" />
            <stop offset="50%" stopColor="#151D2A" />
            <stop offset="100%" stopColor="#0A0D14" />
          </linearGradient>

          {/* Titanium Surface Metallic Sheen */}
          <linearGradient id="nbMetallicSheen" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>

          {/* Dual Glow Outer Rim Gradient */}
          <linearGradient id="nbBorderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF1E00" />
            <stop offset="35%" stopColor="#FF5500" />
            <stop offset="70%" stopColor="#FFAA00" />
            <stop offset="100%" stopColor="#FFD000" />
          </linearGradient>

          {/* Fiery Crimson - Orange Gradient for Letter N */}
          <linearGradient id="nbCrimsonOrangeN" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D90429" />
            <stop offset="25%" stopColor="#EF233C" />
            <stop offset="65%" stopColor="#FF4500" />
            <stop offset="100%" stopColor="#FF6200" />
          </linearGradient>

          {/* Letter N Diagonal Gradient */}
          <linearGradient id="nbDiagonalNGrad" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#EF233C" />
            <stop offset="40%" stopColor="#FF3D00" />
            <stop offset="85%" stopColor="#FF6A00" />
            <stop offset="100%" stopColor="#FF8500" />
          </linearGradient>

          {/* Shared Spine Gradient */}
          <linearGradient id="nbSpineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF5100" />
            <stop offset="50%" stopColor="#FF7700" />
            <stop offset="100%" stopColor="#FFA000" />
          </linearGradient>

          {/* Vibrant Amber - Gold Gradient for Letter B */}
          <linearGradient id="nbAmberGoldB" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6200" />
            <stop offset="30%" stopColor="#FF9500" />
            <stop offset="70%" stopColor="#FFB703" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>

          {/* Gold Bevel Highlights */}
          <linearGradient id="nbGoldBevel" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF275" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFAA00" stopOpacity="0.4" />
          </linearGradient>

          {/* Ambient Monogram Shadow */}
          <filter id="nb3DDepth" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.75" />
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FF4500" floodOpacity="0.25" />
          </filter>

          {/* Outer Squircle Glow */}
          <filter id="nbSquircleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.5" />
            {glow && (
              <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#FF5500" floodOpacity="0.35" />
            )}
          </filter>
        </defs>

        {/* 1. Squircle Titanium Badge Base */}
        <g filter="url(#nbSquircleGlow)">
          {/* Main Titanium Squircle Shape */}
          <rect
            x="36"
            y="36"
            width="428"
            height="428"
            rx="108"
            ry="108"
            fill="url(#nbTitaniumBg)"
            stroke="url(#nbBorderGlow)"
            strokeWidth="7"
          />

          {/* Metallic Sheen Overlay */}
          <rect
            x="36"
            y="36"
            width="428"
            height="428"
            rx="108"
            ry="108"
            fill="url(#nbMetallicSheen)"
          />

          {/* Inner Precision Bevel Accent Ring */}
          <rect
            x="48"
            y="48"
            width="404"
            height="404"
            rx="96"
            ry="96"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.12"
          />

          {/* Subtle Radial Center Ambient Warmth */}
          <circle
            cx="250"
            cy="250"
            r="160"
            fill="#FF4500"
            opacity="0.06"
          />
        </g>

        {/* 2. Athletic Monogram "NB" with 3D Depth */}
        <g filter="url(#nb3DDepth)">
          
          {/* --- LETTER N: Left Athletic Pillar with Speed Cuts --- */}
          <g>
            {/* Main Pillar Body */}
            <path
              d="M 112 165 L 166 128 L 166 345 L 112 378 Z"
              fill="url(#nbCrimsonOrangeN)"
            />
            {/* Top Bevel Highlight */}
            <line
              x1="112"
              y1="165"
              x2="166"
              y2="128"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.65"
            />
            {/* Speed Notch / Wing Slice (Athletic styling) */}
            <path
              d="M 96 235 L 122 217 L 122 245 L 96 263 Z"
              fill="url(#nbCrimsonOrangeN)"
              opacity="0.9"
            />
            <path
              d="M 96 280 L 122 262 L 122 290 L 96 308 Z"
              fill="url(#nbCrimsonOrangeN)"
              opacity="0.75"
            />
          </g>

          {/* --- LETTER N: Diagonal Dynamic Slash --- */}
          <g>
            {/* Diagonal Slash Path */}
            <path
              d="M 176 128 L 232 128 L 282 345 L 226 378 Z"
              fill="url(#nbDiagonalNGrad)"
            />
            {/* Top Bevel Specular Light */}
            <line
              x1="176"
              y1="128"
              x2="232"
              y2="128"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.65"
            />
            {/* Bottom-right Chamfer Bevel Highlight */}
            <line
              x1="282"
              y1="345"
              x2="226"
              y2="378"
              stroke="#FF8500"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
          </g>

          {/* --- 3D Depth Shadow between N and Spine --- */}
          <path
            d="M 272 135 L 282 135 L 282 365 L 272 372 Z"
            fill="#000000"
            opacity="0.45"
          />

          {/* --- CENTRAL SPINE (Shared between N & B) --- */}
          <g>
            <path
              d="M 272 128 L 314 128 L 314 376 L 272 376 Z"
              fill="url(#nbSpineGrad)"
            />
            {/* Top Edge Bevel */}
            <line
              x1="272"
              y1="128"
              x2="314"
              y2="128"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.6"
            />
          </g>

          {/* --- LETTER B: Dual Aerodynamic Loops --- */}
          <g>
            {/* Upper Loop of B with Chamfered Sport Corner */}
            <path
              d="M 314 128 L 358 128 L 392 162 L 392 196 C 392 228 376 244 350 244 L 314 244 Z M 314 166 L 346 166 C 362 166 368 174 368 186 C 368 198 362 206 346 206 L 314 206 Z"
              fill="url(#nbAmberGoldB)"
              fillRule="evenodd"
            />
            {/* Upper Loop Top Bevel Specular Line */}
            <line
              x1="314"
              y1="128"
              x2="358"
              y2="128"
              stroke="url(#nbGoldBevel)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="358"
              y1="128"
              x2="392"
              y2="162"
              stroke="url(#nbGoldBevel)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Lower Loop of B with Bold Aerodynamic Curve & Lower Chamfer */}
            <path
              d="M 314 244 L 354 244 C 382 244 402 268 402 310 L 402 342 L 368 376 L 314 376 Z M 314 278 L 348 278 C 366 278 374 290 374 310 C 374 330 366 342 348 342 L 314 342 Z"
              fill="url(#nbAmberGoldB)"
              fillRule="evenodd"
            />
            {/* Lower Loop Waist Bevel */}
            <line
              x1="314"
              y1="244"
              x2="354"
              y2="244"
              stroke="#FFF275"
              strokeWidth="2.5"
              strokeOpacity="0.75"
            />
            {/* Lower Loop Bottom Chamfer Highlight */}
            <line
              x1="402"
              y1="342"
              x2="368"
              y2="376"
              stroke="#FFAA00"
              strokeWidth="2.5"
              strokeOpacity="0.8"
            />
          </g>

          {/* Central Waist Accent Groove */}
          <line
            x1="314"
            y1="244"
            x2="348"
            y2="244"
            stroke="#151D2A"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};


