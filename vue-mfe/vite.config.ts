import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'vueRemote',
      filename: 'remoteEntry.js',
      exposes: {
        './mount': './src/mount.ts',
      },
      shared: ['vue'],
    }),
  ],
  server: {
    port: 4302,
    cors: true,
  },
  preview: {
    port: 4302,
  },
  build: {
    target: 'esnext',
    modulePreload: false,
    cssCodeSplit: false,
  },
});
