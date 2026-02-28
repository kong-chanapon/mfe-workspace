import { mount } from './mount';

const rootEl = document.getElementById('root');

if (rootEl) {
  mount(rootEl, {
    input: {
      type: 'set-context',
      payload: {
        message: 'Standalone React remote',
        tag: 'standalone',
      },
    },
    onOutput: (event) => {
      console.log('React remote output:', event);
    },
  });
}
