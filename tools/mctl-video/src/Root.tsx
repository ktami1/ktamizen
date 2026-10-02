import React from 'react';
import {Composition, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Promo, DURATION, FPS} from './Promo';
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
    <Composition id="TicketPromo" component={TicketPromo} durationInFrames={TICKET_DURATION} fps={TICKET_FPS} width={1920} height={1080} />
  </>
);
