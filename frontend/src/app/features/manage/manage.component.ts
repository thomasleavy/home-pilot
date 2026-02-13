import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.css',
})
export class ManageComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  deleteAccountError = '';
  deleteAccountLoading = false;
  showDeleteConfirm = false;

  readonly deleteAccountConfirmMessage =
    'Are you sure you want to delete your account? This will permanently remove your account and all your saved settings and device data. You will be logged out and will need to register again to use the app. This cannot be undone.';

  readonly settingsOptions = [
    'My devices',
    'Groups',
    'Actions',
    'Connect to Alexa, Apple or Google',
    'Home profile',
    'People and permissions',
    'Energy tariffs',
  ] as const;

  readonly accountOptions = [
    { label: 'Personal Details', destructive: false },
    { label: 'Orders & Returns', destructive: false },
    { label: 'Account Security', destructive: false },
    { label: 'Delete account', destructive: true },
  ] as const;

  readonly supportOptions = ['Ask AI', 'FAQ', 'Product Guides'] as const;

  onSettingsOptionClick(option: string): void {
    if (option === 'My devices') {
      this.router.navigate(['/my-devices']);
      return;
    }
    if (option === 'Groups') {
      this.router.navigate(['/groups']);
      return;
    }
    if (option === 'Actions') {
      this.router.navigate(['/actions']);
      return;
    }
    if (option === 'Connect to Alexa, Apple or Google') {
      this.router.navigate(['/connect-to-alexa']);
      return;
    }
    if (option === 'Home profile') {
      this.router.navigate(['/home-profile']);
      return;
    }
    if (option === 'People and permissions') {
      this.router.navigate(['/people-and-permissions']);
      return;
    }
    if (option === 'Energy tariffs') {
      this.router.navigate(['/energy-tariffs']);
      return;
    }
    console.log('Settings option clicked:', option);
  }

  onAddDevice(): void {
    // Placeholder: e.g. navigate to add-device flow later
    console.log('Add device clicked');
  }

  onAccountOptionClick(option: { label: string; destructive: boolean }): void {
    if (option.label === 'Personal Details') {
      this.router.navigate(['/personal-details']);
      return;
    }
    if (option.label === 'Orders & Returns') {
      this.router.navigate(['/orders-returns']);
      return;
    }
    if (option.label === 'Account Security') {
      this.router.navigate(['/account-security']);
      return;
    }
    if (option.label === 'Delete account') {
      this.deleteAccountError = '';
      this.showDeleteConfirm = true;
      return;
    }
    console.log('Account option clicked:', option.label);
  }

  closeDeleteConfirm(): void {
    if (!this.deleteAccountLoading) this.showDeleteConfirm = false;
  }

  confirmDeleteAccount(): void {
    this.deleteAccountLoading = true;
    this.auth.deleteAccount().subscribe({
      next: () => this.auth.logout(),
      error: (err) => {
        this.deleteAccountLoading = false;
        this.showDeleteConfirm = false;
        this.deleteAccountError = err.error?.error ?? err.message ?? 'Failed to delete account. Please try again.';
      },
    });
  }

  onSupportOptionClick(option: string): void {
    if (option === 'Ask AI') {
      this.router.navigate(['/ask-ai']);
      return;
    }
    if (option === 'FAQ') {
      this.router.navigate(['/faq']);
      return;
    }
    if (option === 'Product Guides') {
      this.router.navigate(['/product-guides']);
      return;
    }
    console.log('Support option clicked:', option);
  }

  onLogout(): void {
    this.auth.logout();
  }
}
