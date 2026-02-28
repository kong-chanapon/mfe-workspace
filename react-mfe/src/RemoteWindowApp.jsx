import React from 'react';

const HOST_TO_REACT_EVENT = 'mfe:host-to-react-window';
const REACT_TO_HOST_EVENT = 'mfe:react-window-to-host';

export function RemoteWindowApp() {
  const [input, setInput] = React.useState({
    type: 'set-context',
    payload: {
      message: 'waiting host event',
      tag: 'none',
    },
  });
  const [counter, setCounter] = React.useState(0);

  React.useEffect(() => {
    const onHostEvent = (event) => {
      const next = event?.detail;
      if (!next || typeof next !== 'object') {
        return;
      }
      setInput(next);
    };

    window.addEventListener(HOST_TO_REACT_EVENT, onHostEvent);
    return () => window.removeEventListener(HOST_TO_REACT_EVENT, onHostEvent);
  }, []);

  const emitToHost = (detail) => {
    window.dispatchEvent(new CustomEvent(REACT_TO_HOST_EVENT, { detail }));
  };

  const emitAck = () => {
    emitToHost({
      type: 'acknowledged',
      payload: {
        source: 'react-window-remote',
        message: String(input?.payload?.message ?? ''),
        tag: String(input?.payload?.tag ?? ''),
        inputType: String(input?.type ?? ''),
      },
    });
  };

  const emitCounter = () => {
    const next = counter + 1;
    setCounter(next);
    emitToHost({
      type: 'counter-changed',
      payload: {
        source: 'react-window-remote',
        counter: next,
      },
    });
  };

  return (
    <div style={{ border: '1px solid #22c55e', borderRadius: '10px', background: '#f0fdf4', padding: '12px' }}>
      <h4 style={{ marginTop: 0 }}>React Remote (Window Event)</h4>
      <p style={{ margin: '6px 0' }}>Input type: <strong>{String(input?.type ?? '')}</strong></p>
      <p style={{ margin: '6px 0' }}>Input message: <strong>{String(input?.payload?.message ?? '')}</strong></p>
      <p style={{ margin: '6px 0' }}>Input tag: <strong>{String(input?.payload?.tag ?? '')}</strong></p>
      <button type="button" onClick={emitAck}>Emit output: acknowledged</button>
      <p style={{ margin: '8px 0 6px' }}>Counter: <strong>{counter}</strong></p>
      <button type="button" onClick={emitCounter}>Emit output: counter-changed</button>
    </div>
  );
}
