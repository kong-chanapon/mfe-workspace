import { mount } from './mount';

const rootEl = document.getElementById('root');

if (rootEl) {
  mount(rootEl, {
    input: {
      type: 'set-context',
      payload: {
        message: 'Standalone Vue remote (Vite + TS)',
        tag: 'standalone',
      },
    },
    onOutput: (event) => {
      console.log('Vue remote output:', event);
    },
  });
}
