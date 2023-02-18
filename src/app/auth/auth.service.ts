import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    private router: Router
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
            userData.idToken
          );
          this.isAuthenticatedEvent.next(this.isAuthenticated());

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
            userData.idToken
          );
          this.isAuthenticatedEvent.next(this.isAuthenticated());

          this.router.navigate(['general-passwords']);
        },
        (error) => {
          this.alertService.failureAlertEvent.next(error.error.error.message);
        }
      );
  }

  isAuthenticated() {
    return this.user ? true : false;
  }

  logout() {
    this.user = null;
    this.router.navigate(['auth']);
    this.isAuthenticatedEvent.next(this.isAuthenticated());
  }

  getUser(): User {
    return Object.create(this.user);
  }
}
