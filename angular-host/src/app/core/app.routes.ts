import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'mfe1',
  },
  {
    path: 'mfe1',
    loadComponent: () => loadRemoteModule('mfe1', './Component').then((m) => m.App),
  },
  {
    path: 'mfe2',
    loadComponent: () => loadRemoteModule('mfe2', './Component').then((m) => m.App),
  },
  {
    path: 'selector-io',
    loadComponent: () => import('../features/selector-io/selector-io-tab.component').then((m) => m.HostSelectorIoTabComponent),
  },
  {
    path: 'react-remote',
    loadComponent: () => import('../features/react/react-remote-tab.component').then((m) => m.MfeReactRemoteTabComponent),
  },
  {
    path: 'react-window-event',
    loadComponent: () => import('../features/react/react-window-tab.component').then((m) => m.MfeReactWindowTabComponent),
  },
  {
    path: 'react-window-collision',
    loadComponent: () =>
      import('../features/react/react-window-collision-tab.component').then((m) => m.MfeReactWindowCollisionTabComponent),
  },
  {
    path: 'react-ax-lazy-element',
    loadComponent: () =>
      import('../features/react/mfe-react-ax-lazy-element-tab.component').then((m) => m.MfeReactAxLazyElementTabComponent),
  },
  {
    path: 'vue-remote',
    loadComponent: () => import('../features/vue/vue-remote-tab.component').then((m) => m.MfeVueRemoteTabComponent),
  },
  {
    path: 'vue-window-remote',
    loadComponent: () => import('../features/vue/vue-window-tab.component').then((m) => m.MfeVueWindowTabComponent),
  },
  {
    path: 'web-component-runtime',
    loadComponent: () =>
      import('../features/web-components/mfe-web-component-tab.component').then((m) => m.MfeWebComponentTabComponent),
  },
  {
    path: 'web-component-ax-runtime',
    loadComponent: () =>
      import('../features/web-components-ax/mfe-ax-lazy-element-tab.component').then((m) => m.MfeAxLazyElementTabComponent),
  },
  {
    path: '**',
    redirectTo: 'mfe1',
  },
];
