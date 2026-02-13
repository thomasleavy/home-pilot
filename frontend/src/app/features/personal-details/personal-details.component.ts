import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, AuthUser } from '../../core/services/auth.service';

@Component({
  selector: 'app-personal-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './personal-details.component.html',
  styleUrl: './personal-details.component.css',
})
export class PersonalDetailsComponent implements OnInit {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  profile: AuthUser | null = null;
  loading = true;
  profileError = '';
  profileSaved = false;
  showPasswordForm = false;
  passwordError = '';
  passwordSuccess = false;
  passwordLoading = false;

  readonly passwordPlaceholder = '••••••••••';

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
    this.auth.getProfile().subscribe({
      next: (user) => {
        this.profile = user;
        this.profileForm.patchValue({ email: user.email });
        this.loading = false;
      },
      error: () => {
        this.profileError = 'Could not load profile.';
        this.profile = this.auth.getCurrentUser();
        if (this.profile) this.profileForm.patchValue({ email: this.profile.email });
        this.loading = false;
      },
    });
  }

  saveProfile(): void {
    this.profileError = '';
    this.profileSaved = false;
    const value = this.profileForm.getRawValue();
    if (this.profileForm.invalid || !value.email?.trim()) return;
    this.auth.updateProfile({ email: value.email.trim() }).subscribe({
      next: (res) => {
        this.profile = res.user;
        this.profileSaved = true;
        setTimeout(() => (this.profileSaved = false), 3000);
      },
      error: (err) => {
        this.profileError = err.error?.error ?? 'Update failed. Username or email may already be in use.';
      },
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    this.passwordForm.reset();
    this.passwordError = '';
    this.passwordSuccess = false;
  }

  changePassword(): void {
    this.passwordError = '';
    this.passwordSuccess = false;
    const value = this.passwordForm.getRawValue();
    if (this.passwordForm.invalid || value.newPassword !== value.confirmPassword) {
      this.passwordError = value.newPassword !== value.confirmPassword ? 'New passwords do not match.' : 'Please fill all fields; new password must be at least 6 characters.';
      return;
    }
    this.passwordLoading = true;
    this.auth.changePassword(value.currentPassword, value.newPassword).subscribe({
      next: () => {
        this.passwordSuccess = true;
        this.passwordForm.reset();
        this.showPasswordForm = false;
        this.passwordLoading = false;
        setTimeout(() => (this.passwordSuccess = false), 3000);
      },
      error: (err) => {
        this.passwordError = err.error?.error ?? 'Failed to change password.';
        this.passwordLoading = false;
      },
    });
  }
}
