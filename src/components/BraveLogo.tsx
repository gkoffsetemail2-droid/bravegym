import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { BRAND_MEDIA } from '../data/brandMedia';

interface BraveLogoProps {
  variant?: 'dark' | 'light';
  compact?: boolean;
}

export const BraveLogo: React.FC<BraveLogoProps> = ({ variant = 'dark', compact = false }) => {
  const isLightSurfaceNeeded = variant === 'light';
  const sizeClass = compact ? 'w-[124px] h-[42px]' : 'w-[164px] h-[54px]';

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden select-none shrink-0 ${
        isLightSurfaceNeeded
          ? 'rounded-lg bg-[#F8F7F3] px-2.5 py-1 shadow-xs'
          : ''
      }`}
    >
      <div className={`${sizeClass} overflow-hidden flex items-center justify-center`}>
        <img
          src={BRAND_MEDIA.officialLogo}
          alt="Brave Gym and Fitness"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover object-center scale-[1.24] ${
            isLightSurfaceNeeded ? '' : 'mix-blend-multiply'
          }`}
        />
      </div>
    </div>
  );
};

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#123F2D] to-[#0B2E21] text-[#EAE2D5] p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Dumbbell className="w-7 h-7 opacity-75 mb-2" />
        {fallbackLabel && (
          <span className="text-xs font-medium tracking-wide text-center opacity-85">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={className}
    />
  );
};
