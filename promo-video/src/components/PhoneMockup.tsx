import React from "react";
import {
  Heart,
  Flame,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Mail,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface PhoneMockupProps {
  delay?: number;
  screenType?: "inbox" | "password" | "gamification";
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  delay = 0,
  screenType = "inbox",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 14,
      mass: 1.1,
      stiffness: 90,
    },
  });

  // Floating tilt effect
  const tiltX = Math.sin((frame - delay) * 0.05) * 4;
  const tiltY = Math.cos((frame - delay) * 0.04) * 6;

  // Scanning animation inside the phone
  const scanBar = interpolate((frame - delay) % 60, [0, 60], [0, 380]);

  return (
    <div
      className="relative select-none"
      style={{
        perspective: "1200px",
        transform: `scale(${entrance})`,
        opacity: interpolate(entrance, [0, 0.2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      {/* 3D Phone Shell */}
      <div
        className="w-[320px] h-[640px] rounded-[48px] p-3 bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] border-[4px] border-[#334155] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(6,182,212,0.25)] relative overflow-hidden"
        style={{
          transform: `rotateX(${10 + tiltX}deg) rotateY(${-12 + tiltY}deg) rotateZ(2deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Screen Glass Surface */}
        <div className="w-full h-full rounded-[38px] bg-[#090d16] border border-cyan-500/20 flex flex-col overflow-hidden relative font-sans text-white">
          {/* Top Notch / Dynamic Island */}
          <div className="pt-2 flex justify-center">
            <div className="w-24 h-5 bg-black/80 rounded-full flex items-center justify-center gap-2 border border-slate-700/50">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
              <div className="w-2 h-2 rounded-full bg-cyan-500/80 animate-pulse" />
            </div>
          </div>

          {/* SuriLearn In-App Header HUD */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 mt-1">
            {/* Lives */}
            <div className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>5</span>
            </div>
            {/* Streak */}
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>7 Días</span>
            </div>
            {/* Bits */}
            <div className="flex items-center gap-1 text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full border border-cyan-500/20">
              <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              <span>350</span>
            </div>
          </div>

          {/* Screen Content based on type */}
          {screenType === "inbox" && (
            <div className="p-4 flex-1 flex flex-col gap-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                  Inbox Threat Scanner
                </span>
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/40 font-semibold animate-pulse">
                  SOSPECHOSO
                </span>
              </div>

              {/* Fake Email Card */}
              <div className="bg-slate-900/90 border border-red-500/30 rounded-2xl p-3 shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate text-slate-100">
                      banco-soporte@notif-urgente.com
                    </p>
                    <p className="text-[10px] text-red-400 font-mono">
                      SPF: FAIL ❌ | DKIM: NONE
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 leading-snug mb-3">
                  "Su cuenta empresarial ha sido suspendida. Descargue su estado de cuenta urgente:"
                </div>

                {/* Threat Attachment */}
                <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <div>
                      <p className="text-[10px] font-mono font-bold text-red-300">
                        factura_octubre.pdf.exe
                      </p>
                      <p className="text-[9px] text-slate-400">Doble extensión maliciosa</p>
                    </div>
                  </div>
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                </div>

                {/* Internal Scanline */}
                <div
                  className="absolute left-0 right-0 h-1 bg-cyan-400/80 shadow-[0_0_12px_#38bdf8]"
                  style={{ top: `${scanBar}px` }}
                />
              </div>

              {/* Decision Buttons */}
              <div className="mt-auto flex flex-col gap-2">
                <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>REPORTAR PHISHING (+50 XP)</span>
                </button>
                <button className="w-full py-2 rounded-xl bg-slate-800 text-slate-400 font-semibold text-xs border border-slate-700">
                  Marcar como Seguro
                </button>
              </div>
            </div>
          )}

          {screenType === "password" && (
            <div className="p-4 flex-1 flex flex-col gap-3">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                Password Vault Builder
              </span>

              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 text-center mt-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <p className="font-mono text-xs font-bold text-emerald-300 tracking-wider">
                  Suri#Centinela_2026!
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Entropía: 94 bits</p>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                  <div className="w-[95%] h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" />
                </div>
                <p className="text-[11px] text-emerald-400 font-bold mt-2">
                  Tiempo para crackear: &gt;450 AÑOS 🛡️
                </p>
              </div>

              <div className="mt-auto">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-cyan-300">¡Bóveda Inexpugnable!</p>
                  <p className="text-[10px] text-slate-400">Objetivo del día completado</p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Bar Indicator */}
          <div className="pb-2 pt-1 flex justify-center">
            <div className="w-28 h-1 bg-slate-700 rounded-full" />
          </div>
        </div>

        {/* Gloss reflection overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none rounded-[44px]"
        />
      </div>
    </div>
  );
};
