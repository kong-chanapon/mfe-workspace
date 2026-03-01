import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { getAppConfig } from '../../core/runtime-config';

type RemoteInput = {
  type: string;
  payload: Record<string, unknown>;
};

type RemoteOutput = {
  type: string;
  payload: unknown;
};

type MountedRemote = {
  update?: (next: { input?: RemoteInput }) => void;
  unmount: () => void;
};

type ReactRemoteModule = {
  mount: (container: HTMLElement, options?: { input?: RemoteInput }) => MountedRemote;
};

type FederationContainer = {
  init?: (scope: unknown) => Promise<void> | void;
  get: (module: string) => Promise<() => ReactRemoteModule>;
};

const HOST_TO_REACT_EVENT = 'mfe:host-to-react-window';
const REACT_TO_HOST_EVENT = 'mfe:react-window-to-host';

@Component({
  selector: 'app-mfe-react-window-tab',
  templateUrl: './react-window-tab.component.html',
  styleUrl: './react-window-tab.component.css',
})
export class MfeReactWindowTabComponent implements AfterViewInit, OnDestroy {
  private remoteInput: RemoteInput = {
    type: 'set-context',
    payload: {
      message: 'hello from angular host',
      tag: 'window-event',
    },
  };
  @Output() output = new EventEmitter<RemoteOutput>();

  @Input('input') set input(value: RemoteInput) {
    if (!value) {
      return;
    }
    this.remoteInput = value;
    this.pushInputToRemote();
  }

  latestOutput = 'waiting output...';
  status = 'Loading React window-event remote...';

  @ViewChild('reactContainer', { static: true })
  private reactContainer!: ElementRef<HTMLDivElement>;

  private mountedRemote?: MountedRemote;
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly onReactOutput = (event: Event): void => {
    const custom = event as CustomEvent<RemoteOutput>;
    this.zone.run(() => {
      this.latestOutput = JSON.stringify(custom.detail);
      this.output.emit(custom.detail);
      this.cdr.detectChanges();
    });
  };

  async ngAfterViewInit(): Promise<void> {
    window.addEventListener(REACT_TO_HOST_EVENT, this.onReactOutput as EventListener);
    await this.mountRemote();
    this.pushInputToRemote();
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
    this.remoteInput = {
      ...this.remoteInput,
      type,
    };
    this.pushInputToRemote();
  }

  get currentMessage(): string {
    return String(this.remoteInput.payload['message'] ?? '');
  }

  get currentTag(): string {
    return String(this.remoteInput.payload['tag'] ?? '');
  }

  ngOnDestroy(): void {
    window.removeEventListener(REACT_TO_HOST_EVENT, this.onReactOutput as EventListener);
    this.mountedRemote?.unmount();
  }

  private async mountRemote(): Promise<void> {
    try {
      const container = await this.loadRemoteContainer();
      const factory = await container.get('./mount');
      const remoteModule = factory();

      this.mountedRemote = remoteModule.mount(this.reactContainer.nativeElement, {
        input: this.remoteInput,
      });

      this.zone.run(() => {
        this.status = 'React window-event remote mounted';
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.zone.run(() => {
        this.status = 'Failed to load React window-event remote';
        this.cdr.detectChanges();
      });
      console.error(error);
    }
  }

  private async loadRemoteContainer(): Promise<FederationContainer> {
    const config = getAppConfig();
    await this.injectRemoteEntryScript(config.remotes.reactWindowEntry, config.remotes.reactWindowScope);
    const container = (window as unknown as Record<string, unknown>)[config.remotes.reactWindowScope] as
      | FederationContainer
      | undefined;

    if (!container) {
      throw new Error(`${config.remotes.reactWindowScope} container not found on window`);
    }

    if (typeof container.init === 'function') {
      try {
        await container.init({});
      } catch {
        // ignore re-init error
      }
    }

    return container;
  }

  private injectRemoteEntryScript(src: string, scope: string): Promise<void> {
    const existing = document.querySelector(`script[data-remote-scope="${scope}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((window as unknown as Record<string, unknown>)[scope]) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      script.async = true;
      script.dataset['remoteScope'] = scope;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  private updatePayload(partialPayload: Record<string, unknown>): void {
    this.remoteInput = {
      ...this.remoteInput,
      payload: {
        ...this.remoteInput.payload,
        ...partialPayload,
      },
    };
    this.pushInputToRemote();
  }

  private pushInputToRemote(): void {
    this.mountedRemote?.update?.({ input: this.remoteInput });
    window.dispatchEvent(new CustomEvent(HOST_TO_REACT_EVENT, { detail: this.remoteInput }));
  }
}
