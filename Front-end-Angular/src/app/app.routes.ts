import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', canActivate: [publicGuard], component: LoginComponent },
  { path: 'register', canActivate: [publicGuard], component: RegisterComponent },
  { path: 'forgot-password', canActivate: [publicGuard], component: ForgotPasswordComponent },
  { path: 'reset-password', canActivate: [publicGuard], component: ResetPasswordComponent },
  { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent },
  { path: '**', redirectTo: 'login' }
];
