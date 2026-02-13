import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-people-and-permissions',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './people-and-permissions.component.html',
  styleUrl: './people-and-permissions.component.css',
})
export class PeopleAndPermissionsComponent {}
