import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PROJECTS } from '../content/projects';
import {
  ORGANIZATION_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  SeoService,
  organizationJsonLd,
} from '../content/seo.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly projects = PROJECTS;

  constructor() {
    inject(SeoService).update({
      title: ORGANIZATION_NAME,
      fullTitle: true,
      description: SITE_DESCRIPTION,
      path: '/',
      jsonLd: [
        organizationJsonLd(),
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: ORGANIZATION_NAME,
          inLanguage: 'en',
          publisher: { '@id': `${SITE_URL}/#organization` },
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    });
  }
}
