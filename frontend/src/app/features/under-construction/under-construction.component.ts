import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './under-construction.component.html',
  styleUrl: './under-construction.component.css',
})
export class UnderConstructionComponent {
  private route = inject(ActivatedRoute);

  /** Page title from route data (e.g. "My devices", "Groups", "Actions"). */
  get pageTitle(): string {
    return (this.route.snapshot.data['title'] as string) ?? 'This section';
  }
}
