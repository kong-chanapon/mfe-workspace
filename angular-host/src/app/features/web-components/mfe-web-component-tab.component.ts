import {
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';

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
  selector: 'app-mfe-web-component-tab',
  templateUrl: './mfe-web-component-tab.component.html',
  styleUrl: './mfe-web-component-tab.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MfeWebComponentTabComponent implements AfterViewInit, OnDestroy {
  private remoteInput: RemoteInput = {
    type: 'set-context',
    payload: {
      message: 'hello from angular host',
      tag: 'angular-to-web-component',
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
  status = 'Loading Web Component remote script...';

  @ViewChild('remoteElement', { static: true })
  private remoteElementRef!: ElementRef<DemoRemoteElement>;

  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private viewReady = false;

  private readonly onRemoteOutput = (event: Event): void => {
    const custom = event as CustomEvent<RemoteOutput>;

    this.zone.run(() => {
      this.latestOutput = JSON.stringify(custom.detail);
      this.output.emit(custom.detail);
      this.cdr.detectChanges();
    });
  };

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.injectRemoteScript('/remotes/ma-demo-web-remote.js', 'ma-demo-web-remote');
      await customElements.whenDefined('ma-demo-web-remote');

      const remoteElement = this.remoteElementRef.nativeElement;
      remoteElement.addEventListener('remoteOutput', this.onRemoteOutput as EventListener);
      this.viewReady = true;
      this.pushInputToRemote();

      this.status = 'Web Component remote mounted (runtime script)';
      this.cdr.detectChanges();
    } catch (error) {
      this.status = 'Failed to load Web Component remote script';
      this.cdr.detectChanges();
      console.error(error);
    }
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

  forceRemoteRefresh(): void {
    if (!this.viewReady) {
      return;
    }

    this.remoteElementRef.nativeElement.refresh?.();
  }

  get currentMessage(): string {
    return String(this.remoteInput.payload['message'] ?? '');
  }

  get currentTag(): string {
    return String(this.remoteInput.payload['tag'] ?? '');
  }

  ngOnDestroy(): void {
    if (!this.viewReady) {
      return;
    }

    this.remoteElementRef.nativeElement.removeEventListener('remoteOutput', this.onRemoteOutput as EventListener);
  }

  private injectRemoteScript(src: string, marker: string): Promise<void> {
    const existing = document.querySelector(`script[data-web-remote="${marker}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (customElements.get(marker)) {
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
      script.dataset['webRemote'] = marker;
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
    if (!this.viewReady) {
      return;
    }

    this.remoteElementRef.nativeElement.input = this.remoteInput;
  }
}
