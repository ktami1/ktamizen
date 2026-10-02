import React from 'react';
import {lightLeak} from '@remotion/effects/light-leak';
import {interpolate, Solid, useCurrentFrame, useVideoConfig} from 'remotion';

// Light leak caldo (hueShift 20 = arancione Terya) sopra un taglio.
export const LeakOverlay: React.FC<{seed?: number; hueShift?: number}> = ({seed = 3, hueShift = 20}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, height, width} = useVideoConfig();
  return (
    <Solid
      width={width}
      height={height}
      effects={[
        lightLeak({
          seed,
          hueShift,
          progress: interpolate(frame, [0, durationInFrames - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }),
      ]}
    />
  );
};
