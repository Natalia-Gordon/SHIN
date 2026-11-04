export interface SiteLink {
  label: string;
  path?: string;
  href?: string;
  external?: boolean;
  children?: SiteLink[];
}

export interface SitePage {
  id: number;
  title: string;
  slug: string;
  path: string;
  parentId: number;
  date: string;
  showDate: boolean;
  html: string;
  text: string;
}

export interface FooterColumn {
  title: string;
  links: SiteLink[];
}

export interface SiteData {
  pages: SitePage[];
  nav: SiteLink[];
  footer: FooterColumn[];
}
