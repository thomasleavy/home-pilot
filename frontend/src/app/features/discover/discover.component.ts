import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css',
})
export class DiscoverComponent {
  carouselIndex = 0;
  readonly carouselSlides = [0, 1, 2];
  readonly mosaicItems = [1, 2, 3, 4, 5, 6];

  prevSlide(): void {
    this.carouselIndex = this.carouselIndex === 0
      ? this.carouselSlides.length - 1
      : this.carouselIndex - 1;
  }

  nextSlide(): void {
    this.carouselIndex = (this.carouselIndex + 1) % this.carouselSlides.length;
  }

  goToSlide(index: number): void {
    this.carouselIndex = index;
  }

  onMosaicItemClick(_index: number): void {
    // Placeholder: could navigate or open modal later
  }
}
