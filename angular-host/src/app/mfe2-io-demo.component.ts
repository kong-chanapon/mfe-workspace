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

export type RemoteInput = {
  type: string;
  payload: Record<string, unknown>;
};

export type RemoteOutput = {
  type: string;
  payload: unknown;
};

@Component({
  selector: 'app-mfe2-io-demo',
  templateUrl: './mfe2-io-demo.component.html',
  styleUrl: './mfe2-io-demo.component.css',
})
export class Mfe2IoDemoComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() input: RemoteInput = {
    type: 'set-context',
    payload: { message: 'Hello from host', tag: 'initial' },
  };
  @Output() output = new EventEmitter<RemoteOutput>();

  loadState = 'Loading mfe2...';
  latestOutput = 'Waiting for output...';

  @ViewChild('remoteContainer', { read: ViewContainerRef, static: true })
  private remoteContainer!: ViewContainerRef;

  private remoteRef?: ComponentRef<unknown>;
  private outputSub?: Subscription;

  async ngAfterViewInit(): Promise<void> {
    await this.loadRemoteComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['input']) {
      this.applyInputToRemote();
    }
  }

  private async loadRemoteComponent(): Promise<void> {
    try {
      const remote = await loadRemoteModule('mfe2', './Component');
      this.remoteRef = this.remoteContainer.createComponent(remote.App);
      this.applyInputToRemote();

      const instance = this.remoteRef.instance as {
        output?: EventEmitter<RemoteOutput>;
      };

      this.outputSub = instance.output?.subscribe((event: RemoteOutput) => {
        this.latestOutput = JSON.stringify(event);
        this.output.emit(event);
      });

      this.loadState = 'mfe2 loaded';
    } catch (error) {
      this.loadState = 'Failed to load mfe2';
      console.error(error);
    }
  }

  private applyInputToRemote(): void {
    this.remoteRef?.setInput('input', this.input);
  }

  ngOnDestroy(): void {
    this.outputSub?.unsubscribe();
    this.remoteRef?.destroy();
  }
}
