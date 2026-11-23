import React from "react";
import {
  AlertOctagon,
  ShieldAlert,
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

export const Scene1Alert: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Screen shake on alert arrival (frames 15-35)
  const shake =
    frame > 15 && frame < 35
      ? Math.sin(frame * 1.5) * interpolate(frame, [15, 35], [8, 0])
      : 0;

  // Staggered text entrances
  const title1Spring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 140 },
  });

  const title2Spring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 10, stiffness: 160 },
  });

  const badgeSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  // Radar ping expanding
  const radarScale = interpolate(frame % 45, [0, 45], [0.5, 3]);
  const radarOpacity = interpolate(frame % 45, [0, 45], [0.8, 0]);

  return (
    <div
      className="relative w-full h-full overflow-hidden flex items-center justify-between px-20 bg-[#060911]"
      style={{
        transform: `translate(${shake}px, ${shake * 0.5}px)`,
      }}
    >
      <CyberGrid glowColor="#ef4444" accentColor="#dc2626" />
      <CyberParticles count={30} />

      {/* Pulsing Radar Ring in Background */}
      <div
        className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-2 border-red-500/60 pointer-events-none"
        style={{
          transform: `scale(${radarScale})`,
          opacity: radarOpacity,
        }}
      />

      {/* Left Column: Kinetic Warning Typography */}
      <div className="flex-1 z-10 max-w-[880px]">
        {/* Top Tag */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 font-mono text-sm tracking-wider uppercase font-bold mb-6 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          style={{
            transform: `scale(${badgeSpring})`,
            opacity: badgeSpring,
          }}
        >
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>Vulnerabilidad Crítica en PYMES</span>
        </div>

        {/* Headline 1 */}
        <h1
          className="text-6xl font-black tracking-tight text-white leading-none drop-shadow-md mb-2"
          style={{
            transform: `translateY(${(1 - title1Spring) * 40}px)`,
            opacity: title1Spring,
          }}
        >
          ¿TU EQUIPO SABRÍA
        </h1>

        {/* Headline 2: High impact highlighted */}
        <div
          className="relative inline-block mb-8"
          style={{
            transform: `scale(${title2Spring})`,
            opacity: title2Spring,
          }}
        >
          <span className="text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 drop-shadow-[0_0_35px_rgba(239,68,68,0.6)]">
            DETECTAR ESTE ATAQUE?
          </span>
          {/* Underline laser glow */}
          <div className="h-2 w-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full mt-2 shadow-[0_0_15px_#ef4444]" />
        </div>

        {/* Simulation Threat Card */}
        <div
          className="bg-slate-900/90 border-2 border-red-500/40 rounded-2xl p-5 backdrop-blur-xl shadow-2xl max-w-xl"
          style={{
            transform: `translateY(${(1 - badgeSpring) * 30}px)`,
            opacity: badgeSpring,
          }}
        >
          <div className="flex items-center gap-3 text-red-400 mb-2 font-mono text-xs font-bold">
            <AlertOctagon className="w-4 h-4 animate-bounce" />
            <span>ALERTA DE SEGURIDAD EN TIEMPO REAL</span>
          </div>
          <p className="text-slate-300 text-lg font-medium leading-snug">
            El <span className="text-red-400 font-bold">91%</span> de los ciberataques exitosos a empresas empiezan con un correo falso que parecía legítimo.
          </p>
        </div>
      </div>

      {/* Right Column: Suri the Meerkat in Shock */}
      <div className="z-10 flex flex-col items-center">
        <SuriCharacter
          pose="shocked"
          size={500}
          delay={12}
          bubbleText="¡ALERTA ROJA!"
          bubbleColor="bg-gradient-to-r from-red-600 to-rose-600"
        />
      </div>
    </div>
  );
};
