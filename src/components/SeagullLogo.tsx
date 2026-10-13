import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface SeagullLogoProps {
  className?: string;
  variant?: 'full' | 'mark-only' | 'header' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  allowUpload?: boolean;
}

export const SeagullLogo: React.FC<SeagullLogoProps> = ({ 
  className = '', 
  variant = 'full',
  size = 'md',
  allowUpload = false
}) => {
  const [logoSrc, setLogoSrc] = useState<string | null>(() => {
    return localStorage.getItem('custom_brand_logo') || null;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check server for saved logo on mount
  useEffect(() => {
    fetch('/api/current-logo')
      .then(res => res.json())
      .then(data => {
        if (data?.exists && data?.url) {
          setLogoSrc(data.url);
        }
      })
      .catch(() => {});

    const handleLogoUpdate = (e: any) => {
      if (e.detail?.url) {
        setLogoSrc(e.detail.url);
      } else {
        const stored = localStorage.getItem('custom_brand_logo');
        if (stored) setLogoSrc(stored);
      }
    };

    window.addEventListener('brand_logo_updated', handleLogoUpdate);
    return () => window.removeEventListener('brand_logo_updated', handleLogoUpdate);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        // Save locally first for instant display
        localStorage.setItem('custom_brand_logo', dataUrl);
        setLogoSrc(dataUrl);
        window.dispatchEvent(new CustomEvent('brand_logo_updated', { detail: { url: dataUrl } }));

        // Also persist to server disk so it's permanent
        try {
          await fetch('/api/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: dataUrl, filename: file.name })
          });
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err) {
          console.warn('Could not save to disk, but stored in local storage:', err);
        }
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Height scales
  const sizeClasses = {
    sm: 'h-9',
    md: 'h-14',
    lg: 'h-20',
    xl: 'h-28'
  };

  // SVG Definitions for Vector Fallback
  const renderDefs = (idPrefix: string) => (
    <defs>
      <linearGradient id={`${idPrefix}SkyGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#29B6F6" />
        <stop offset="50%" stopColor="#0288D1" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id={`${idPrefix}BirdGrad`} x1="0%" y1="30%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00B0FF" />
        <stop offset="35%" stopColor="#008CE3" />
        <stop offset="70%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id={`${idPrefix}GoldGrad`} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E5BF7D" />
        <stop offset="50%" stopColor="#CAA05D" />
        <stop offset="100%" stopColor="#B88D44" />
      </linearGradient>
      <linearGradient id={`${idPrefix}TextGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00ADEF" />
        <stop offset="25%" stopColor="#0096E6" />
        <stop offset="65%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
  );

  const renderEmblemShapes = (idPrefix: string) => (
    <g id={`${idPrefix}EmblemMark`}>
      <path 
        d="M 385,205 A 120,120 0 0,1 615,205" 
        fill="none" 
        stroke={`url(#${idPrefix}SkyGrad)`} 
        strokeWidth="26" 
        strokeLinecap="round" 
      />
      <path 
        d="M 270,205 L 355,205 C 385,205 415,245 445,280 C 495,245 555,205 615,205 L 730,205 C 736,205 740,210 740,215 C 740,220 736,225 730,225 L 615,225 C 565,255 515,300 475,325 C 425,325 390,312 375,296 L 358,292 L 372,289 C 405,278 355,225 270,225 C 264,225 260,220 260,215 C 260,210 264,205 270,205 Z" 
        fill={`url(#${idPrefix}BirdGrad)`} 
      />
      <path 
        d="M 395,290 C 430,345 470,365 510,365 C 545,365 585,348 615,315 L 615,385 C 615,392 632,392 632,385 L 632,322 C 660,295 705,255 740,222 C 748,214 754,224 746,232 C 705,275 665,312 638,320 C 615,295 580,268 565,266 C 558,266 558,274 565,278 C 585,295 605,308 610,318 C 580,342 545,348 510,348 C 465,348 430,328 405,295 Z" 
        fill={`url(#${idPrefix}GoldGrad)`} 
      />
    </g>
  );

  // Hidden upload input and trigger
  const uploadButton = allowUpload ? (
    <div className="mt-2 flex items-center justify-center gap-2">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" 
        className="hidden" 
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-xs transition-colors cursor-pointer"
        title="Upload original logos_page-0002.jpg from your computer"
      >
        {isUploading ? (
          <span>Uploading...</span>
        ) : uploadSuccess ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700">Original Logo Active!</span>
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Upload Original Logo File</span>
          </>
        )}
      </button>
    </div>
  ) : null;

  // If we have a custom or uploaded original logo image, display it directly!
  if (logoSrc) {
    return (
      <div className="flex flex-col items-center">
        <img 
          src={logoSrc} 
          alt="Seagull Global - Your Gateway to the World" 
          className={`${sizeClasses[size]} w-auto max-w-full object-contain select-none ${className}`}
          onError={() => {
            // If image fails, revert to SVG
            setLogoSrc(null);
          }}
        />
        {uploadButton}
      </div>
    );
  }

  // MARK ONLY
  if (variant === 'mark-only') {
    return (
      <div className="flex flex-col items-center">
        <svg 
          viewBox="240 85 520 330" 
          className={`${sizeClasses[size]} w-auto shrink-0 select-none ${className}`} 
          xmlns="http://www.w3.org/2000/svg"
        >
          {renderDefs('mo')}
          {renderEmblemShapes('mo')}
        </svg>
        {uploadButton}
      </div>
    );
  }

  // STACKED BRAND LOGO (Matches logos_page-0002.jpg)
  if (variant === 'stacked') {
    return (
      <div className="flex flex-col items-center">
        <svg 
          viewBox="200 85 600 525" 
          className={`${sizeClasses[size]} w-auto shrink-0 select-none ${className}`} 
          xmlns="http://www.w3.org/2000/svg"
        >
          {renderDefs('stk')}
          {renderEmblemShapes('stk')}
          <text 
            x="500" 
            y="535" 
            textAnchor="middle" 
            fontFamily="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
            fontWeight="900" 
            fontSize="72" 
            letterSpacing="2.5" 
            fill="url(#stkTextGrad)"
          >
            SEAGULL GLOBAL
          </text>
          <text 
            x="500" 
            y="590" 
            textAnchor="middle" 
            fontFamily="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
            fontWeight="500" 
            fontSize="23" 
            letterSpacing="9.5" 
            fill="#231F20"
          >
            YOUR GATEWAY TO THE WORLD
          </text>
        </svg>
        {uploadButton}
      </div>
    );
  }

  // HORIZONTAL FULL LOCKUP
  return (
    <div className="flex flex-col">
      <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
        <svg 
          viewBox="240 85 520 330" 
          className={`${sizeClasses[size]} w-auto shrink-0`} 
          xmlns="http://www.w3.org/2000/svg"
        >
          {renderDefs('full')}
          {renderEmblemShapes('full')}
        </svg>
        <div className="flex flex-col justify-center">
          <span 
            className="font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00ADEF] via-[#0284C7] to-[#1D4ED8] leading-none text-xl sm:text-2xl"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}
          >
            SEAGULL GLOBAL
          </span>
          <span 
            className="text-[8.5px] sm:text-[9.5px] font-semibold text-[#231F20] tracking-[0.25em] uppercase mt-1 whitespace-nowrap"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}
          >
            YOUR GATEWAY TO THE WORLD
          </span>
        </div>
      </div>
      {uploadButton}
    </div>
  );
};
