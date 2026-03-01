(function () {
  const TAG_NAME = 'ma-demo-web-remote';

  if (customElements.get(TAG_NAME)) {
    return;
  }

  class MaDemoWebRemote extends HTMLElement {
    constructor() {
      super();
      this._input = {
        type: 'set-context',
        payload: {
          message: 'waiting host input',
          tag: 'none',
        },
      };
      this._counter = 0;
      this._onClick = this._onClick.bind(this);
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.shadowRoot.addEventListener('click', this._onClick);
      this._render();
    }

    disconnectedCallback() {
      this.shadowRoot.removeEventListener('click', this._onClick);
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
      this._emit('acknowledged');
    }

    _onClick(event) {
      const target = event.target;
      const action = target && target.dataset ? target.dataset.action : '';

      if (action === 'ack') {
        this._emit('acknowledged');
      }

      if (action === 'counter') {
        this._counter += 1;
        this._render();
        this._emit('counter-changed');
      }
    }

    _emit(type) {
      const message = String((this._input && this._input.payload && this._input.payload.message) || '');
      const tag = String((this._input && this._input.payload && this._input.payload.tag) || '');

      const detail =
        type === 'counter-changed'
          ? {
              type,
              payload: {
                source: 'ma-demo-web-remote',
                counter: this._counter,
              },
            }
          : {
              type,
              payload: {
                source: 'ma-demo-web-remote',
                message,
                tag,
                inputType: String((this._input && this._input.type) || ''),
              },
            };

      this.dispatchEvent(
        new CustomEvent('remoteOutput', {
          detail,
          bubbles: true,
          composed: true,
        }),
      );
    }

    _render() {
      const message = String((this._input && this._input.payload && this._input.payload.message) || '');
      const tag = String((this._input && this._input.payload && this._input.payload.tag) || '');
      const type = String((this._input && this._input.type) || '');

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: Arial, sans-serif;
          }
          .card {
            border: 1px solid #0f766e;
            border-radius: 10px;
            background: #f0fdfa;
            padding: 12px;
          }
          h4 {
            margin: 0 0 8px;
            color: #134e4a;
          }
          p {
            margin: 6px 0;
            color: #0f172a;
          }
          button {
            margin-top: 8px;
            margin-right: 8px;
            border: 1px solid #0f766e;
            border-radius: 8px;
            background: #ffffff;
            color: #115e59;
            padding: 6px 10px;
            cursor: pointer;
          }
        </style>

        <div class="card">
          <h4>Web Component Remote (Runtime Script)</h4>
          <p>Input type: <strong>${type}</strong></p>
          <p>Input message: <strong>${message}</strong></p>
          <p>Input tag: <strong>${tag}</strong></p>
          <p>Counter: <strong>${this._counter}</strong></p>
          <button type="button" data-action="ack">Emit output: acknowledged</button>
          <button type="button" data-action="counter">Emit output: counter-changed</button>
        </div>
      `;
    }
  }

  customElements.define(TAG_NAME, MaDemoWebRemote);
})();
