import '@bacons/text-decoder/install';
import { registerRootComponent } from 'expo';
import { registerGlobals } from '@livekit/react-native';

// Must be called once at startup, before any LiveKit usage
registerGlobals();

console.log('[INDEX] Loading App...');

import App from './src/App';

registerRootComponent(App);