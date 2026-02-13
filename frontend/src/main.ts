import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('mqtt-dashboard-theme') : null;
const theme = stored === 'dark' ? 'theme-dark' : 'theme-light';
document.documentElement.classList.add(theme);
const textSize = (typeof localStorage !== 'undefined' && localStorage.getItem('mqtt-dashboard-text-size')) || 'medium';
const sizeClass = ['small', 'medium', 'large'].includes(textSize) ? `text-size-${textSize}` : 'text-size-medium';
document.documentElement.classList.add(sizeClass);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
