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
    path: 'vue-remote',
    loadComponent: () => import('../features/vue/vue-remote-tab.component').then((m) => m.MfeVueRemoteTabComponent),
  },
  {
    path: 'vue-window-remote',
    loadComponent: () => import('../features/vue/vue-window-tab.component').then((m) => m.MfeVueWindowTabComponent),
  },
  {
    path: '**',
    redirectTo: 'mfe1',
  },
];
