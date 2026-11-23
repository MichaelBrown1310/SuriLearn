import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  char: string;
}

export const CyberParticles: React.FC<{ count?: number }> = ({ count = 25 }) => {
  const frame = useCurrentFrame();

  const particles: Particle[] = useMemo(() => {
    const chars = ["0", "1", "🛡️", "⚡", "🔒", "🔑", "0", "1", "1", "0"];
    const arr: Particle[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (i * 77) % 1920,
        y: (i * 123) % 1080,
        size: 14 + (i % 5) * 4,
        speed: 0.5 + (i % 4) * 0.4,
        opacity: 0.15 + (i % 3) * 0.1,
        char: chars[i % chars.length],
      });
    }
    return arr;
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, idx) => {
        const currentY = (p.y - frame * p.speed * 2) % 1100;
        const normalizedY = currentY < -50 ? currentY + 1150 : currentY;
        const wobble = Math.sin(frame * 0.05 + idx) * 15;

        return (
          <div
            key={idx}
            className="absolute font-mono font-bold text-cyan-400 select-none"
            style={{
              left: `${p.x + wobble}px`,
              top: `${normalizedY}px`,
              fontSize: `${p.size}px`,
              opacity: p.opacity,
              filter: "blur(0.5px)",
            }}
          >
            {p.char}
          </div>
        );
      })}
    </div>
  );
};
