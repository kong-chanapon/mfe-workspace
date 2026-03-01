import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'vueWindowRemote',
      filename: 'remoteEntry.js',
      exposes: {
        './mount': './src/mountWindow.ts',
      },
      shared: ['vue'],
    }),
  ],
  server: {
    port: 4304,
    cors: true,
  },
  preview: {
    port: 4304,
  },
  build: {
    target: 'esnext',
    modulePreload: false,
    cssCodeSplit: false,
    outDir: 'dist-window',
    rollupOptions: {
      input: './index.window.html',
    },
  },
});
