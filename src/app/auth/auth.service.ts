import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Observable, Subject } from 'rxjs';
import { AlertService } from '../alert/alert.service';
import { User } from './user.model';
import { environment } from 'src/environments/environment';
import { LoginSignupResponse, UserDataResponse } from 'index';
import { Location } from '@angular/common';
import { CryptoHelper } from '../shared/crypto-helper';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User = null;
  private encryptionKey: string = null;
  isAuthenticatedEvent: Subject<User> = new Subject<User>();
  isAuthenticationFailed: Subject<boolean> = new Subject<boolean>();
  authWorker: Worker = null;

  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    private router: Router,
    private cookies: CookieService,
    private _location: Location
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
    const hashIterations = environment.encryptionKeyHashIterations;

    if (typeof Worker !== 'undefined') {
      if (!this.authWorker) {
        this.authWorker = new Worker(new URL('./auth.worker', import.meta.url));
      }

      this.authWorker.onmessage = ({ data }) => {
        this.encryptionKey = data.keys.encryptionKey;
        const loginHash = data.keys.loginHash;

        this.sendAuthenticationRequest(email, loginHash, isSignUp);
      };
      this.authWorker.postMessage({
        password,
        username: email,
        iterations: hashIterations,
      });
    } else {
      const keys = CryptoHelper.generateEncryptionKeyAndLoginHash(
        password,
        email,
        hashIterations
      );

      this.encryptionKey = keys.encryptionKey;
      const loginHash = keys.loginHash;

      this.sendAuthenticationRequest(email, loginHash, isSignUp);
    }
  }

  private sendAuthenticationRequest(
    email: string,
    loginHash: string,
    isSignUp = false
  ) {
    this.http
      .post<LoginSignupResponse>(
        `${environment.serverBaseUrl}/api/v1/${isSignUp ? 'signup' : 'login'}`,
        {
          email,
          password: loginHash,
        },
        { withCredentials: true }
      )
      .subscribe({
        complete: () => {
          this.initAppAfterAuthentication(isSignUp);
        },
        error: (error) => {
          this.alertService.failureAlertEvent.next(error.error.message);
          this.isAuthenticationFailed.next(true);
        },
      });
  }

  getUserData(): Observable<UserDataResponse> {
    return this.http.get<UserDataResponse>(
      `${environment.serverBaseUrl}/api/v1/user`,
      {
        withCredentials: true,
      }
    );
  }

  updateUserData(
    firstName: string,
    lastName: string,
    profilePhotoUrl: string,
    isSignUp = false
  ) {
    this.http
      .patch<UserDataResponse>(
        `${environment.serverBaseUrl}/api/v1/user`,
        { firstName, lastName, profilePhotoUrl },
        { withCredentials: true }
      )
      .subscribe({
        next: (userData: UserDataResponse) => {
          this.user = userData.data.user;
          this.isAuthenticatedEvent.next(Object.create(this.user));
          if (isSignUp) {
            this.router.navigate(['general-passwords']);
          } else {
            this._location.back();
          }
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
      .get<LoginSignupResponse>(`${environment.serverBaseUrl}/api/v1/logout`, {
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

  getEncryptionKey() {
    return this.encryptionKey !== null ? `${this.encryptionKey}` : null;
  }
}
