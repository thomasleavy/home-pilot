import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' }, // guard on home redirects to welcome if not logged in
  { path: 'welcome', loadComponent: () => import('./features/welcome/welcome.component').then(m => m.WelcomeComponent) },
  { path: 'home', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'insights', canActivate: [authGuard], loadComponent: () => import('./features/insights/insights.component').then(m => m.InsightsComponent) },
  { path: 'text-size', canActivate: [authGuard], loadComponent: () => import('./features/text-size/text-size.component').then(m => m.TextSizeComponent) },
  { path: 'discover', canActivate: [authGuard], loadComponent: () => import('./features/discover/discover.component').then(m => m.DiscoverComponent) },
  { path: 'manage', canActivate: [authGuard], loadComponent: () => import('./features/manage/manage.component').then(m => m.ManageComponent) },
  { path: 'ask-ai', canActivate: [authGuard], loadComponent: () => import('./features/ask-ai/ask-ai.component').then(m => m.AskAiComponent) },
  { path: 'guide', canActivate: [authGuard], loadComponent: () => import('./features/guide/guide.component').then(m => m.GuideComponent) },
  { path: 'connect-to-alexa', canActivate: [authGuard], loadComponent: () => import('./features/connect-to-alexa/connect-to-alexa.component').then(m => m.ConnectToAlexaComponent) },
  { path: 'home-profile', canActivate: [authGuard], loadComponent: () => import('./features/home-profile/home-profile.component').then(m => m.HomeProfileComponent) },
  { path: 'people-and-permissions', canActivate: [authGuard], loadComponent: () => import('./features/people-and-permissions/people-and-permissions.component').then(m => m.PeopleAndPermissionsComponent) },
  { path: 'energy-tariffs', canActivate: [authGuard], loadComponent: () => import('./features/energy-tariffs/energy-tariffs.component').then(m => m.EnergyTariffsComponent) },
  { path: 'faq', canActivate: [authGuard], loadComponent: () => import('./features/faq/faq.component').then(m => m.FaqComponent) },
  { path: 'about', canActivate: [authGuard], loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },
  { path: 'my-devices', canActivate: [authGuard], loadComponent: () => import('./features/under-construction/under-construction.component').then(m => m.UnderConstructionComponent), data: { title: 'My devices' } },
  { path: 'groups', canActivate: [authGuard], loadComponent: () => import('./features/under-construction/under-construction.component').then(m => m.UnderConstructionComponent), data: { title: 'Groups' } },
  { path: 'actions', canActivate: [authGuard], loadComponent: () => import('./features/under-construction/under-construction.component').then(m => m.UnderConstructionComponent), data: { title: 'Actions' } },
  { path: 'personal-details', canActivate: [authGuard], loadComponent: () => import('./features/personal-details/personal-details.component').then(m => m.PersonalDetailsComponent) },
  { path: 'orders-returns', canActivate: [authGuard], loadComponent: () => import('./features/orders-returns/orders-returns.component').then(m => m.OrdersReturnsComponent) },
  { path: 'account-security', canActivate: [authGuard], loadComponent: () => import('./features/account-security/account-security.component').then(m => m.AccountSecurityComponent) },
  { path: 'product-guides', canActivate: [authGuard], loadComponent: () => import('./features/product-guides/product-guides.component').then(m => m.ProductGuidesComponent) },
];
