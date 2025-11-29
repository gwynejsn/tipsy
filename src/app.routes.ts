import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './guards/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent),
    title: 'Welcome to TIPSY'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Login'
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
    title: 'Register'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'TIPSY Dashboard',
    canActivate: [authGuard]
  },
  {
    path: 'report/:id',
    loadComponent: () => import('./pages/thread-detail/thread-detail.component').then(m => m.ThreadDetailComponent),
    title: 'Report Details',
    canActivate: [authGuard]
  },
  {
    path: 'create-report',
    loadComponent: () => import('./pages/create-report/create-report.component').then(m => m.CreateReportComponent),
    title: 'Create New Report',
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    title: 'Admin Panel',
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'blockchain-explorer',
    loadComponent: () => import('./pages/blockchain-explorer/blockchain-explorer.component').then(m => m.BlockchainExplorerComponent),
    title: 'Blockchain Explorer',
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
