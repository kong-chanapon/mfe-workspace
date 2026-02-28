import { Component, EventEmitter, Input, Output } from '@angular/core';

type RemoteInput = {
  type: string;
  payload: {
    message?: string;
    tag?: string;
  };
};

type RemoteOutput = {
  type: string;
  payload: unknown;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  @Input() input: RemoteInput = {
    type: 'set-context',
    payload: {
      message: 'No message from host yet',
      tag: 'No tag from host yet',
    },
  };
  @Output() output = new EventEmitter<RemoteOutput>();

  counter = 0;

  sendAcknowledgement(): void {
    this.output.emit({
      type: 'acknowledged',
      payload: {
        message: this.input.payload.message ?? '',
        tag: this.input.payload.tag ?? '',
      },
    });
  }

  increaseCounter(): void {
    this.counter += 1;
    this.output.emit({
      type: 'counter-changed',
      payload: {
        counter: this.counter,
      },
    });
  }
}
