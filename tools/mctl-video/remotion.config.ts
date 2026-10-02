import {Config} from '@remotion/cli/config';

// Gli effetti di @remotion/effects (light leak) usano WebGL2.
Config.setChromiumOpenGlRenderer('angle');
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
