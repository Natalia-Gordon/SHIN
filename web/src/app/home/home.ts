import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PROJECTS } from '../content/projects';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly projects = PROJECTS;
}
