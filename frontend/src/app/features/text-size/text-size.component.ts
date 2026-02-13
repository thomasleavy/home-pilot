import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TextSizeService, TextSize } from '../../core/services/text-size.service';

@Component({
  selector: 'app-text-size',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './text-size.component.html',
  styleUrl: './text-size.component.css',
})
export class TextSizeComponent implements OnInit {
  textSizeService = inject(TextSizeService);

  ngOnInit(): void {
    this.textSizeService.init();
  }

  setSize(size: TextSize): void {
    this.textSizeService.setSize(size);
  }
}
