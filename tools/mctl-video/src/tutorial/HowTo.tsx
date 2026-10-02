import React from 'react';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {Audio} from '@remotion/media';
import {staticFile, useVideoConfig} from 'remotion';
import {TitleCard} from './TitleCard';
import {Steps} from './Steps';
import {EndCard} from './EndCard';

// Tutorial di 20 secondi: come si usa Password Operatori (durate in timeline.json).
export const HowTo: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Titolo" durationInFrames={60} premountFor={fps}>
          <TitleCard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
        <TransitionSeries.Sequence name="Passi" durationInFrames={480} premountFor={fps}>
          <Steps />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
        <TransitionSeries.Sequence name="Fine" durationInFrames={90} premountFor={fps}>
          <EndCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio src={staticFile('howto-music.wav')} />
    </>
  );
};
