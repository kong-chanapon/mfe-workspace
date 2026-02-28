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
    loadComponent: () => import('./selector-io-tab.component').then((m) => m.SelectorIoTabComponent),
  },
  {
    path: 'react-remote',
    loadComponent: () => import('./react-remote-tab.component').then((m) => m.ReactRemoteTabComponent),
  },
  {
    path: 'react-window-event',
    loadComponent: () => import('./react-window-tab.component').then((m) => m.ReactWindowTabComponent),
  },
  {
    path: 'vue-remote',
    loadComponent: () => import('./vue-remote-tab.component').then((m) => m.VueRemoteTabComponent),
  },
  {
    path: '**',
    redirectTo: 'mfe1',
  },
];
