import { Component, EventEmitter, Input, Output } from '@angular/core';

export type HostDemoInput = {
  type: string;
  payload: Record<string, unknown>;
};

export type HostDemoOutput = {
  type: string;
  payload: unknown;
};

@Component({
  selector: 'app-host-io-demo',
  templateUrl: './host-io-demo.component.html',
  styleUrl: './host-io-demo.component.css',
})
export class HostIoDemoComponent {
  @Input() input: HostDemoInput = {
    type: 'set-context',
    payload: { message: 'Hello from host', tag: 'local' },
  };
  @Output() output = new EventEmitter<HostDemoOutput>();

  counter = 0;

  sendAcknowledgement(): void {
    this.output.emit({
      type: 'acknowledged',
      payload: {
        source: 'host-local-component',
        message: String(this.input.payload['message'] ?? ''),
        tag: String(this.input.payload['tag'] ?? ''),
      },
    });
  }

  increaseCounter(): void {
    this.counter += 1;
    this.output.emit({
      type: 'counter-changed',
      payload: { source: 'host-local-component', counter: this.counter },
    });
  }
}
