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

type MountFn = (container: HTMLElement, options?: MountOptions) => MountedRemote;

type VueRemoteModule = {
  mount: MountFn;
  default?: VueRemoteModule | MountFn;
};

type FederationContainer = {
  init?: (scope: unknown) => Promise<void> | void;
  get: (module: string) => Promise<() => Promise<VueRemoteModule | MountFn> | VueRemoteModule | MountFn>;
};

@Component({
  selector: 'app-vue-remote-tab',
  templateUrl: './vue-remote-tab.component.html',
  styleUrl: './vue-remote-tab.component.css',
})
export class VueRemoteTabComponent implements AfterViewInit, OnDestroy {
  remoteInput: RemoteInput = {
    type: 'set-context',
    payload: {
      message: 'hello from angular host',
      tag: 'angular-to-vue',
    },
  };
  latestOutput = 'waiting output...';
  status = 'Loading Vue remote...';

  @ViewChild('vueContainer', { static: true })
  private vueContainer!: ElementRef<HTMLDivElement>;

  private mountedRemote?: MountedRemote;
  private remoteContainerPromise?: Promise<FederationContainer>;
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
      const remoteFactoryResult = await Promise.resolve(factory());
      const mount = this.resolveMountFunction(remoteFactoryResult);

      this.mountedRemote = mount(this.vueContainer.nativeElement, {
        input: this.remoteInput,
        onOutput: (event: RemoteOutput) => {
          this.zone.run(() => {
            this.latestOutput = JSON.stringify(event);
            this.cdr.detectChanges();
          });
        },
      });

      this.zone.run(() => {
        this.status = 'Vue remote mounted from Module Federation';
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.zone.run(() => {
        this.status = 'Failed to load Vue remote';
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
        const entryModule = (await dynamicImport(config.remotes.vueEntry)) as FederationContainer;

        const container = (entryModule as unknown as { default?: FederationContainer }).default ?? entryModule;
        if (!container || typeof container.get !== 'function') {
          throw new Error('Invalid vue federation container');
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

    throw new Error('Vue remote does not expose a valid mount function');
  }
}
