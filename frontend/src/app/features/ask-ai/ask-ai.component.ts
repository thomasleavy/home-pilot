import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ask-ai',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ask-ai.component.html',
  styleUrl: './ask-ai.component.css',
})
export class AskAiComponent {}
