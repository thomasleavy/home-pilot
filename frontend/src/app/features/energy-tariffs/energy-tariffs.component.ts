import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-energy-tariffs',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './energy-tariffs.component.html',
  styleUrl: './energy-tariffs.component.css',
})
export class EnergyTariffsComponent {}
