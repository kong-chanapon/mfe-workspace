import React from 'react';
import { createRoot } from 'react-dom/client';
import { RemoteWindowApp } from './RemoteWindowApp';

const HOST_TO_REACT_EVENT = 'mfe:host-to-react-window';

export function mount(container, options = {}) {
  const root = createRoot(container);
  root.render(<RemoteWindowApp />);

  if (options.input) {
    window.dispatchEvent(new CustomEvent(HOST_TO_REACT_EVENT, { detail: options.input }));
  }

  return {
    update(next = {}) {
      if (Object.prototype.hasOwnProperty.call(next, 'input')) {
        window.dispatchEvent(new CustomEvent(HOST_TO_REACT_EVENT, { detail: next.input }));
      }
    },
    unmount() {
      root.unmount();
    },
  };
}
