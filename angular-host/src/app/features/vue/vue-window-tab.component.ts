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

type MountOptions = {
  input?: RemoteInput;
};

type MountedRemote = {
  update: (next: MountOptions) => void;
  unmount: () => void;
};

type MountFn = (container: HTMLElement, options?: MountOptions) => MountedRemote;

type VueRemoteModule = {
  mount: MountFn;
  default?: VueRemoteModule | MountFn;
};

type FederationContainer = {
  init?: (scope: unknown) => Promise<void> | void;
  get: (module: string) => Promise<() => Promise<VueRemoteModule | MountFn> | VueRemoteModule | MountFn>;
};

const HOST_TO_VUE_EVENT = 'mfe:host-to-vue-window';
const VUE_TO_HOST_EVENT = 'mfe:vue-window-to-host';

@Component({
  selector: 'app-mfe-vue-window-tab',
  templateUrl: './vue-window-tab.component.html',
  styleUrl: './vue-window-tab.component.css',
})
export class MfeVueWindowTabComponent implements AfterViewInit, OnDestroy {
  private remoteInput: RemoteInput = {
    type: 'set-context',
    payload: {
      message: 'hello from angular host',
      tag: 'angular-to-vue-window',
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
  status = 'Loading Vue window-event remote...';

  @ViewChild('vueContainer', { static: true })
  private vueContainer!: ElementRef<HTMLDivElement>;

  private mountedRemote?: MountedRemote;
  private remoteContainerPromise?: Promise<FederationContainer>;
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly onVueOutput = (event: Event): void => {
    const custom = event as CustomEvent<RemoteOutput>;

    this.zone.run(() => {
      this.latestOutput = JSON.stringify(custom.detail);
      this.output.emit(custom.detail);
      this.cdr.detectChanges();
    });
  };

  async ngAfterViewInit(): Promise<void> {
    window.addEventListener(VUE_TO_HOST_EVENT, this.onVueOutput as EventListener);
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
    window.removeEventListener(VUE_TO_HOST_EVENT, this.onVueOutput as EventListener);
    this.mountedRemote?.unmount();
  }

  private async mountRemote(): Promise<void> {
    try {
      const container = await this.loadRemoteContainer();
      const factory = await container.get('./mount');
      const remoteFactoryResult = await Promise.resolve(factory());
      const mount = this.resolveMountFunction(remoteFactoryResult);

      this.mountedRemote = mount(this.vueContainer.nativeElement, {
        input: this.remoteInput,
      });

      this.zone.run(() => {
        this.status = 'Vue window-event remote mounted from Module Federation';
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.zone.run(() => {
        this.status = 'Failed to load Vue window-event remote';
        this.cdr.detectChanges();
      });
      console.error(error);
    }
  }

  private async loadRemoteContainer(): Promise<FederationContainer> {
    if (!this.remoteContainerPromise) {
      this.remoteContainerPromise = (async () => {
        const config = getAppConfig();
        const dynamicImport = new Function('u', 'return import(u)') as (url: string) => Promise<unknown>;
        const entryModule = (await dynamicImport(config.remotes.vueWindowEntry)) as FederationContainer;

        const container = (entryModule as unknown as { default?: FederationContainer }).default ?? entryModule;
        if (!container || typeof container.get !== 'function') {
          throw new Error('Invalid vue window federation container');
        }

        if (typeof container.init === 'function') {
          try {
            await container.init({});
          } catch {
            // ignore re-init error
          }
        }

        return container;
      })();
    }

    return this.remoteContainerPromise;
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
    window.dispatchEvent(new CustomEvent(HOST_TO_VUE_EVENT, { detail: this.remoteInput }));
  }

  private resolveMountFunction(remoteModule: VueRemoteModule | MountFn): MountFn {
    if (typeof remoteModule === 'function') {
      return remoteModule;
    }

    if (typeof remoteModule.mount === 'function') {
      return remoteModule.mount;
    }

    const fallback = remoteModule.default;
    if (typeof fallback === 'function') {
      return fallback;
    }
    if (fallback && typeof fallback === 'object' && typeof fallback.mount === 'function') {
      return fallback.mount;
    }

    throw new Error('Vue window remote does not expose a valid mount function');
  }
}
