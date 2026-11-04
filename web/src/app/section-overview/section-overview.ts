import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Overview } from '../content/overview';

@Component({
  selector: 'app-section-overview',
  imports: [RouterLink],
  templateUrl: './section-overview.html',
  styleUrl: './section-overview.scss',
})
export class SectionOverview {
  readonly overview = input.required<Overview>();
}
