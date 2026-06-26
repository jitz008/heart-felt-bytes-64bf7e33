import React from 'react';

/**
 * GradientDots
 * A subtle, animated dot field used behind hero text.
 * Pure CSS — no deps. Honors --background for blend base (#060d1a default).
 */
export function GradientDots({
  className = '',
  opacity = 0.4,
  dotSize = 1.4,
  spacing = 22,
}: {
  className?: string;
  opacity?: number;
  dotSize?: number;
  spacing?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      {/* Animated color field */}
      <div className="gd-color-field" />
      {/* Dot mask on top */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.55) ${dotSize}px, transparent ${dotSize + 0.3}px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
          maskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          mixBlendMode: 'screen',
        }}
      />
      <style>{`
        .gd-color-field {
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(40% 50% at 20% 30%, rgba(79,142,247,0.55), transparent 60%),
            radial-gradient(35% 45% at 80% 40%, rgba(99,102,241,0.45), transparent 60%),
            radial-gradient(45% 55% at 50% 80%, rgba(37,99,235,0.40), transparent 60%);
          filter: blur(30px);
          animation: gd-drift 14s ease-in-out infinite alternate;
        }
        @keyframes gd-drift {
          0%   { transform: translate3d(0,0,0) scale(1); }
          50%  { transform: translate3d(2%, -3%, 0) scale(1.08); }
          100% { transform: translate3d(-2%, 3%, 0) scale(1.04); }
        }
      `}</style>
    </div>
  );
}

export default GradientDots;
