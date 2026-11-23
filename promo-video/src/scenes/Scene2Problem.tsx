import React from "react";
import {
  FileWarning,
  Lock,
  MessageSquareWarning,
  XCircle,
  Clock,
  Skull,
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

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Suri running across the bottom
  const suriX = interpolate(frame, [0, 130], [-200, 1600], {
    extrapolateRight: "clamp",
  });

  // Card staggered springs
  const card1Spring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const card2Spring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const card3Spring = spring({
    frame: frame - 35,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const bannerSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 10, stiffness: 170 },
  });

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col justify-between p-16 bg-[#070b16]">
      <CyberGrid glowColor="#f59e0b" accentColor="#ef4444" />
      <CyberParticles count={25} />

      {/* Header section: Kinetic Headline */}
      <div className="z-10 text-center max-w-4xl mx-auto">
        <h2 className="text-5xl font-black text-white tracking-tight uppercase leading-tight mb-2">
          Cursos largos de 2 horas en video...
        </h2>
        <div
          className="inline-block"
          style={{
            transform: `scale(${bannerSpring})`,
            opacity: bannerSpring,
          }}
        >
          <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">
            ¡NADIE LOS RECUERDA!
          </span>
        </div>
      </div>

      {/* Center Cards Grid: 3 Real Danger Vectors */}
      <div className="z-10 grid grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
        {/* Card 1: Phishing */}
        <div
          className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
          style={{
            transform: `translateY(${(1 - card1Spring) * 60}px) scale(${card1Spring})`,
            opacity: card1Spring,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <FileWarning className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              VECTOR 01
            </span>
          </div>
          <div>
            <h3 className="text-xl font-black text-white mb-1">
              Phishing & Enlaces Trampa
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Correos suplantando a directivos con enlaces que roban credenciales al instante.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-rose-400 text-xs font-bold font-mono">
            <XCircle className="w-4 h-4" />
            <span>Falla en el primer filtro</span>
          </div>
        </div>

        {/* Card 2: Password Weakness */}
        <div
          className="bg-slate-900/90 border border-red-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
          style={{
            transform: `translateY(${(1 - card2Spring) * 60}px) scale(${card2Spring})`,
            opacity: card2Spring,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
              VECTOR 02
            </span>
          </div>
          <div>
            <h3 className="text-xl font-black text-white mb-1">
              Contraseñas Débiles
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Combinaciones predecibles descifradas por bots en menos de 0.5 segundos.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-rose-400 text-xs font-bold font-mono">
            <Skull className="w-4 h-4" />
            <span>Entropía crítica</span>
          </div>
        </div>

        {/* Card 3: Social Engineering */}
        <div
          className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
          style={{
            transform: `translateY(${(1 - card3Spring) * 60}px) scale(${card3Spring})`,
            opacity: card3Spring,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <MessageSquareWarning className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
              VECTOR 03
            </span>
          </div>
          <div>
            <h3 className="text-xl font-black text-white mb-1">
              Ingeniería Social
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Mensajes falsos con urgencia artificial buscando saltarse los protocolos.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-rose-400 text-xs font-bold font-mono">
            <Clock className="w-4 h-4" />
            <span>Presión psicológica</span>
          </div>
        </div>
      </div>

      {/* Suri Sprinting Across the Screen */}
      <div
        className="absolute bottom-6 z-20 pointer-events-none"
        style={{
          left: `${suriX}px`,
        }}
      >
        <SuriCharacter
          pose="running"
          size={240}
          floating={false}
          bubbleText="¡ALTO AHÍ!"
          bubbleColor="bg-gradient-to-r from-amber-500 to-red-500"
        />
      </div>
    </div>
  );
};
