import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  catchError,
  throwError
} from 'rxjs';

export const authInterceptor:
HttpInterceptorFn = (

  req,
  next

) => {

  const router =
    inject(Router);

  const token =
    localStorage.getItem('token');

  // ADD TOKEN

  if (token) {

    req = req.clone({

      setHeaders: {

        Authorization:
          `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(

    catchError((error:

      HttpErrorResponse) => {

      // TOKEN EXPIRED

      if (error.status === 401) {

        localStorage.removeItem(
          'token'
        );

        localStorage.removeItem(
          'refreshToken'
        );

        localStorage.removeItem(
          'user'
        );

        router.navigate([
          '/login'
        ]);
      }

      return throwError(
        () => error
      );
    })
  );
};