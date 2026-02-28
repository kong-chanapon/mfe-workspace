import { mount } from './mountWindow';

const rootEl = document.getElementById('root');

if (rootEl) {
  const mounted = mount(rootEl, {
    input: {
      type: 'set-context',
      payload: {
        message: 'Standalone window-event remote',
        tag: 'standalone',
      },
    },
  });

  setTimeout(() => {
    mounted.update({
      input: {
        type: 'refresh',
        payload: {
          message: 'Updated by standalone bootstrap',
          tag: 'timer',
        },
      },
    });
  }, 1000);
}
