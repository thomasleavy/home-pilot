import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-account-security',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './account-security.component.html',
  styleUrl: './account-security.component.css',
})
export class AccountSecurityComponent {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  passwordForm: FormGroup;
  error = '';
  success = false;
  loading = false;

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  changePassword(): void {
    this.error = '';
    this.success = false;
    const value = this.passwordForm.getRawValue();
    if (this.passwordForm.invalid || value.newPassword !== value.confirmPassword) {
      this.error =
        value.newPassword !== value.confirmPassword
          ? 'New passwords do not match.'
          : 'Please fill all fields; new password must be at least 6 characters.';
      return;
    }
    this.loading = true;
    this.auth.changePassword(value.currentPassword, value.newPassword).subscribe({
      next: () => {
        this.success = true;
        this.passwordForm.reset();
        this.loading = false;
        setTimeout(() => (this.success = false), 3000);
      },
      error: (err) => {
        this.error = err.error?.error ?? 'Failed to change password.';
        this.loading = false;
      },
    });
  }
}
