import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

/** Local video: put a file at public/videos/welcome-bg.mp4. Backup URL used when local file is not present (e.g. on GitHub). */
const WELCOME_VIDEO_BACKUP_URL = 'https://videos.pexels.com/video-files/6962711/6962711-hd_1920_1080_25fps.mp4';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent {
  private fb = new FormBuilder();
  private auth = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);

  /** First source = local (public/videos/welcome-bg.mp4); second = Pexels backup for when repo has no video. */
  readonly welcomeVideoBackupUrl = WELCOME_VIDEO_BACKUP_URL;

  showRegister = false;
  error: string | null = null;
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
