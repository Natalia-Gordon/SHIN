import { Routes } from '@angular/router';
import { Home } from './home/home';
import { PageView } from './page/page';
import { SearchPage } from './search/search';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'search', component: SearchPage },
  { path: '**', component: PageView },
];
