import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { getAppConfig } from './app-config';

type RemoteInput = {
  type: string;
  payload: Record<string, unknown>;
};

type RemoteOutput = {
  type: string;
  payload: unknown;
};

type MountOptions = {
  input?: RemoteInput;
  onOutput?: (event: RemoteOutput) => void;
};

type MountedRemote = {
  update: (next: MountOptions) => void;
  unmount: () => void;
};

type ReactRemoteModule = {
  mount: (container: HTMLElement, options?: MountOptions) => MountedRemote;
};

type FederationContainer = {
  init?: (scope: unknown) => Promise<void> | void;
  get: (module: string) => Promise<() => ReactRemoteModule>;
};

@Component({
  selector: 'app-react-remote-tab',
  templateUrl: './react-remote-tab.component.html',
  styleUrl: './react-remote-tab.component.css',
})
export class ReactRemoteTabComponent implements AfterViewInit, OnDestroy {
  remoteInput: RemoteInput = {
    type: 'set-context',
    payload: {
      message: 'hello from angular host',
      tag: 'angular-to-react',
    },
  };
  latestOutput = 'waiting output...';
  status = 'Loading React remote...';

  @ViewChild('reactContainer', { static: true })
  private reactContainer!: ElementRef<HTMLDivElement>;

  private mountedRemote?: MountedRemote;
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  async ngAfterViewInit(): Promise<void> {
    await this.mountRemote();
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
    this.mountedRemote?.unmount();
  }

  private async mountRemote(): Promise<void> {
    try {
      const container = await this.loadRemoteContainer();
      const factory = await container.get('./mount');
      const remoteModule = factory();

      this.mountedRemote = remoteModule.mount(this.reactContainer.nativeElement, {
        input: this.remoteInput,
        onOutput: (event: RemoteOutput) => {
          this.zone.run(() => {
            this.latestOutput = JSON.stringify(event);
            this.cdr.detectChanges();
          });
        },
      });

      this.zone.run(() => {
        this.status = 'React remote mounted from Module Federation';
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.zone.run(() => {
        this.status = 'Failed to load React remote';
        this.cdr.detectChanges();
      });
      console.error(error);
    }
  }

  private async loadRemoteContainer(): Promise<FederationContainer> {
    const config = getAppConfig();
    await this.injectRemoteEntryScript(config.remotes.reactPropsEntry, config.remotes.reactPropsScope);
    const container = (window as unknown as Record<string, unknown>)[config.remotes.reactPropsScope] as
      | FederationContainer
      | undefined;

    if (!container) {
      throw new Error(`${config.remotes.reactPropsScope} container not found on window`);
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
    this.mountedRemote?.update({ input: this.remoteInput });
  }
}
