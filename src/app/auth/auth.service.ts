import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Observable, Subject } from 'rxjs';
import { AlertService } from '../alert/alert.service';
import { User } from './user.model';
import { LoginSignupResponse, UserDataResponse } from 'index';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User = null;
  isAuthenticatedEvent: Subject<User> = new Subject<User>();

  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    private router: Router,
    private cookies: CookieService
  ) {}

  autoLogin = new Observable((subscriber) => {
    if (this.cookies.check('isAuthenticated')) {
      this.getUserData().subscribe({
        next: (userData: UserDataResponse) => {
          this.user = userData.data.user;
          subscriber.complete();
        },
        error: () => subscriber.complete(),
      });
    } else {
      subscriber.complete();
    }
  });

  authenticate(email: string, password: string, isSignUp = false) {
    this.http
      .post<LoginSignupResponse>(
        `http://localhost:3000/api/v1/${isSignUp ? 'signup' : 'login'}`,
        {
          email,
          password,
        },
        { withCredentials: true }
      )
      .subscribe({
        complete: () => {
          this.initAppAfterAuthentication(isSignUp);
        },
        error: (error) => {
          this.alertService.failureAlertEvent.next(error.error.message);
        },
      });
  }

  getUserData(): Observable<UserDataResponse> {
    return this.http.get<UserDataResponse>(
      `http://localhost:3000/api/v1/user`,
      {
        withCredentials: true,
      }
    );
  }

  updateUserData(firstName: string, lastName: string, profilePhotoUrl: string) {
    this.http
      .patch<UserDataResponse>(
        `http://localhost:3000/api/v1/user`,
        { firstName, lastName, profilePhotoUrl },
        { withCredentials: true }
      )
      .subscribe({
        next: (userData: UserDataResponse) => {
          this.user = userData.data.user;
          this.isAuthenticatedEvent.next(Object.create(this.user));
          this.router.navigate(['general-passwords']);
          this.alertService.successAlertEvent.next(
            'Profile Updated Successfully!'
          );
        },
        error: (error) => {
          if (error.status == 401) {
            this.logout();
            return;
          }
          this.alertService.failureAlertEvent.next(error.error.message);
        },
      });
  }

  initAppAfterAuthentication(isSignUp = false) {
    this.getUserData().subscribe({
      next: (userData: { status: string; data: { user: User } }) => {
        this.user = userData.data.user;
        this.isAuthenticatedEvent.next(Object.create(this.user));

        isSignUp
          ? this.router.navigate(['update-profile'], {
              queryParams: { issignup: true },
            })
          : this.router.navigate(['general-passwords']);
      },
      error: (error) => {
        this.alertService.failureAlertEvent.next(error.error.message);
      },
    });
  }

  logout() {
    this.http
      .get<LoginSignupResponse>('http://localhost:3000/api/v1/logout', {
        withCredentials: true,
      })
      .subscribe({
        complete: () => {
          this.user = null;
          this.router.navigate(['auth']);
          this.isAuthenticatedEvent.next(null);
        },
        error: (error) => {
          this.alertService.failureAlertEvent.next(error.error.message);
        },
      });
  }

  getUser(): User {
    if (this.user !== null) {
      return Object.create(this.user);
    }
    return null;
  }
}
