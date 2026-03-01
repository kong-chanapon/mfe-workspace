import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactAxElementApp } from './ReactAxElementApp';

const TAG_NAME = 'ma-react-ax-remote';

class MaReactAxRemote extends HTMLElement {
  constructor() {
    super();
    this._input = {
      type: 'set-context',
      payload: {
        message: 'waiting host input',
        tag: 'none',
      },
    };
    this._onOutput = this._onOutput.bind(this);
    this.attachShadow({ mode: 'open' });
    this._root = createRoot(this.shadowRoot);
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    this._root.unmount();
  }

  set input(value) {
    if (!value || typeof value !== 'object') {
      return;
    }

    this._input = value;
    this._render();
  }

  get input() {
    return this._input;
  }

  refresh() {
    this._onOutput({
      type: 'acknowledged',
      payload: {
        source: 'react-ax-lazy-element',
        message: String(this._input?.payload?.message ?? ''),
        tag: String(this._input?.payload?.tag ?? ''),
        inputType: String(this._input?.type ?? ''),
      },
    });
  }

  _onOutput(detail) {
    this.dispatchEvent(
      new CustomEvent('remoteOutput', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  _render() {
    this._root.render(<ReactAxElementApp input={this._input} onOutput={this._onOutput} />);
  }
}

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, MaReactAxRemote);
}
