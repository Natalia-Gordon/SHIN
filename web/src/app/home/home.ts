import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ProjectCard {
  title: string;
  text: string;
  image: string;
  alt: string;
  path?: string;
  href?: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly projects: ProjectCard[] = [
    {
      title: 'Women Parliament',
      text: 'A platform for politics from another perspective',
      image: 'brand/women-parliament.jpg',
      alt: 'Women Parliament',
      path: '/projects/women-parliament',
    },
    {
      title: 'Young Women Parliament',
      text: 'A platform for politics from another perspective',
      image: 'brand/young-women-parliament.jpg',
      alt: 'Young Women Parliament',
      path: '/projects/young-women-parliament',
    },
    {
      title: 'Anuar',
      text: 'A Jewish-Arab women’s leadership group for the promotion of peace and women equality',
      image: 'brand/anuar.jpg',
      alt: 'Anuar',
      path: '/projects/anuar',
    },
    {
      title: 'Women Reborn',
      text: 'A unique collaboration among Arab women leaders, SHIN and the Center for Religious Tolerance (CRT)',
      image: 'brand/women-reborn.jpg',
      alt: 'Women Reborn',
      path: '/projects/women-reborn',
    },
    {
      title: 'Activistit',
      text: 'A room for feminist activism writing. In memory of Yonat Klar',
      image: 'brand/activistit.png',
      alt: 'Activistit',
      href: 'https://activistit.co.il/',
    },
  ];
}
