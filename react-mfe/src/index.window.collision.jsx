import { mount } from './mountWindowCollision';

const rootEl = document.getElementById('root');

if (rootEl) {
  const mounted = mount(rootEl, {
    input: {
      type: 'set-context',
      payload: {
        message: 'Standalone collision window-event remote',
        tag: 'collision-standalone',
      },
    },
  });

  setTimeout(() => {
    mounted.update({
      input: {
        type: 'refresh',
        payload: {
          message: 'Updated by collision standalone bootstrap',
          tag: 'collision-timer',
        },
      },
    });
  }, 1000);
}
