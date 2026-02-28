import { createApp, defineComponent, h, reactive } from 'vue';
import type { MountOptions, MountedRemote, RemoteOutput } from './types';

export function mount(container: HTMLElement, options: MountOptions = {}): MountedRemote {
  const state = reactive({
    input:
      options.input ?? {
        type: 'set-context',
        payload: { message: 'No message', tag: 'none' },
      },
    counter: 0,
  });

  let onOutput = options.onOutput;

  const App = defineComponent({
    name: 'VueRemoteApp',
    setup() {
      const emit = (event: RemoteOutput): void => {
        if (typeof onOutput === 'function') {
          onOutput(event);
        }
      };

      const emitAck = (): void => {
        emit({
          type: 'acknowledged',
          payload: {
            source: 'vue-remote',
            message: String(state.input?.payload?.message ?? ''),
            tag: String(state.input?.payload?.tag ?? ''),
            inputType: String(state.input?.type ?? ''),
          },
        });
      };

      const emitCounter = (): void => {
        state.counter += 1;
        emit({
          type: 'counter-changed',
          payload: {
            source: 'vue-remote',
            counter: state.counter,
          },
        });
      };

      const text = (value: unknown): string => String(value ?? '');

      return () =>
        h('div', { style: 'border: 1px solid #f59e0b; border-radius: 10px; background: #fffbeb; padding: 12px;' }, [
          h('h4', { style: 'margin-top: 0;' }, 'Vue Remote (Vite + TS)'),
          h('p', { style: 'margin: 6px 0;' }, ['Input type: ', h('strong', text(state.input?.type))]),
          h('p', { style: 'margin: 6px 0;' }, ['Input message: ', h('strong', text(state.input?.payload?.['message']))]),
          h('p', { style: 'margin: 6px 0;' }, ['Input tag: ', h('strong', text(state.input?.payload?.['tag']))]),
          h('button', { type: 'button', onClick: emitAck }, 'Emit output: acknowledged'),
          h('p', { style: 'margin: 8px 0 6px;' }, ['Counter: ', h('strong', text(state.counter))]),
          h('button', { type: 'button', onClick: emitCounter }, 'Emit output: counter-changed'),
        ]);
    },
  });

  const app = createApp(App);
  app.mount(container);

  return {
    update(next: MountOptions = {}) {
      if (Object.prototype.hasOwnProperty.call(next, 'input') && next.input) {
        state.input = next.input;
      }
      if (Object.prototype.hasOwnProperty.call(next, 'onOutput')) {
        onOutput = next.onOutput;
      }
    },
    unmount() {
      app.unmount();
    },
  };
}
