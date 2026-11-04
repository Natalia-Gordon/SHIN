import { RenderMode, ServerRoute } from '@angular/ssr';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Every archive page in site.json, without the leading slash, for the catch-all route. */
function archivePaths(): string[] {
  const site = JSON.parse(readFileSync(join(process.cwd(), 'public/content/site.json'), 'utf8')) as {
    pages: { path: string }[];
  };
  return site.pages.map((page) => page.path).filter((path) => path !== '/').map((path) => path.slice(1));
}

export const serverRoutes: ServerRoute[] = [
  { path: 'search', renderMode: RenderMode.Client },
  { path: '', renderMode: RenderMode.Prerender },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return archivePaths().map((path) => ({ '**': path }));
    },
  },
];
