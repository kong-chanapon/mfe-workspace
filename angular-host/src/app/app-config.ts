export type AppRuntimeConfig = {
  remotes: {
    mfe1: string;
    mfe2: string;
    reactPropsEntry: string;
    reactPropsScope: string;
    reactWindowEntry: string;
    reactWindowScope: string;
    vueEntry: string;
  };
};

export const DEFAULT_APP_CONFIG: AppRuntimeConfig = {
  remotes: {
    mfe1: 'http://localhost:4201/remoteEntry.json',
    mfe2: 'http://localhost:4202/remoteEntry.json',
    reactPropsEntry: 'http://localhost:4300/remoteEntry.js',
    reactPropsScope: 'reactRemote',
    reactWindowEntry: 'http://localhost:4301/remoteEntry.js',
    reactWindowScope: 'reactWindowRemote',
    vueEntry: 'http://localhost:4302/assets/remoteEntry.js',
  },
};

type RuntimeWindow = Window & {
  __APP_CONFIG__?: AppRuntimeConfig;
};

const readString = (value: unknown, fallback: string): string => (typeof value === 'string' && value.trim() ? value : fallback);

export const normalizeAppConfig = (value: unknown): AppRuntimeConfig => {
  if (!value || typeof value !== 'object') {
    return DEFAULT_APP_CONFIG;
  }

  const raw = value as { remotes?: Record<string, unknown> };
  const remotes = raw.remotes ?? {};

  return {
    remotes: {
      mfe1: readString(remotes['mfe1'], DEFAULT_APP_CONFIG.remotes.mfe1),
      mfe2: readString(remotes['mfe2'], DEFAULT_APP_CONFIG.remotes.mfe2),
      reactPropsEntry: readString(remotes['reactPropsEntry'], DEFAULT_APP_CONFIG.remotes.reactPropsEntry),
      reactPropsScope: readString(remotes['reactPropsScope'], DEFAULT_APP_CONFIG.remotes.reactPropsScope),
      reactWindowEntry: readString(remotes['reactWindowEntry'], DEFAULT_APP_CONFIG.remotes.reactWindowEntry),
      reactWindowScope: readString(remotes['reactWindowScope'], DEFAULT_APP_CONFIG.remotes.reactWindowScope),
      vueEntry: readString(remotes['vueEntry'], DEFAULT_APP_CONFIG.remotes.vueEntry),
    },
  };
};

export const setAppConfig = (config: AppRuntimeConfig): void => {
  (window as RuntimeWindow).__APP_CONFIG__ = config;
};

export const getAppConfig = (): AppRuntimeConfig => {
  return (window as RuntimeWindow).__APP_CONFIG__ ?? DEFAULT_APP_CONFIG;
};
