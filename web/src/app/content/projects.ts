export interface Project {
  title: string;
  tagline: string;
  image: string;
  path?: string;
  href?: string;
  facts?: string[];
  summary?: string[];
}

/** Summaries are condensed from each project's archive page. */
export const PROJECTS: Project[] = [
  {
    title: 'Women Parliament',
    tagline: 'A platform for politics from another perspective',
    image: 'brand/women-parliament.jpg',
    path: '/projects/women-parliament',
    facts: ['Since 1999', '10,000+ participants', '350+ women speakers'],
    summary: [
      'A public forum for critical, feminist debate on Israeli policy and public discourse. SHIN founded it in November 1999 together with the Friedrich Ebert Stiftung, Beit Berl Academic College and Hen – Herzliya Women.',
      'Sessions travel across the country, from Kiryat Shmona to Sderot, with Jewish and Arab women on every panel. They have covered the state budget, welfare and education, peace and war, violence against women, the labor market, prostitution and trafficking, and women in elections.',
    ],
  },
  {
    title: 'Young Women Parliament',
    tagline: 'A platform for politics from another perspective',
    image: 'brand/young-women-parliament.jpg',
    path: '/projects/young-women-parliament',
    facts: ['Since 2010', 'Jewish and Arab high-school girls', 'Sessions in the Knesset'],
    summary: [
      'Founded in 2010 by SHIN and the Women Parliament for high-school girls from different backgrounds across Israel. It raises awareness of gender and social inequality and supports girls who start local initiatives in their own communities.',
      'Girls build leadership skills and friendships across ethnic, religious and national lines, especially between Jewish and Arab girls. Activities include sessions in towns and in the Knesset, leadership seminars and video calls with young women in the USA and Kenya.',
    ],
  },
  {
    title: 'Anuar',
    tagline: 'A Jewish-Arab women’s leadership group for the promotion of peace and women equality',
    image: 'brand/anuar.jpg',
    path: '/projects/anuar',
    facts: ['Since 2002', 'Jewish–Arab partnership', 'Led by Ibtisam Mahameed and Yonat Klar'],
    summary: [
      'A leadership group of Jewish and Arab women, formed in April 2002 at the request of Women Parliament participants. It works for women’s equal rights in the family, the workplace and politics, and for the rights of the Arab minority in Israel.',
      'Anuar brings women together through weekend seminars, house meetings and public events in Arab and Jewish towns. In 2015 it renewed its activity, including the radio program “Love and Peace – The Feminine Voice.”',
    ],
  },
  {
    title: 'Women Reborn',
    tagline: 'A unique collaboration among Arab women leaders, SHIN and the Center for Religious Tolerance (CRT)',
    image: 'brand/women-reborn.jpg',
    path: '/projects/women-reborn',
    facts: ['Since 2008', 'Fureidis and Jisr az-Zarqa', 'With the Center for Religious Tolerance'],
    summary: [
      'A program that empowers women socially, economically and politically in two Arab villages in northern Israel. Ibtisam Mahameed started it in Fureidis in 2008, and it expanded to Jisr az-Zarqa in 2011.',
      'The women set their own goals: leadership courses, vocational training, Hebrew and Arabic literacy, study tours, International Women’s Day events and organizing for municipal elections. SHIN and CRT support the local leaders as volunteers.',
    ],
  },
  {
    title: 'Activistit',
    tagline: 'A room for feminist activism writing. In memory of Yonat Klar',
    image: 'brand/activistit.png',
    href: 'https://activistit.co.il/',
  },
];
