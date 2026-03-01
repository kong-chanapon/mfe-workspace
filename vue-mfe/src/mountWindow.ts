import { createApp, defineComponent, h, reactive } from 'vue';
import type { MountOptions, MountedRemote, RemoteInput, RemoteOutput } from './types';

const HOST_TO_VUE_EVENT = 'mfe:host-to-vue-window';
const VUE_TO_HOST_EVENT = 'mfe:vue-window-to-host';

export function mount(container: HTMLElement, options: MountOptions = {}): MountedRemote {
  const state = reactive({
    input:
      options.input ?? {
        type: 'set-context',
        payload: { message: 'No message (window event)', tag: 'none' },
      },
    counter: 0,
  });

  const onHostEvent = (event: Event): void => {
    const custom = event as CustomEvent<RemoteInput>;
    const next = custom?.detail;

    if (!next || typeof next !== 'object') {
      return;
    }

    state.input = next;
  };

  window.addEventListener(HOST_TO_VUE_EVENT, onHostEvent as EventListener);

  const emit = (event: RemoteOutput): void => {
    window.dispatchEvent(new CustomEvent(VUE_TO_HOST_EVENT, { detail: event }));
  };

  const App = defineComponent({
    name: 'VueWindowRemoteApp',
    setup() {
      const emitAck = (): void => {
        emit({
          type: 'acknowledged',
          payload: {
            source: 'vue-window-remote',
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
            source: 'vue-window-remote',
            counter: state.counter,
          },
        });
      };

      const text = (value: unknown): string => String(value ?? '');

      return () =>
        h('div', { style: 'border: 1px solid #0ea5e9; border-radius: 10px; background: #f0f9ff; padding: 12px;' }, [
          h('h4', { style: 'margin-top: 0;' }, 'Vue Remote (Window Event + TS)'),
          h('p', { style: 'margin: 6px 0;' }, ['Input type: ', h('strong', text(state.input?.type))]),
          h('p', { style: 'margin: 6px 0;' }, ['Input message: ', h('strong', text(state.input?.payload?.message))]),
          h('p', { style: 'margin: 6px 0;' }, ['Input tag: ', h('strong', text(state.input?.payload?.tag))]),
          h('button', { type: 'button', onClick: emitAck }, 'Emit output: acknowledged'),
          h('p', { style: 'margin: 8px 0 6px;' }, ['Counter: ', h('strong', text(state.counter))]),
          h('button', { type: 'button', onClick: emitCounter }, 'Emit output: counter-changed'),
        ]);
    },
  });

  const app = createApp(App);
  app.mount(container);

  if (options.input) {
    window.dispatchEvent(new CustomEvent(HOST_TO_VUE_EVENT, { detail: options.input }));
  }

  return {
    update(next: MountOptions) {
      if (Object.prototype.hasOwnProperty.call(next, 'input') && next.input) {
        window.dispatchEvent(new CustomEvent(HOST_TO_VUE_EVENT, { detail: next.input }));
      }
    },
    unmount() {
      window.removeEventListener(HOST_TO_VUE_EVENT, onHostEvent as EventListener);
      app.unmount();
    },
  };
}
