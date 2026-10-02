import React from 'react';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {Audio} from '@remotion/media';
import {staticFile, useVideoConfig} from 'remotion';
import {Hook} from './Hook';
import {Tickets} from './Tickets';
import {OldWay} from './OldWay';
import {Intro} from './Intro';
import {Product} from './Product';
import {Resolved} from './Resolved';
import {Security} from './Security';
import {Outro} from './Outro';
import {LeakOverlay} from './LeakOverlay';

// Video di lancio di Password Operatori: 30 s, 1920x1080, 30 fps (durate in timeline.json).
export const Launch: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Hook" durationInFrames={105} premountFor={fps}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
        <TransitionSeries.Sequence name="Ticket" durationInFrames={120} premountFor={fps}>
          <Tickets />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
        <TransitionSeries.Sequence name="Prima" durationInFrames={90} premountFor={fps}>
          <OldWay />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={30} premountFor={fps}>
          <LeakOverlay seed={3} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence name="Presentiamo" durationInFrames={105} premountFor={fps}>
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
        <TransitionSeries.Sequence name="Prodotto" durationInFrames={210} premountFor={fps}>
          <Product />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
        <TransitionSeries.Sequence name="Ticket chiuso" durationInFrames={120} premountFor={fps}>
          <Resolved />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
        <TransitionSeries.Sequence name="Sicurezza" durationInFrames={135} premountFor={fps}>
          <Security />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={30} premountFor={fps}>
          <LeakOverlay seed={7} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence name="Chiusura" durationInFrames={90} premountFor={fps}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio src={staticFile('launch-music.wav')} />
    </>
  );
};
