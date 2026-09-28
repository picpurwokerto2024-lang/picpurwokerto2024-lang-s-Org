import React, { useMemo } from 'react';

interface SakuraPetal {
  id: number;
  left: number; // percentage 0 - 100
  animationDuration: number; // seconds
  delay: number; // seconds
  size: number; // px
  rotation: number; // deg
  opacity: number;
  swayDuration: number;
}

export const SakuraFallingCanvas: React.FC = () => {
  // Pre-generate a list of natural floating sakura petals
  const petals: SakuraPetal[] = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 6 + Math.random() * 8, // 6s - 14s fall time
      delay: Math.random() * 6,
      size: 10 + Math.random() * 14, // 10px - 24px
      rotation: Math.random() * 360,
      opacity: 0.6 + Math.random() * 0.4,
      swayDuration: 2.5 + Math.random() * 3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Subtle Mount Fuji & Japanese Sun & Pagoda Silhouette in background */}
      <svg
        className="absolute bottom-0 right-0 w-full h-full opacity-20 text-rose-300 pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 800 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Rising Sun Halo */}
        <circle cx="680" cy="90" r="70" fill="url(#sun-gradient)" opacity="0.35" />
        
        {/* Mount Fuji Profile */}
        <path
          d="M480 300L620 120C635 100 665 100 680 120L820 300H480Z"
          fill="url(#fuji-gradient)"
        />
        {/* Fuji Snowcap */}
        <path
          d="M605 140L620 120C635 100 665 100 680 120L695 140C680 150 670 142 650 150C630 142 620 150 605 140Z"
          fill="#FFF"
          opacity="0.6"
        />

        {/* Japanese Pagoda / Torii Gate Subtle Outline on Left */}
        <path
          d="M40 300V210H30V195H110V210H100V300H85V240H55V300H40Z"
          fill="#FFF"
          opacity="0.15"
        />
        <path
          d="M20 185C50 180 90 180 120 185L115 170C85 168 55 168 25 170L20 185Z"
          fill="#FFF"
          opacity="0.25"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="sun-gradient" x1="680" y1="20" x2="680" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F43F5E" />
            <stop stopColor="#FDA4AF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fuji-gradient" x1="650" y1="100" x2="650" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4C0519" stopOpacity="0.7" />
            <stop stopColor="#0F172A" stopOpacity="0.95" />
          </linearGradient>
        </defs>
      </svg>

      {/* Falling and swaying Sakura Petals */}
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute top-[-30px]"
          style={{
            left: `${petal.left}%`,
            animation: `sakuraFall ${petal.animationDuration}s linear infinite, sakuraSway ${petal.swayDuration}s ease-in-out infinite alternate`,
            animationDelay: `${petal.delay}s`,
            opacity: petal.opacity,
          }}
        >
          {/* Stylized SVG Sakura Petal */}
          <svg
            width={petal.size}
            height={petal.size}
            viewBox="0 0 32 32"
            style={{
              transform: `rotate(${petal.rotation}deg)`,
              filter: 'drop-shadow(0 2px 4px rgba(244, 63, 94, 0.3))',
            }}
          >
            <path
              d="M16 2 C11 2, 4 8, 4 16 C4 24, 12 30, 16 30 C20 30, 28 24, 28 16 C28 8, 21 2, 16 2 Z M16 6 C17 6, 18 8, 16 11 C14 8, 15 6, 16 6 Z"
              fill="url(#sakura-petal-grad)"
            />
            <defs>
              <linearGradient id="sakura-petal-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFE4E6" />
                <stop offset="0.6" stopColor="#FDA4AF" />
                <stop offset="1" stopColor="#F43F5E" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}
    </div>
  );
};
