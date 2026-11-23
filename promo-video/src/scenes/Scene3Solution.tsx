import React from "react";
import {
  ShieldCheck,
  Gamepad2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CyberGrid } from "../components/CyberGrid";
import { CyberParticles } from "../components/CyberParticles";
import { PhoneMockup } from "../components/PhoneMockup";
import { SuriCharacter } from "../components/SuriCharacter";

export const Scene3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const brandSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 10, stiffness: 140 },
  });

  const feature1Spring = spring({
    frame: frame - 25,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const feature2Spring = spring({
    frame: frame - 40,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const feature3Spring = spring({
    frame: frame - 55,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-between px-20 bg-[#060b17]">
      <CyberGrid glowColor="#06b6d4" accentColor="#10b981" />
      <CyberParticles count={30} />

      {/* Left Column: Brand Showcase & Value Proposition */}
      <div className="flex-1 z-10 max-w-[850px] pr-10">
        {/* Intro Pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 font-mono text-xs tracking-widest uppercase font-bold mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          style={{
            transform: `scale(${brandSpring})`,
            opacity: brandSpring,
          }}
        >
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>MICROAPRENDIZAJE GAMIFICADO</span>
        </div>

        {/* Brand Headline */}
        <div
          className="flex items-center gap-4 mb-2"
          style={{
            transform: `scale(${brandSpring}) translateY(${(1 - brandSpring) * 20}px)`,
            opacity: brandSpring,
          }}
        >
          <h1 className="text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            SuriLearn
          </h1>
          <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-extrabold uppercase">
            v0.8.0
          </div>
        </div>

        <p
          className="text-2xl font-bold text-slate-200 mb-8"
          style={{
            opacity: interpolate(brandSpring, [0.5, 1], [0, 1]),
          }}
        >
          Transforma a tus colaboradores en el <span className="text-cyan-400 underline decoration-cyan-500/50">primer escudo humano</span> de tu empresa.
        </p>

        {/* Feature Highlights Grid */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Feature 1 */}
          <div
            className="flex items-center gap-4 bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-4 backdrop-blur-md shadow-lg"
            style={{
              transform: `translateX(${(1 - feature1Spring) * -40}px)`,
              opacity: feature1Spring,
            }}
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Solo 3 a 5 minutos al día</h3>
              <p className="text-slate-400 text-sm">
                Lecciones ultracortas diseñadas con el modelo conductual Fogg y Octalysis.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div
            className="flex items-center gap-4 bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-md shadow-lg"
            style={{
              transform: `translateX(${(1 - feature2Spring) * -40}px)`,
              opacity: feature2Spring,
            }}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">6 Minijuegos Interactivos</h3>
              <p className="text-slate-400 text-sm">
                Inbox Threat Scanner, Password Vault, URL Inspector y simuladores reales.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div
            className="flex items-center gap-4 bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4 backdrop-blur-md shadow-lg"
            style={{
              transform: `translateX(${(1 - feature3Spring) * -40}px)`,
              opacity: feature3Spring,
            }}
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Metodología NIST SP 800-63B</h3>
              <p className="text-slate-400 text-sm">
                Criterios de seguridad corporativa adaptados de forma lúdica y sin tecnicismos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Phone Mockup & Suri with Laptop */}
      <div className="z-10 relative flex items-center">
        {/* Floating Phone Mockup */}
        <PhoneMockup delay={10} screenType="inbox" />

        {/* Suri with Laptop sitting beside the phone */}
        <div className="absolute -bottom-10 -left-48 z-20">
          <SuriCharacter
            pose="laptop"
            size={320}
            delay={20}
            bubbleText="¡Analizando código!"
            bubbleColor="bg-gradient-to-r from-cyan-600 to-teal-600"
          />
        </div>
      </div>
    </div>
  );
};
