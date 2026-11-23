import React from "react";
import {
  Flame,
  Heart,
  Trophy,
  Zap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CyberGrid } from "../components/CyberGrid";
import { CyberParticles } from "../components/CyberParticles";
import { SuriCharacter } from "../components/SuriCharacter";

export const Scene4Gamification: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animated counter for XP
  const xpCount = Math.floor(
    interpolate(frame, [15, 90], [0, 480], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Animated streak flame multiplier
  const flamePulse = Math.sin(frame * 0.2) * 0.15 + 1;

  // Staggered springs for widgets
  const titleSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 10, stiffness: 140 },
  });

  const card1Spring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const card2Spring = spring({
    frame: frame - 28,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const card3Spring = spring({
    frame: frame - 42,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const card4Spring = spring({
    frame: frame - 55,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col justify-between p-16 bg-[#060913]">
      <CyberGrid glowColor="#8b5cf6" accentColor="#06b6d4" />
      <CyberParticles count={35} />

      {/* Top Header */}
      <div className="z-10 text-center max-w-4xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 font-mono text-xs uppercase tracking-widest font-bold mb-3 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          style={{
            transform: `scale(${titleSpring})`,
            opacity: titleSpring,
          }}
        >
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>MOTOR DE RETENCIÓN OCTALYSIS</span>
        </div>

        <h2
          className="text-6xl font-black text-white tracking-tight leading-none drop-shadow-md mb-2"
          style={{
            transform: `translateY(${(1 - titleSpring) * 25}px)`,
            opacity: titleSpring,
          }}
        >
          APRENDER CIBERSEGURIDAD
        </h2>
        <div
          style={{
            transform: `scale(${titleSpring})`,
            opacity: titleSpring,
          }}
        >
          <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
            NUNCA FUE TAN ADICTIVO
          </span>
        </div>
      </div>

      {/* Central Interactive Grid: 4 Gamification Pillars */}
      <div className="z-10 grid grid-cols-4 gap-6 max-w-6xl mx-auto w-full my-auto">
        {/* Widget 1: XP Explosion */}
        <div
          className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md text-center flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            transform: `scale(${card1Spring})`,
            opacity: card1Spring,
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
            <Zap className="w-8 h-8 fill-cyan-400" />
          </div>
          <span className="text-4xl font-black font-mono text-cyan-300">
            +{xpCount} XP
          </span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
            Experiencia Diaria
          </p>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (xpCount / 480) * 100)}%` }}
            />
          </div>
        </div>

        {/* Widget 2: Streak Multiplier */}
        <div
          className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md text-center flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            transform: `scale(${card2Spring})`,
            opacity: card2Spring,
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 transition-transform"
            style={{ transform: `scale(${flamePulse})` }}
          >
            <Flame className="w-8 h-8 fill-amber-400" />
          </div>
          <span className="text-4xl font-black font-mono text-amber-300">
            15 DÍAS
          </span>
          <p className="text-xs font-bold text-amber-400/90 uppercase tracking-wider mt-1">
            Multiplicador x2.0 🔥
          </p>
          <div className="mt-3 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 text-[11px] font-bold text-amber-300">
            Hábito Imparable
          </div>
        </div>

        {/* Widget 3: 5 Hearts */}
        <div
          className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md text-center flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            transform: `scale(${card3Spring})`,
            opacity: card3Spring,
          }}
        >
          <div className="flex gap-1.5 mb-4 text-rose-500">
            {[...Array(5)].map((_, i) => (
              <Heart key={i} className="w-6 h-6 fill-rose-500 animate-pulse" />
            ))}
          </div>
          <span className="text-3xl font-black text-rose-300">
            5 / 5 VIDAS
          </span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
            Centro de Errores Activo
          </p>
          <p className="text-[10px] text-rose-400/80 mt-2 font-mono">
            Recupera +1 vida con 100% de precisión
          </p>
        </div>

        {/* Widget 4: Competitive Leagues */}
        <div
          className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md text-center flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            transform: `scale(${card4Spring})`,
            opacity: card4Spring,
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8 fill-emerald-400" />
          </div>
          <span className="text-3xl font-black text-emerald-300">
            LIGA ORO
          </span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
            Ligas Globales & B2B
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
            <TrendingUp className="w-4 h-4" />
            <span>Top 5 asciende de división</span>
          </div>
        </div>
      </div>

      {/* Mascot Suri with OK gesture & celebratory reaction */}
      <div className="z-20 flex justify-center -mb-8">
        <SuriCharacter
          pose="ok"
          size={300}
          delay={25}
          bubbleText="¡Racha épica desbloqueada!"
          bubbleColor="bg-gradient-to-r from-purple-600 to-indigo-600"
        />
      </div>
    </div>
  );
};
