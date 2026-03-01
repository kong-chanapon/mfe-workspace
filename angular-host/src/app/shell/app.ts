import { Component } from '@angular/core';
import { MfeAngularRemoteViewComponent } from '../features/angular-remotes/angular-remote-view.component';
import { MfeReactAxLazyElementTabComponent } from '../features/react/mfe-react-ax-lazy-element-tab.component';
import { MfeReactRemoteTabComponent } from '../features/react/react-remote-tab.component';
import { MfeReactWindowCollisionTabComponent } from '../features/react/react-window-collision-tab.component';
import { MfeReactWindowTabComponent } from '../features/react/react-window-tab.component';
import { HostSelectorIoTabComponent } from '../features/selector-io/selector-io-tab.component';
import { MfeVueRemoteTabComponent } from '../features/vue/vue-remote-tab.component';
import { MfeVueWindowTabComponent } from '../features/vue/vue-window-tab.component';
import { MfeAxLazyElementTabComponent } from '../features/web-components-ax/mfe-ax-lazy-element-tab.component';
import { MfeWebComponentTabComponent } from '../features/web-components/mfe-web-component-tab.component';

type MfeInput = {
  type: string;
  payload: Record<string, unknown>;
};

type MfeOutput = {
  type: string;
  payload: unknown;
};

type HostTab =
  | 'mfe1'
  | 'mfe2'
  | 'selector'
  | 'react'
  | 'react-window'
  | 'react-window-collision'
  | 'react-ax-lazy'
  | 'vue'
  | 'vue-window'
  | 'web-component'
  | 'web-component-ax';

@Component({
  selector: 'app-root',
  imports: [
    MfeAngularRemoteViewComponent,
    HostSelectorIoTabComponent,
    MfeReactRemoteTabComponent,
    MfeReactWindowTabComponent,
    MfeReactWindowCollisionTabComponent,
    MfeReactAxLazyElementTabComponent,
    MfeVueRemoteTabComponent,
    MfeVueWindowTabComponent,
    MfeWebComponentTabComponent,
    MfeAxLazyElementTabComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  activeTab: HostTab = 'mfe1';

  mfe1Input: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> mfe1', tag: 'mfe1' },
  };
  mfe2Input: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> mfe2', tag: 'mfe2' },
  };
  selectorInput: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> selector tab', tag: 'selector' },
  };
  reactInput: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> react props remote', tag: 'react-props' },
  };
  reactWindowInput: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> react window remote', tag: 'react-window' },
  };
  reactWindowCollisionInput: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> shared event channel', tag: 'collision-demo' },
  };
  reactAxLazyInput: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> react ax lazy remote', tag: 'react-ax-lazy' },
  };
  vueInput: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> vue remote', tag: 'vue' },
  };
  vueWindowInput: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> vue window remote', tag: 'vue-window' },
  };
  webComponentInput: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> web component remote', tag: 'web-component' },
  };
  webComponentAxInput: MfeInput = {
    type: 'set-context',
    payload: { message: 'host -> web component ax lazy', tag: 'web-component-ax' },
  };

  mfe1Output = 'waiting output...';
  mfe2Output = 'waiting output...';
  selectorOutput = 'waiting output...';
  reactOutput = 'waiting output...';
  reactWindowOutput = 'waiting output...';
  reactWindowCollisionOutput = 'waiting output...';
  reactAxLazyOutput = 'waiting output...';
  vueOutput = 'waiting output...';
  vueWindowOutput = 'waiting output...';
  webComponentOutput = 'waiting output...';
  webComponentAxOutput = 'waiting output...';

  onMfe1Output(event: MfeOutput): void {
    this.mfe1Output = JSON.stringify(event);
  }

  onMfe2Output(event: MfeOutput): void {
    this.mfe2Output = JSON.stringify(event);
  }

  onSelectorOutput(event: MfeOutput): void {
    this.selectorOutput = JSON.stringify(event);
  }

  onReactOutput(event: MfeOutput): void {
    this.reactOutput = JSON.stringify(event);
  }

  onReactWindowOutput(event: MfeOutput): void {
    this.reactWindowOutput = JSON.stringify(event);
  }

  onReactWindowCollisionOutput(event: MfeOutput): void {
    this.reactWindowCollisionOutput = JSON.stringify(event);
  }

  onReactAxLazyOutput(event: MfeOutput): void {
    this.reactAxLazyOutput = JSON.stringify(event);
  }

  onVueOutput(event: MfeOutput): void {
    this.vueOutput = JSON.stringify(event);
  }

  onVueWindowOutput(event: MfeOutput): void {
    this.vueWindowOutput = JSON.stringify(event);
  }

  onWebComponentOutput(event: MfeOutput): void {
    this.webComponentOutput = JSON.stringify(event);
  }

  onWebComponentAxOutput(event: MfeOutput): void {
    this.webComponentAxOutput = JSON.stringify(event);
  }

  setActiveTab(tab: HostTab): void {
    this.activeTab = tab;
  }
}
