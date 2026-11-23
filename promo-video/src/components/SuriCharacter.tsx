import React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type SuriPoseKey =
  | "shocked"
  | "running"
  | "laptop"
  | "happy"
  | "cool"
  | "ok"
  | "winking"
  | "thinking"
  | "sad"
  | "sleeping";

const POSE_FILES: Record<SuriPoseKey, string> = {
  shocked: "suri/suri_shocked.png",
  running: "suri/suri_running.png",
  laptop: "suri/suri_laptop.png",
  happy: "suri/suri_happy.png",
  cool: "suri/suri_cool.png",
  ok: "suri/suri_ok.png",
  winking: "suri/suri_winking.png",
  thinking: "suri/suri_thinking.png",
  sad: "suri/suri_sad.png",
  sleeping: "suri/suri_sleeping.png",
};

interface SuriCharacterProps {
  pose: SuriPoseKey;
  size?: number;
  className?: string;
  delay?: number;
  bubbleText?: string;
  bubbleColor?: string;
  floating?: boolean;
  glow?: boolean;
}

export const SuriCharacter: React.FC<SuriCharacterProps> = ({
  pose,
  size = 400,
  className = "",
  delay = 0,
  bubbleText,
  bubbleColor = "bg-cyan-500",
  floating = true,
  glow = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animation
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 12,
      mass: 0.8,
      stiffness: 120,
    },
  });

  // Idle floating breathing effect
  const floatOffset = floating
    ? Math.sin((frame - delay) * 0.1) * 12
    : 0;

  // Gentle tilt
  const tilt = floating
    ? Math.sin((frame - delay) * 0.08) * 3
    : 0;

  // Bubble spring
  const bubbleSpring = spring({
    frame: frame - delay - 10,
    fps,
    config: {
      damping: 10,
      stiffness: 150,
    },
  });

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      style={{
        transform: `scale(${entrance}) translateY(${floatOffset}px) rotate(${tilt}deg)`,
        opacity: interpolate(entrance, [0, 0.2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      {/* Speech / Reaction Bubble */}
      {bubbleText && (
        <div
          className={`absolute -top-16 z-20 px-5 py-2.5 rounded-2xl shadow-xl font-bold text-white text-lg tracking-wide border border-white/20 backdrop-blur-md ${bubbleColor}`}
          style={{
            transform: `scale(${bubbleSpring}) translateY(${(1 - bubbleSpring) * 20}px)`,
            opacity: bubbleSpring,
          }}
        >
          {bubbleText}
          {/* Bubble tail */}
          <div
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b border-white/20 ${bubbleColor}`}
          />
        </div>
      )}

      {/* Suri Ambient Glow Circle */}
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-[60px] pointer-events-none -z-10"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)",
            transform: "scale(1.2)",
          }}
        />
      )}

      {/* Mascot Image */}
      <Img
        src={staticFile(POSE_FILES[pose])}
        alt="Suri the Sentinel Meerkat"
        style={{
          width: `${size}px`,
          height: "auto",
          filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))",
        }}
      />

      {/* Dynamic Ground Shadow */}
      <div
        className="w-[60%] h-5 bg-black/40 rounded-full blur-[8px] mt-2 -z-10"
        style={{
          transform: `scale(${interpolate(floatOffset, [-12, 12], [0.85, 1.15])})`,
          opacity: interpolate(floatOffset, [-12, 12], [0.3, 0.6]),
        }}
      />
    </div>
  );
};
