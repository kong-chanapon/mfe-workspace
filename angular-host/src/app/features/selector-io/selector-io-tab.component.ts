import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Mfe2IoDemoComponent, RemoteInput, RemoteOutput } from './mfe2-io-demo.component';

@Component({
  selector: 'app-host-selector-io-tab',
  imports: [Mfe2IoDemoComponent],
  templateUrl: './selector-io-tab.component.html',
  styleUrl: './selector-io-tab.component.css',
})
export class HostSelectorIoTabComponent {
  @Input() input: RemoteInput = {
    type: 'set-context',
    payload: {
      message: 'hello from host',
      tag: 'starter',
    },
  };
  @Output() output = new EventEmitter<RemoteOutput>();

  latestOutput = 'waiting output...';

  get currentMessage(): string {
    return String(this.input.payload['message'] ?? '');
  }

  get currentTag(): string {
    return String(this.input.payload['tag'] ?? '');
  }

  onMessageChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updatePayload({ message: value });
  }

  onTagChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updatePayload({ tag: value });
  }

  setInputType(type: string): void {
    this.input = {
      ...this.input,
      type,
    };
  }

  onRemoteOutput(event: RemoteOutput): void {
    this.latestOutput = JSON.stringify(event);
    this.output.emit(event);
  }

  private updatePayload(partialPayload: Record<string, unknown>): void {
    this.input = {
      ...this.input,
      payload: {
        ...this.input.payload,
        ...partialPayload,
      },
    };
  }
}
