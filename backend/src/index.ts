import { createApp } from './app';
import { env,assertSecrets } from './config/env';
assertSecrets();
createApp().listen(env.port,'0.0.0.0',()=>console.log(`Ciko API: порт ${env.port}`));
