import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { DatePipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ThemeService } from './core/services/theme.service';
import { TextSizeService } from './core/services/text-size.service';
import { DeviceApiService, ConnectionStatus } from './core/services/device-api.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  themeService = inject(ThemeService);
  private textSizeService = inject(TextSizeService);
  private deviceApi = inject(DeviceApiService);
  private router = inject(Router);
  private auth = inject(AuthService);

  connectionStatus: ConnectionStatus = 'disconnected';
  greeting = '';
  showShell = true;

  ngOnInit(): void {
    this.themeService.init();
    this.textSizeService.init();
    this.setGreeting();
    this.deviceApi.connectionStatus$.subscribe((s) => (this.connectionStatus = s));
    if (this.auth.isLoggedIn()) {
      this.deviceApi.connectWebSocket();
    }
    this.showShell = !this.router.url.includes('/welcome');
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.showShell = !e.urlAfterRedirects.includes('welcome');
      if (this.showShell) {
        this.setGreeting();
        this.textSizeService.reloadForCurrentUser();
      }
    });
  }

  now(): Date {
    return new Date();
  }

  connectionLabel(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting…';
      case 'poor': return 'Poor connection';
      default: return 'Disconnected';
    }
  }

  private setGreeting(): void {
    const h = new Date().getHours();
    const username = this.auth.getUsername();
    const namePart = username ? ` ${username}` : '';
    if (h < 12) this.greeting = `Good Morning${namePart}`;
    else if (h < 17) this.greeting = `Good Afternoon${namePart}`;
    else this.greeting = `Good Evening${namePart}`;
  }
}
