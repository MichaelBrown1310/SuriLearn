import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface CyberGridProps {
  glowColor?: string;
  accentColor?: string;
}

export const CyberGrid: React.FC<CyberGridProps> = ({
  glowColor = "#06b6d4",
  accentColor = "#10b981",
}) => {
  const frame = useCurrentFrame();

  // Moving scanline effect
  const scanlineY = interpolate(frame % 90, [0, 90], [0, 1080]);

  // Subtle pulsing glow
  const pulseOpacity = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.15, 0.35]
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#070b14] pointer-events-none">
      {/* Radial Gradient Ambient Lighting */}
      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none transition-all"
        style={{
          backgroundColor: glowColor,
          opacity: pulseOpacity * 0.8,
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none transition-all"
        style={{
          backgroundColor: accentColor,
          opacity: pulseOpacity * 0.7,
        }}
      />

      {/* Cyber Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #38bdf8 1px, transparent 1px),
            linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Sweeping Laser Scanline */}
      <div
        className="absolute left-0 right-0 h-[2px] blur-[1px] pointer-events-none"
        style={{
          top: `${scanlineY}px`,
          background: `linear-gradient(90deg, transparent, ${glowColor}, #ffffff, ${glowColor}, transparent)`,
          opacity: 0.6,
        }}
      />
      <div
        className="absolute left-0 right-0 h-[40px] -mt-[20px] pointer-events-none"
        style={{
          top: `${scanlineY}px`,
          background: `linear-gradient(180deg, transparent, ${glowColor}15, transparent)`,
        }}
      />

      {/* Vignette border */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
    </div>
  );
};
