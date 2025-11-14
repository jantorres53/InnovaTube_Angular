import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const publicGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  if (!token) return true;
  router.navigate(['/dashboard']);
  return false;
};