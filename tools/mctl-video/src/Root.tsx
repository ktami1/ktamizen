import React from 'react';
import {Composition, Folder, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Promo, DURATION, FPS} from './Promo';
import {Launch} from './launch/Launch';
import {Hook} from './launch/Hook';
import {Tickets} from './launch/Tickets';
import {OldWay} from './launch/OldWay';
import {Intro} from './launch/Intro';
import {Product} from './launch/Product';
import {Resolved} from './launch/Resolved';
import {Security} from './launch/Security';
import {Outro} from './launch/Outro';
import L from './launch/timeline.json';
import {TicketPromo, TICKET_DURATION, TICKET_FPS} from './TicketPromo';

const weights: [string, string][] = [['Regular', '400'], ['Medium', '500'], ['Bold', '700'], ['Black', '900']];
for (const [name, weight] of weights) {
  loadFont({family: 'Roboto', url: staticFile(`Roboto-${name}.ttf`), weight});
}
loadFont({family: 'Mono', url: staticFile('DejaVuSansMono.ttf')});
loadFont({family: 'SysSans', url: staticFile('LiberationSans-Regular.ttf'), weight: '400'});
loadFont({family: 'SysSans', url: staticFile('LiberationSans-Bold.ttf'), weight: '700'});

export const Root: React.FC = () => (
  <>
    <Composition id="MctlPromo" component={Promo} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    <Composition id="Launch" component={Launch} durationInFrames={L.duration} fps={L.fps} width={1920} height={1080} />
    <Folder name="Launch-scene">
      <Composition id="L-Hook" component={Hook} durationInFrames={L.scenes.hook} fps={L.fps} width={1920} height={1080} />
      <Composition id="L-Tickets" component={Tickets} durationInFrames={L.scenes.tickets} fps={L.fps} width={1920} height={1080} />
      <Composition id="L-OldWay" component={OldWay} durationInFrames={L.scenes.oldWay} fps={L.fps} width={1920} height={1080} />
      <Composition id="L-Intro" component={Intro} durationInFrames={L.scenes.intro} fps={L.fps} width={1920} height={1080} />
      <Composition id="L-Product" component={Product} durationInFrames={L.scenes.product} fps={L.fps} width={1920} height={1080} />
      <Composition id="L-Resolved" component={Resolved} durationInFrames={L.scenes.resolved} fps={L.fps} width={1920} height={1080} />
      <Composition id="L-Security" component={Security} durationInFrames={L.scenes.security} fps={L.fps} width={1920} height={1080} />
      <Composition id="L-Outro" component={Outro} durationInFrames={L.scenes.outro} fps={L.fps} width={1920} height={1080} />
    </Folder>
    <Composition id="TicketPromo" component={TicketPromo} durationInFrames={TICKET_DURATION} fps={TICKET_FPS} width={1920} height={1080} />
  </>
);
