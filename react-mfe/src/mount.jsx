import React from 'react';
import { createRoot } from 'react-dom/client';
import { RemoteApp } from './RemoteApp';

export function mount(container, options = {}) {
  const root = createRoot(container);

  let currentInput = options.input ?? { type: 'set-context', payload: {} };
  let currentOnOutput = options.onOutput;

  const render = () => {
    root.render(<RemoteApp input={currentInput} onOutput={currentOnOutput} />);
  };

  render();

  return {
    update(next = {}) {
      if (Object.prototype.hasOwnProperty.call(next, 'input')) {
        currentInput = next.input;
      }
      if (Object.prototype.hasOwnProperty.call(next, 'onOutput')) {
        currentOnOutput = next.onOutput;
      }
      render();
    },
    unmount() {
      root.unmount();
    },
  };
}
