import React from 'react';

interface SeagullLogoProps {
  className?: string;
  variant?: 'full' | 'mark-only' | 'header' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SeagullLogo: React.FC<SeagullLogoProps> = ({ 
  className = '', 
  variant = 'full',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24'
  };

  // Reusable SVG Mark matching exact shapes of uploaded brand logo
  const renderSvgMark = (svgClass: string, idPrefix: string) => (
    <svg 
      viewBox="0 0 400 280" 
      className={`${svgClass} shrink-0`} 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Sky Arc & Horizontal Bars Gradient (Light Cyan to Royal Blue) */}
        <linearGradient id={`${idPrefix}SkyGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#29B6F6" />
          <stop offset="50%" stopColor="#0288D1" />
          <stop offset="100%" stopColor="#1565C0" />
        </linearGradient>

        {/* Blue Bird Gradient (Cyan on Head/Wing to Deep Blue on Upper Wing) */}
        <linearGradient id={`${idPrefix}BirdGrad`} x1="0%" y1="50%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B0FF" />
          <stop offset="45%" stopColor="#0288D1" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        {/* Gold Wing / Airplane Shape Gradient (Warm Metallic Desert Gold) */}
        <linearGradient id={`${idPrefix}GoldGrad`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4A75E" />
          <stop offset="50%" stopColor="#C59B4E" />
          <stop offset="100%" stopColor="#B88A3B" />
        </linearGradient>
      </defs>

      <g transform="translate(-130, -35)">
        {/* 1. Top Sky Semi-Circle Arch */}
        <path d="M 236,150 C 236,92 284,45 344,45 C 404,45 452,92 452,150" 
              fill="none" 
              stroke={`url(#${idPrefix}SkyGrad)`} 
              strokeWidth="16" 
              strokeLinecap="round" />

        {/* 2. Left Horizontal Horizon Bar into Wing Swoop */}
        <path d="M 160,150 L 220,150 C 240,150 270,175 300,205" 
              fill="none"
              stroke={`url(#${idPrefix}SkyGrad)`} 
              strokeWidth="13" 
              strokeLinecap="round" 
              strokeLinejoin="round" />

        {/* 3. Right Horizontal Horizon Bar */}
        <path d="M 436,150 L 496,150" 
              fill="none"
              stroke={`url(#${idPrefix}SkyGrad)`} 
              strokeWidth="13" 
              strokeLinecap="round" />

        {/* 4. Gold Airplane / Lower Wing Shape */}
        <path d="M 248,228 
                 C 275,268 355,274 410,230 
                 C 440,205 480,180 495,178 
                 C 502,177 500,188 490,196 
                 C 462,220 425,250 405,268 
                 L 405,310 
                 C 405,318 416,318 418,310 
                 L 418,252 
                 C 432,238 480,195 498,172 
                 C 475,190 435,215 398,222 
                 C 345,232 300,210 286,190 
                 C 280,182 270,182 268,188 
                 C 260,208 248,220 248,228 Z" 
              fill={`url(#${idPrefix}GoldGrad)`} />

        {/* 5. Blue Seagull Bird in Flight */}
        <path d="M 210,215 
                 C 205,215 200,218 195,221 
                 C 200,223 206,223 214,220 
                 C 230,224 250,235 295,235 
                 C 340,235 385,200 445,150 
                 C 385,175 330,215 295,215 
                 C 265,215 242,195 210,215 Z" 
              fill={`url(#${idPrefix}BirdGrad)`} />

        {/* Upper Wing of Seagull */}
        <path d="M 275,195 
                 C 305,170 370,130 445,150 
                 C 390,172 340,215 295,215 
                 C 285,215 278,205 275,195 Z" 
              fill={`url(#${idPrefix}BirdGrad)`} />
      </g>
    </svg>
  );

  if (variant === 'mark-only') {
    return renderSvgMark(`${sizeClasses[size]} ${className}`, 'mo');
  }

  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center text-center ${className}`}>
        {/* SVG Icon Mark Centered */}
        {renderSvgMark(`${sizeClasses[size]} mb-0.5`, 'stk')}

        {/* Typography */}
        <div className="flex flex-col items-center">
          <span className="font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00A8FF] via-[#0284C7] to-[#1D4ED8] leading-none text-base sm:text-lg">
            SEAGULL GLOBAL
          </span>
          <span className="text-[7px] sm:text-[8px] font-semibold text-slate-800 tracking-[0.2em] uppercase mt-1">
            YOUR GATEWAY TO THE WORLD
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-3 ${className}`}>
      {/* SVG Icon Mark */}
      {renderSvgMark(sizeClasses[size], 'full')}

      {/* Typography */}
      <div className="flex flex-col justify-center">
        <span className="font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00A8FF] via-[#0284C7] to-[#1D4ED8] leading-none text-xl sm:text-2xl">
          SEAGULL GLOBAL
        </span>
        <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-slate-800 tracking-[0.22em] uppercase mt-0.5">
          YOUR GATEWAY TO THE WORLD
        </span>
      </div>
    </div>
  );
};
