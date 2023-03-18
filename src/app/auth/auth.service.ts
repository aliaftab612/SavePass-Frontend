import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Observable, Subject } from 'rxjs';
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
  isAuthenticatedEvent: Subject<User> = new Subject<User>();
  private autoLogoutTimer: any;

  autoLogin = new Observable((subscriber) => {
    if (this.refershToken() != null) {
      this.refershToken().subscribe(
        (authData) => {
          this.getUserData(authData.id_token).subscribe(
            (userData) => {
              this.storeUserData(userData, authData.id_token);
              subscriber.complete();
            },
            () => {
              subscriber.complete();
            }
          );
        },
        () => {
          subscriber.complete();
        }
      );
    } else {
      subscriber.complete();
    }
  });

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
        (data: LoginResponse) => {
          this.initAppAfterAuthentication(data);
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
        (data: SignUpResponse) => {
          this.initAppAfterAuthentication(data, true);
        },
        (error) => {
          this.alertService.failureAlertEvent.next(error.error.error.message);
        }
      );
  }

  getUserData(idToken: string): Observable<any> {
    return this.http.post<any>(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${environment.firebaseApiKey}`,
      { idToken }
    );
  }

  updateUserData(firstName: string, lastName: string, profilePhotoUrl: string) {
    const displayName =
      lastName !== '' ? firstName + ' ' + lastName : firstName;
    const idToken = this.user.token;

    this.http
      .post<any>(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${environment.firebaseApiKey}`,
        { idToken, displayName, photoUrl: profilePhotoUrl }
      )
      .subscribe(
        (userProfileResponse: any) => {
          this.storeUserData(userProfileResponse, idToken, true);
          this.isAuthenticatedEvent.next(Object.create(this.user));
          this.router.navigate(['general-passwords']);
          this.alertService.successAlertEvent.next(
            'Profile Updated Successfully!'
          );
        },
        (error) => {
          this.alertService.failureAlertEvent.next(error.error.error.message);
        }
      );
  }

  storeUserData(userData: any, idToken: string, isSignUp: boolean = false) {
    if (isSignUp) {
      this.user.name = userData.displayName;
      this.user.photoUrl = userData.photoUrl;
    } else {
      this.user = new User(
        userData.users[0].email,
        userData.users[0].localId,
        idToken,
        userData.users[0].displayName,
        userData.users[0].photoUrl
      );
    }
  }

  initAppAfterAuthentication(authData: any, isSignUp = false) {
    this.cookies.set(
      'refreshToken',
      authData.refreshToken,
      365,
      null,
      null,
      true
    );
    this.autoLogout(Number(authData.expiresIn) * 1000);

    let userDataObservable = this.getUserData(authData.idToken);

    userDataObservable.subscribe(
      (userData: any) => {
        this.storeUserData(userData, authData.idToken);
        this.isAuthenticatedEvent.next(Object.create(this.user));
        if (isSignUp) {
          this.router.navigate(['update-profile'], {
            queryParams: { issignup: true },
          });
        } else {
          this.router.navigate(['general-passwords']);
        }
      },
      (error) => {
        this.alertService.failureAlertEvent.next(error.error.error.message);
        this.clearAutoLogoutTimer();
      }
    );
  }

  logout() {
    this.user = null;
    this.cookies.delete('refreshToken');
    this.router.navigate(['auth']);
    this.isAuthenticatedEvent.next(null);
    this.clearAutoLogoutTimer();
  }

  autoLogout(time: number) {
    this.autoLogoutTimer = setTimeout(() => {
      this.refershToken() == null
        ? this.logout()
        : this.refershToken().subscribe(
            (data) => {
              this.user.token = data.id_token;
              this.isAuthenticatedEvent.next(Object.create(this.user));
              this.autoLogout(Number(data.expires_in) * 1000);
            },
            (error) => {
              this.logout();
              this.alertService.failureAlertEvent.next(
                error.error.error.message
              );
            }
          );
    }, time);
  }

  refershToken(): Observable<any> {
    if (this.cookies.check('refreshToken')) {
      const refreshToken = this.cookies.get('refreshToken');

      return this.http.post<any>(
        `https://securetoken.googleapis.com/v1/token?key=${environment.firebaseApiKey}`,
        { grant_type: 'refresh_token', refresh_token: refreshToken }
      );
    } else {
      return null;
    }
  }

  getUser(): User {
    if (this.user !== null) {
      return Object.create(this.user);
    }
    return null;
  }

  clearAutoLogoutTimer() {
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
    }
    this.autoLogoutTimer = null;
  }
}
