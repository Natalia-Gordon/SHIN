import { PROJECTS } from './projects';

export interface OverviewCard {
  title: string;
  tagline: string;
  path: string;
  image?: string;
  facts?: string[];
  summary: string[];
}

export interface Overview {
  label: string;
  columns: 2 | 3;
  cards: OverviewCard[];
}

/** Summaries are condensed from each linked archive page. */
const ABOUT_SECTIONS: OverviewCard[] = [
  {
    title: 'About SHIN',
    tagline: 'Our story since 1989',
    path: '/about/about-us',
    facts: ['Founded in February 1989', 'Founder: Esther Hertzog'],
    summary: [
      'SHIN was founded by Esther Hertzog and a group of women and men to protest the exclusion of women from political and public leadership in Israel. It works for equal representation of women in politics and in every public and economic sphere.',
      'Over the years SHIN has run campaigns, house meetings and leadership courses, and founded a women’s party in 1992. It started the Women Parliament in 1999, Anuar in 2002 and the Young Women Parliament in 2010.',
    ],
  },
  {
    title: 'Our vision',
    tagline: 'Why equal representation matters',
    path: '/about/our-vision',
    facts: ['Equal representation', 'Social justice for all'],
    summary: [
      'SHIN aims for equal representation of women in every center of power in Israel, as a way to build a society that offers social justice to all groups and communities.',
      'Women bring long experience of caring for children, the elderly and others who depend on them. With women in decision-making positions and access to public resources, leadership will give more weight to the underprivileged and take a more humane approach.',
    ],
  },
  {
    title: 'Steering Committee',
    tagline: 'The people who lead SHIN',
    path: '/about/board-members',
    facts: ['12 members', 'Three co-chairs'],
    summary: [
      'Prof. Esther Hertzog, who founded SHIN in 1989, co-chairs the movement with Nahad Kanan and Liron Ben Yaakov. Sarin Engel is SHIN’s General Director.',
      'The committee brings together activists, academics and professionals. They include women’s equality advisers to local authorities, the leaders of Anuar and Women Reborn, gender studies researchers and founders of partner groups such as ALIA and Hen – Herzliya Women.',
    ],
  },
];

const PROJECT_CARDS: OverviewCard[] = PROJECTS.flatMap((project) =>
  project.path && project.summary
    ? [{ ...project, path: project.path, summary: project.summary }]
    : [],
);

export const OVERVIEWS: Record<string, Overview> = {
  '/about': { label: 'About SHIN sections', columns: 3, cards: ABOUT_SECTIONS },
  '/projects': { label: 'SHIN projects', columns: 2, cards: PROJECT_CARDS },
};
