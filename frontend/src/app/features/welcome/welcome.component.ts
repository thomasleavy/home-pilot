import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

/** Pexels video (ID 6962711). If it does not play (e.g. CORS from localhost), fallback is used. */
const WELCOME_VIDEO_PEXELS = 'https://videos.pexels.com/video-files/6962711/6962711-hd_1920_1080_25fps.mp4';
/** Fallback when Pexels is blocked; replace with your own URL or local path if needed. */
const WELCOME_VIDEO_FALLBACK = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
/** Pexels video ID 6962711 – credit link for the welcome background video. */
const PEXELS_VIDEO_PAGE_URL = 'https://www.pexels.com/video/6962711/';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements AfterViewInit {
  @ViewChild('welcomeVideo') videoRef?: ElementRef<HTMLVideoElement>;

  private fb = new FormBuilder();
  private auth = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);

  readonly pexelsVideoCreditUrl = PEXELS_VIDEO_PAGE_URL;

  showRegister = false;
  error: string | null = null;

  ngAfterViewInit(): void {
    setTimeout(() => this.startVideo(), 0);
  }

  private startVideo(): void {
    const video = this.videoRef?.nativeElement;
    if (!video) return;

    const tryPlay = () => video.play().catch(() => {});
    const tryPrimary = () => {
      video.src = WELCOME_VIDEO_FALLBACK;
      video.load();
    };
    const tryBackup = () => {
      video.src = WELCOME_VIDEO_PEXELS;
      video.load();
    };

    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'auto';
    video.addEventListener('canplay', tryPlay, { once: true });
    const onError = () => {
      video.removeEventListener('canplay', tryPlay);
      tryBackup();
      video.addEventListener('canplay', tryPlay, { once: true });
    };
    video.addEventListener('error', onError, { once: true });

    tryPrimary();
  }
  loading = false;

  loginForm = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  toggleMode(): void {
    this.showRegister = !this.showRegister;
    this.error = null;
  }

  onLogin(): void {
    this.error = null;
    if (this.loginForm.invalid) return;
    this.loading = true;
    const { login, password } = this.loginForm.getRawValue();
    this.auth.login(login, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Login failed';
      },
    });
  }

  onRegister(): void {
    this.error = null;
    if (this.registerForm.invalid) return;
    this.loading = true;
    const { username, email, password } = this.registerForm.getRawValue();
    this.auth.register(username, email, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Registration failed';
      },
    });
  }
}
