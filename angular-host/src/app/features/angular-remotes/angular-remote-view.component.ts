import { loadRemoteModule } from '@angular-architects/native-federation';
import {
  AfterViewInit,
  Component,
  ComponentRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';

type RemoteInput = {
  type: string;
  payload: Record<string, unknown>;
};

type RemoteOutput = {
  type: string;
  payload: unknown;
};

@Component({
  selector: 'app-mfe-angular-remote-view',
  templateUrl: './angular-remote-view.component.html',
  styleUrl: './angular-remote-view.component.css',
})
export class MfeAngularRemoteViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() remoteName = 'mfe1';
  @Input() title = 'Angular Remote';
  @Input() input: RemoteInput = {
    type: 'set-context',
    payload: { message: 'hello from host', tag: 'angular-remote-view' },
  };
  @Output() output = new EventEmitter<RemoteOutput>();

  loadState = 'Loading remote...';

  @ViewChild('remoteContainer', { read: ViewContainerRef, static: true })
  private remoteContainer!: ViewContainerRef;

  private remoteRef?: ComponentRef<unknown>;
  private outputSub?: Subscription;
  private viewReady = false;

  async ngAfterViewInit(): Promise<void> {
    this.viewReady = true;
    await this.loadRemote();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) {
      return;
    }

    if (changes['remoteName']) {
      void this.loadRemote();
      return;
    }

    if (changes['input']) {
      this.applyInputToRemote();
    }
  }

  private async loadRemote(): Promise<void> {
    this.outputSub?.unsubscribe();
    this.remoteRef?.destroy();
    this.remoteContainer.clear();
    this.loadState = `Loading ${this.remoteName}...`;

    try {
      const remote = await loadRemoteModule(this.remoteName, './Component');
      this.remoteRef = this.remoteContainer.createComponent(remote.App);
      this.applyInputToRemote();
      this.subscribeOutputFromRemote();
      this.loadState = `${this.remoteName} loaded`;
    } catch (error) {
      this.loadState = `Failed to load ${this.remoteName}`;
      console.error(error);
    }
  }

  private applyInputToRemote(): void {
    if (!this.remoteRef) {
      return;
    }

    try {
      this.remoteRef.setInput('input', this.input);
    } catch {
      // Some remotes may not declare an `input` @Input.
    }
  }

  private subscribeOutputFromRemote(): void {
    if (!this.remoteRef) {
      return;
    }

    const instance = this.remoteRef.instance as {
      output?: EventEmitter<RemoteOutput>;
    };

    this.outputSub = instance.output?.subscribe((event: RemoteOutput) => {
      this.output.emit(event);
    });
  }

  ngOnDestroy(): void {
    this.outputSub?.unsubscribe();
    this.remoteRef?.destroy();
  }
}
