import { mount } from './mountWindow';

const rootEl = document.getElementById('root');

if (rootEl) {
  const mounted = mount(rootEl, {
    input: {
      type: 'set-context',
      payload: {
        message: 'Standalone Vue window-event remote',
        tag: 'standalone-window',
      },
    },
  });

  setTimeout(() => {
    mounted.update({
      input: {
        type: 'refresh',
        payload: {
          message: 'Updated by standalone Vue window bootstrap',
          tag: 'timer-window',
        },
      },
    });
  }, 1000);
}
