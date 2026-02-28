import React from 'react';

export function RemoteApp({ input, onOutput }) {
  const message = String(input?.payload?.message ?? '');
  const tag = String(input?.payload?.tag ?? '');
  const type = String(input?.type ?? 'set-context');
  const [counter, setCounter] = React.useState(0);

  const emitAck = () => {
    onOutput?.({
      type: 'acknowledged',
      payload: {
        source: 'react-remote',
        message,
        tag,
        inputType: type,
      },
    });
  };

  const emitCounter = () => {
    const next = counter + 1;
    setCounter(next);
    onOutput?.({
      type: 'counter-changed',
      payload: {
        source: 'react-remote',
        counter: next,
      },
    });
  };

  return (
    <div style={{ border: '1px solid #fca5a5', borderRadius: '10px', background: '#fef2f2', padding: '12px' }}>
      <h4 style={{ marginTop: 0 }}>React Remote (Module Federation)</h4>
      <p style={{ margin: '6px 0' }}>Input type: <strong>{type}</strong></p>
      <p style={{ margin: '6px 0' }}>Input message: <strong>{message}</strong></p>
      <p style={{ margin: '6px 0' }}>Input tag: <strong>{tag}</strong></p>
      <button type="button" onClick={emitAck}>Emit output: acknowledged</button>
      <p style={{ margin: '8px 0 6px' }}>Counter: <strong>{counter}</strong></p>
      <button type="button" onClick={emitCounter}>Emit output: counter-changed</button>
    </div>
  );
}
