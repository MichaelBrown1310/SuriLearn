import React from "react";
import { Composition } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Scene1Alert } from "./scenes/Scene1Alert";
import { Scene2Problem } from "./scenes/Scene2Problem";
import { Scene3Solution } from "./scenes/Scene3Solution";
import { Scene4Gamification } from "./scenes/Scene4Gamification";
import { Scene5CTA } from "./scenes/Scene5CTA";

export const SuriLearnVideoAd: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Escena 1: El Ataque / Gancho */}
      <TransitionSeries.Sequence durationInFrames={130}>
        <Scene1Alert />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({
          config: { damping: 14, stiffness: 120 },
          durationInFrames: 15,
        })}
      />

      {/* Escena 2: El Problema de los Métodos Tradicionales */}
      <TransitionSeries.Sequence durationInFrames={130}>
        <Scene2Problem />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-top-left" })}
        timing={springTiming({
          config: { damping: 14, stiffness: 120 },
          durationInFrames: 15,
        })}
      />

      {/* Escena 3: La Solución SuriLearn & Mockup App */}
      <TransitionSeries.Sequence durationInFrames={160}>
        <Scene3Solution />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={springTiming({
          config: { damping: 14, stiffness: 120 },
          durationInFrames: 15,
        })}
      />

      {/* Escena 4: Gamificación & Retención */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <Scene4Gamification />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({
          config: { damping: 14, stiffness: 120 },
          durationInFrames: 15,
        })}
      />

      {/* Escena 5: Gran Cierre & Call to Action */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <Scene5CTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="SuriLearnPromo"
      component={SuriLearnVideoAd}
      durationInFrames={660}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
