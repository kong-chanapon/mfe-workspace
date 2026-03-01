import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { LazyElementsModule } from '@angular-extensions/elements';

type RemoteInput = {
  type: string;
  payload: Record<string, unknown>;
};

type RemoteOutput = {
  type: string;
  payload: unknown;
};

type DemoRemoteElement = HTMLElement & {
  input?: RemoteInput;
  refresh?: () => void;
};

@Component({
  selector: 'app-mfe-ax-lazy-element-tab',
  imports: [LazyElementsModule],
  templateUrl: './mfe-ax-lazy-element-tab.component.html',
  styleUrl: './mfe-ax-lazy-element-tab.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MfeAxLazyElementTabComponent {
  @Output() output = new EventEmitter<RemoteOutput>();

  @Input('input') set input(value: RemoteInput) {
    if (!value) {
      return;
    }

    this.remoteInput = value;
  }

  @ViewChild('remoteElement')
  private remoteElementRef?: ElementRef<DemoRemoteElement>;

  readonly remoteUrl = '/remotes/ma-demo-web-remote.js';

  remoteInput: RemoteInput = {
    type: 'set-context',
    payload: {
      message: 'hello from angular host (axLazyElement)',
      tag: 'angular-to-web-component-ax',
    },
  };

  latestOutput = 'waiting output...';
  status = 'Waiting lazy element script...';

  onMessageChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updatePayload({ message: value });
  }

  onTagChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updatePayload({ tag: value });
  }

  setInputType(type: string): void {
    this.remoteInput = {
      ...this.remoteInput,
      type,
    };
  }

  forceRemoteRefresh(): void {
    this.remoteElementRef?.nativeElement.refresh?.();
  }

  onRemoteOutput(event: Event): void {
    const custom = event as CustomEvent<RemoteOutput>;
    const detail = custom.detail;

    if (!detail) {
      return;
    }

    this.latestOutput = JSON.stringify(detail);
    this.output.emit(detail);
  }

  onLazyLoaded = (): void => {
    this.status = 'Loaded by *axLazyElement and custom element is ready';
  };

  onLazyError = (_error: ErrorEvent): void => {
    this.status = 'Failed to load script by *axLazyElement';
  };

  get currentMessage(): string {
    return String(this.remoteInput.payload['message'] ?? '');
  }

  get currentTag(): string {
    return String(this.remoteInput.payload['tag'] ?? '');
  }

  private updatePayload(partialPayload: Record<string, unknown>): void {
    this.remoteInput = {
      ...this.remoteInput,
      payload: {
        ...this.remoteInput.payload,
        ...partialPayload,
      },
    };
  }
}
