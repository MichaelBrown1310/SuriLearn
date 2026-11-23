import React from "react";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Users,
  Smartphone,
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

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animations
  const logoSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 10, stiffness: 140 },
  });

  const headlineSpring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const buttonSpring = spring({
    frame: frame - 32,
    fps,
    config: { damping: 9, stiffness: 160 },
  });

  const footerSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  // Pulsing glow on CTA button
  const buttonGlow = Math.sin(frame * 0.15) * 8 + 20;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-between px-20 bg-[#050811]">
      <CyberGrid glowColor="#10b981" accentColor="#06b6d4" />
      <CyberParticles count={40} />

      {/* Left Column: Suri with sunglasses */}
      <div className="z-10 flex flex-col items-center pl-6">
        <SuriCharacter
          pose="cool"
          size={520}
          delay={5}
          bubbleText="¡Seguridad al 100%!"
          bubbleColor="bg-gradient-to-r from-emerald-600 to-teal-600"
        />
      </div>

      {/* Right Column: CTA & Finale Pitch */}
      <div className="flex-1 z-10 max-w-[900px] pl-12 flex flex-col items-start">
        {/* Brand Lockup */}
        <div
          className="flex items-center gap-3 mb-4"
          style={{
            transform: `scale(${logoSpring})`,
            opacity: logoSpring,
          }}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_25px_rgba(16,185,129,0.5)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-4xl font-black text-white tracking-tight">
            SuriLearn
          </span>
          <span className="text-sm font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
            Escudo Digital PYME
          </span>
        </div>

        {/* Headline */}
        <h2
          className="text-6xl font-black tracking-tight text-white leading-[1.08] mb-4"
          style={{
            transform: `translateY(${(1 - headlineSpring) * 30}px)`,
            opacity: headlineSpring,
          }}
        >
          CONVIÉRTETE EN EL{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 drop-shadow-[0_0_35px_rgba(16,185,129,0.6)]">
            CENTINELA DIGITAL
          </span>{" "}
          DE TU EMPRESA.
        </h2>

        <p
          className="text-xl text-slate-300 font-medium mb-8 max-w-2xl leading-relaxed"
          style={{
            opacity: interpolate(headlineSpring, [0.5, 1], [0, 1]),
          }}
        >
          Capacita a todo tu equipo con minijuegos de 3 minutos y detén el 90% de las amenazas de phishing antes de que sucedan.
        </p>

        {/* Big Action Button */}
        <div
          className="relative inline-block mb-8"
          style={{
            transform: `scale(${buttonSpring})`,
            opacity: buttonSpring,
          }}
        >
          <div
            className="px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-black text-2xl flex items-center gap-4 cursor-pointer transition-all duration-300"
            style={{
              boxShadow: `0 0 ${buttonGlow}px rgba(16, 185, 129, 0.7), 0 15px 30px rgba(0,0,0,0.5)`,
            }}
          >
            <span>EMPIEZA TU PRUEBA GRATUITA</span>
            <div className="w-10 h-10 rounded-full bg-slate-950/20 flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-slate-950" />
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div
          className="flex items-center gap-8 pt-4 border-t border-slate-800/80 w-full"
          style={{
            transform: `translateY(${(1 - footerSpring) * 20}px)`,
            opacity: footerSpring,
          }}
        >
          <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Sin tarjeta requerida</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Planes individuales & PYMES</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
            <Smartphone className="w-5 h-5 text-purple-400" />
            <span>PWA / Web Progresiva</span>
          </div>
        </div>
      </div>
    </div>
  );
};
