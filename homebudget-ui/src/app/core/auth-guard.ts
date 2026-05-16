import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  AuthService
} from './auth.service';

export const authGuard:
CanActivateFn = () => {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);

  // CHECK LOGIN

  if (authService.isAuthenticated()) {

    return true;
  }

  // REDIRECT

  router.navigate(['/login']);

  return false;
};