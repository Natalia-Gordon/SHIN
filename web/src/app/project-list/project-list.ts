import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PROJECTS } from '../content/projects';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss',
})
export class ProjectList {
  protected readonly projects = PROJECTS.filter((project) => project.path && project.summary);
}
