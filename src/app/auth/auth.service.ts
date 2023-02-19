import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AlertService } from '../alert/alert.service';
import { User } from './user.model';

interface LoginResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered: boolean;
}

interface SignUpResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User = null;
  isAuthenticatedEvent: Subject<boolean> = new Subject<boolean>();
  private autoLogoutTimer: any;

  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    private router: Router,
    private cookies: CookieService
  ) {}

  login(email: string, password: string) {
    this.http
      .post<LoginResponse>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseApiKey}`,
        { email, password, returnSecureToken: true }
      )
      .subscribe(
        (userData: LoginResponse) => {
          this.user = new User(
            userData.email,
            userData.localId,
            userData.idToken,
            new Date(Date.now() + Number(userData.expiresIn) * 1000).getTime()
          );
          this.cookies.set(
            'userData',
            JSON.stringify(this.user),
            new Date(Date.now() + Number(userData.expiresIn) * 1000),
            null,
            null,
            true
          );
          this.isAuthenticatedEvent.next(this.isAuthenticated());
          this.autoLogout(Number(userData.expiresIn) * 1000);
          this.router.navigate(['general-passwords']);
        },
        (error) => {
          this.alertService.failureAlertEvent.next(error.error.error.message);
        }
      );
  }

  signUp(email: string, password: string) {
    this.http
      .post<SignUpResponse>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseApiKey}`,
        { email, password, returnSecureToken: true }
      )
      .subscribe(
        (userData: SignUpResponse) => {
          this.user = new User(
            userData.email,
            userData.localId,
            userData.idToken,
            new Date(Date.now() + Number(userData.expiresIn) * 1000).getTime()
          );
          this.cookies.set(
            'userData',
            JSON.stringify(this.user),
            new Date(Date.now() + Number(userData.expiresIn) * 1000),
            null,
            null,
            true
          );
          this.isAuthenticatedEvent.next(this.isAuthenticated());
          this.autoLogout(Number(userData.expiresIn) * 1000);
          this.router.navigate(['general-passwords']);
        },
        (error) => {
          this.alertService.failureAlertEvent.next(error.error.error.message);
        }
      );
  }

  isAuthenticated() {
    if (this.user) {
      return true;
    } else if (this.cookies.check('userData')) {
      this.user = JSON.parse(this.cookies.get('userData'));
      return true;
    }
    return false;
  }

  logout() {
    this.user = null;
    this.cookies.delete('userData');
    this.router.navigate(['auth']);
    this.isAuthenticatedEvent.next(this.isAuthenticated());
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
    }
    this.autoLogoutTimer = null;
  }

  autoLogout(time: number) {
    this.autoLogoutTimer = setTimeout(() => this.logout(), time);
  }

  autoLogin() {
    if (this.isAuthenticated()) {
      this.autoLogout(this.user.tokenExpireMillisecondsDate - Date.now());
      this.router.navigate(['general-passwords']);
    }
  }

  getUser(): User {
    return Object.create(this.user);
  }
}
