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
  selector: 'app-mfe-react-window-collision-tab',
  templateUrl: './react-window-collision-tab.component.html',
  styleUrl: './react-window-collision-tab.component.css',
})
export class MfeReactWindowCollisionTabComponent implements AfterViewInit, OnDestroy {
  private remoteInput: RemoteInput = {
    type: 'set-context',
    payload: {
      message: 'hello from angular host (shared channel)',
      tag: 'window-event-collision',
    },
  };

  @Output() output = new EventEmitter<RemoteOutput>();

  @Input('input') set input(value: RemoteInput) {
    if (!value) {
      return;
    }
    this.remoteInput = value;
    this.pushInputToRemotes();
  }

  latestOutput = 'waiting output...';
  eventLog: string[] = [];
  status = 'Loading two React remotes on same window event channel...';

  @ViewChild('reactWindowContainer', { static: true })
  private reactWindowContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('reactWindowCollisionContainer', { static: true })
  private reactWindowCollisionContainer!: ElementRef<HTMLDivElement>;

  private mountedRemotes: MountedRemote[] = [];
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly onReactOutput = (event: Event): void => {
    const custom = event as CustomEvent<RemoteOutput>;
    this.zone.run(() => {
      this.latestOutput = JSON.stringify(custom.detail);
      this.output.emit(custom.detail);
      const source = this.readSource(custom.detail);
      this.eventLog = [`${source}: ${this.latestOutput}`, ...this.eventLog].slice(0, 8);
      this.cdr.detectChanges();
    });
  };

  async ngAfterViewInit(): Promise<void> {
    window.addEventListener(REACT_TO_HOST_EVENT, this.onReactOutput as EventListener);
    await this.mountBothRemotes();
    this.pushInputToRemotes();
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
    this.pushInputToRemotes();
  }

  get currentMessage(): string {
    return String(this.remoteInput.payload['message'] ?? '');
  }

  get currentTag(): string {
    return String(this.remoteInput.payload['tag'] ?? '');
  }

  ngOnDestroy(): void {
    window.removeEventListener(REACT_TO_HOST_EVENT, this.onReactOutput as EventListener);
    this.mountedRemotes.forEach((remote) => remote.unmount());
  }

  private async mountBothRemotes(): Promise<void> {
    const config = getAppConfig();

    try {
      const mountedPrimary = await this.mountRemoteInto(
        config.remotes.reactWindowEntry,
        config.remotes.reactWindowScope,
        this.reactWindowContainer.nativeElement,
      );
      this.mountedRemotes.push(mountedPrimary);

      const mountedCollision = await this.mountRemoteInto(
        config.remotes.reactWindowCollisionEntry,
        config.remotes.reactWindowCollisionScope,
        this.reactWindowCollisionContainer.nativeElement,
      );
      this.mountedRemotes.push(mountedCollision);

      this.zone.run(() => {
        this.status = 'Both remotes mounted on shared channel (collision mode)';
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.zone.run(() => {
        this.status = 'Failed to load one of the shared-channel remotes';
        this.cdr.detectChanges();
      });
      console.error(error);
    }
  }

  private async mountRemoteInto(entry: string, scope: string, containerElement: HTMLElement): Promise<MountedRemote> {
    const container = await this.loadRemoteContainer(entry, scope);
    const factory = await container.get('./mount');
    const remoteModule = factory();

    return remoteModule.mount(containerElement, {
      input: this.remoteInput,
    });
  }

  private async loadRemoteContainer(entry: string, scope: string): Promise<FederationContainer> {
    await this.injectRemoteEntryScript(entry, scope);
    const container = (window as unknown as Record<string, unknown>)[scope] as FederationContainer | undefined;

    if (!container) {
      throw new Error(`${scope} container not found on window`);
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
    this.pushInputToRemotes();
  }

  private pushInputToRemotes(): void {
    window.dispatchEvent(new CustomEvent(HOST_TO_REACT_EVENT, { detail: this.remoteInput }));
  }

  private readSource(output: RemoteOutput): string {
    if (!output || typeof output !== 'object') {
      return 'unknown-source';
    }

    const payload = output.payload;
    if (!payload || typeof payload !== 'object') {
      return 'unknown-source';
    }

    const source = (payload as Record<string, unknown>)['source'];
    return typeof source === 'string' && source.trim() ? source : 'unknown-source';
  }
}
