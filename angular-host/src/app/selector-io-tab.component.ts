import { Component } from '@angular/core';
import { HostDemoInput, HostDemoOutput, HostIoDemoComponent } from './host-io-demo.component';

@Component({
  selector: 'app-selector-io-tab',
  imports: [HostIoDemoComponent],
  templateUrl: './selector-io-tab.component.html',
  styleUrl: './selector-io-tab.component.css',
})
export class SelectorIoTabComponent {
  demoInput: HostDemoInput = {
    type: 'set-context',
    payload: {
      message: 'hello from host',
      tag: 'starter',
    },
  };
  latestOutput = 'waiting output...';

  get currentMessage(): string {
    return String(this.demoInput.payload['message'] ?? '');
  }

  get currentTag(): string {
    return String(this.demoInput.payload['tag'] ?? '');
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
    this.demoInput = {
      ...this.demoInput,
      type,
    };
  }

  onRemoteOutput(event: HostDemoOutput): void {
    this.latestOutput = JSON.stringify(event);
  }

  private updatePayload(partialPayload: Record<string, unknown>): void {
    this.demoInput = {
      ...this.demoInput,
      payload: {
        ...this.demoInput.payload,
        ...partialPayload,
      },
    };
  }
}
