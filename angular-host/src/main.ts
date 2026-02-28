import { initFederation } from '@angular-architects/native-federation';
import { DEFAULT_APP_CONFIG, normalizeAppConfig, setAppConfig } from './app/app-config';

const loadRuntimeConfig = async () => {
  try {
    const response = await fetch('/environment.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load /environment.json (status: ${response.status})`);
    }
    const data = await response.json();
    return normalizeAppConfig(data);
  } catch (error) {
    console.warn('Using default runtime config:', error);
    return DEFAULT_APP_CONFIG;
  }
};

const bootstrap = async () => {
  const config = await loadRuntimeConfig();
  setAppConfig(config);

  await initFederation({
    mfe1: config.remotes.mfe1,
    mfe2: config.remotes.mfe2,
  });

  await import('./bootstrap');
};

bootstrap().catch((err) => console.error(err));
