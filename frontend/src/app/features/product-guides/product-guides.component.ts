import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PlaceholderProduct {
  name: string;
  description: string;
}

@Component({
  selector: 'app-product-guides',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-guides.component.html',
  styleUrl: './product-guides.component.css',
})
export class ProductGuidesComponent {
  readonly wipMessage = 'This section is a work in progress. The products below are placeholders.';
  readonly placeholderProducts: PlaceholderProduct[] = [
    { name: 'Smart Thermostat', description: 'Control your heating and view usage from the app. Set target temperatures and turn heating on or off.' },
    { name: 'Smart Plug', description: 'Turn connected devices on or off remotely. Monitor energy use (when supported).' },
    { name: 'Motion Sensor', description: 'Detects movement and can trigger alerts. Last motion time is shown on your Home screen.' },
    { name: 'Smart Light', description: 'Switch lights on or off from the app. Compatible with the living room and other zones.' },
    { name: 'Hot Water Controller', description: 'Turn hot water on or off and see how long it has been running in Insights.' },
  ];
}
