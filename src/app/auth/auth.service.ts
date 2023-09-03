import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { User } from './user.model';
import { environment } from 'src/environments/environment';
import {
  AuthenticationHashedKeys,
  LoginSignupResponse,
  PreLoginResponse,
  UpdateAppLockoutTime,
  UserDataResponse,
} from 'index';
import { Location } from '@angular/common';
import { CryptoHelper } from '../shared/crypto-helper';
import { UserIdleService } from 'angular-user-idle';
import { DEFAULT_HASH_ITERATIONS } from './auth-defaults.enum';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User = null;
  private encryptionKey: string = null;
  isAuthenticatedEvent: Subject<User> = new Subject<User>();
  isAuthenticationFailed: Subject<boolean> = new Subject<boolean>();
  authWorker: Worker = null;
  private token: string = null;
  private localAuthorizationHash: string = null;
  isUnlockEventStarted: Subject<boolean> = new Subject<boolean>();
  isLockedEvent: Subject<boolean> = new Subject<boolean>();
  isProfileUpdateEventStarted: Subject<boolean> = new Subject<boolean>();
  private onTimerStartSubscription: Subscription;
  private onTimeoutSubscription: Subscription;
  private hashIterations: number = null;
  isLockTimeUpdateInProgress: Subject<boolean> = new Subject<boolean>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private _location: Location,
    private userIdle: UserIdleService,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  autoLogin = new Observable((subscriber) => {
    if (sessionStorage.getItem('token')) {
      this.token = 'Bearer ' + sessionStorage.getItem('token');
      this.localAuthorizationHash = sessionStorage.getItem(
        'localAuthorizationHash'
      );

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

  private getPreLoginConfig(email: string): Observable<PreLoginResponse> {
    return this.http.post<PreLoginResponse>(
      `${environment.serverBaseUrl}/api/v1/prelogin`,
      {
        email,
      }
    );
  }

  authenticate(
    email: string,
    password: string,
    localAuthorization: boolean,
    isSignUp: boolean = false
  ) {
    if (isSignUp) {
      this.hashIterations = DEFAULT_HASH_ITERATIONS;
      sessionStorage.setItem(
        'hashIterations',
        DEFAULT_HASH_ITERATIONS.toString()
      );
    } else if (!this.hashIterations) {
      if (sessionStorage.getItem('hashIterations')) {
        this.hashIterations = Number(sessionStorage.getItem('hashIterations'));
      }
    }

    if (!this.hashIterations) {
      this.getPreLoginConfig(email).subscribe({
        next: (data: PreLoginResponse) => {
          this.hashIterations = data.data.hashIterations;
          sessionStorage.setItem(
            'hashIterations',
            this.hashIterations.toString()
          );

          this.authenticateOnWorkerThread(
            email,
            password,
            localAuthorization,
            isSignUp
          );
        },
        error: (error) => {
          this.toastr.error(error.error.message);
          this.isAuthenticationFailed.next(true);
        },
      });
    } else {
      this.authenticateOnWorkerThread(
        email,
        password,
        localAuthorization,
        isSignUp
      );
    }
  }

  private authenticateOnWorkerThread(
    email: string,
    password: string,
    localAuthorization: boolean,
    isSignUp: boolean = false
  ) {
    if (typeof Worker !== 'undefined') {
      if (!this.authWorker) {
        this.authWorker = new Worker(new URL('./auth.worker', import.meta.url));
      }

      this.authWorker.onmessage = ({ data }) => {
        this.storeHashesAndKeysAndDoFuthurAuthentication(
          {
            encryptionKey: data.keys.encryptionKey,
            loginHash: data.keys.loginHash,
            localLoginHash: data.keys.localLoginHash,
          },
          localAuthorization,
          isSignUp,
          email
        );
      };
      this.authWorker.postMessage({
        password,
        username: email,
        iterations: this.hashIterations,
        localAuthorizationHash: localAuthorization,
      });
    } else {
      const keys = CryptoHelper.generateEncryptionKeyAndLoginHash(
        password,
        email,
        this.hashIterations,
        localAuthorization
      );

      this.storeHashesAndKeysAndDoFuthurAuthentication(
        keys,
        localAuthorization,
        isSignUp,
        email
      );
    }
  }

  private storeHashesAndKeysAndDoFuthurAuthentication(
    data: AuthenticationHashedKeys,
    localAuthorization: boolean,
    isSignUp: boolean,
    email: string
  ) {
    if (localAuthorization) {
      const loginHash = data.localLoginHash;

      if (loginHash === sessionStorage.getItem('localAuthorizationHash')) {
        this.encryptionKey = data.encryptionKey;
        this.isUnlockEventStarted.next(false);
        this.isLockedEvent.next(false);
        this.startInactivityLockTimer();
        this._location.back();
      } else {
        this.isUnlockEventStarted.next(false);
        this.toastr.error('Wrong Password!');
      }
    } else {
      this.encryptionKey = data.encryptionKey;
      const loginHash = data.loginHash;
      this.localAuthorizationHash = data.localLoginHash;

      sessionStorage.setItem('localAuthorizationHash', data.localLoginHash);

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
          hashIterations: this.hashIterations,
        }
      )
      .subscribe({
        next: (data: LoginSignupResponse) => {
          this.token = 'Bearer ' + data.token;
          sessionStorage.setItem('token', data.token);
          this.initAppAfterAuthentication(isSignUp);
        },
        error: (error) => {
          this.user = null;
          this.encryptionKey = null;
          this.token = null;
          this.hashIterations = null;
          this.localAuthorizationHash = null;
          sessionStorage.clear();
          this.toastr.error(error.error.message);
          this.isAuthenticationFailed.next(true);
        },
      });
  }

  getUserData(): Observable<UserDataResponse> {
    return this.http.get<UserDataResponse>(
      `${environment.serverBaseUrl}/api/v1/user`,
      {
        headers: { Authorization: this.token },
      }
    );
  }

  updateUserData(
    firstName: string,
    lastName: string,
    profilePhotoUrl: string,
    isSignUp = false
  ) {
    this.isProfileUpdateEventStarted.next(true);
    this.http
      .patch<UserDataResponse>(
        `${environment.serverBaseUrl}/api/v1/user`,
        { firstName, lastName, profilePhotoUrl },
        {
          headers: { Authorization: this.token },
        }
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
          this.toastr.success('Profile Updated Successfully!');
        },
        error: (error) => {
          this.isProfileUpdateEventStarted.next(false);
          if (error.status == 401) {
            this.logout();
            return;
          }
          this.toastr.error(error.error.message);
        },
      });
  }

  initAppAfterAuthentication(isSignUp = false) {
    this.getUserData().subscribe({
      next: (userData: { status: string; data: { user: User } }) => {
        this.user = userData.data.user;
        this.isAuthenticatedEvent.next(Object.create(this.user));
        this.startInactivityLockTimer();

        isSignUp
          ? this.router.navigate(['update-profile'], {
              queryParams: { issignup: true },
            })
          : this.router.navigate(['general-passwords']);
      },
      error: (error) => {
        this.toastr.error(error.error.message);
      },
    });
  }

  logout() {
    this.http
      .get<LoginSignupResponse>(`${environment.serverBaseUrl}/api/v1/logout`, {
        headers: { Authorization: this.token },
      })
      .subscribe({
        complete: () => {
          this.user = null;
          this.encryptionKey = null;
          this.token = null;
          this.hashIterations = null;
          this.localAuthorizationHash = null;
          sessionStorage.clear();

          if (this.onTimeoutSubscription || this.onTimerStartSubscription) {
            this.stopInactivityLockTimer();
          }

          this.router.navigate(['auth']);
          this.isAuthenticatedEvent.next(null);
          this.isLockedEvent.next(false);
        },
        error: (error) => {
          this.toastr.error(error.error.message);
        },
      });
  }

  regenerateEncryptionKeyAndUnlock(password: string, email: string) {
    this.isUnlockEventStarted.next(true);
    this.authenticate(email, password, true);
  }

  lock() {
    this.encryptionKey = null;
    this.stopInactivityLockTimer();
    this.router.navigate(['lock']);
  }

  private startInactivityLockTimer() {
    this.userIdle.setConfigValues({
      idle: this.user.userSettings.appLockoutMinutes * 60,
      timeout: 1,
    });

    this.userIdle.startWatching();
    this.onTimerStartSubscription = this.userIdle.onTimerStart().subscribe();
    this.onTimeoutSubscription = this.userIdle
      .onTimeout()
      .subscribe(() => this.lock());
  }

  updateInactivityLockTime(updatedTime: number): void {
    this.isLockTimeUpdateInProgress.next(true);
    this.stopInactivityLockTimer();
    this.http
      .patch<UpdateAppLockoutTime>(
        `${environment.serverBaseUrl}/api/v1/user/updateAppLockoutTime`,
        { appLockoutMinutes: updatedTime },
        {
          headers: { Authorization: this.token },
        }
      )
      .subscribe({
        next: (data: UpdateAppLockoutTime) => {
          this.user.userSettings.appLockoutMinutes =
            data.data.appLockoutMinutes;
          this.startInactivityLockTimer();
          this._location.back();
          this.toastr.success('Update Lock Time Successfully!');
        },
        error: (error) => {
          this.startInactivityLockTimer();
          this.isLockTimeUpdateInProgress.next(false);
          if (error.status == 401) {
            this.logout();
            return;
          }
          this.toastr.error(error.error.message);
        },
      });
  }

  stopInactivityLockTimer() {
    this.userIdle.stopWatching();
    this.onTimeoutSubscription.unsubscribe();
    this.onTimerStartSubscription.unsubscribe();
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

  getToken() {
    return this.token ? this.token.split('').join('') : null;
  }

  getLocalAuthorizationHash() {
    return this.localAuthorizationHash
      ? this.localAuthorizationHash.split('').join('')
      : null;
  }
}
