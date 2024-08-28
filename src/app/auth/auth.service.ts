import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { User } from './user.model';
import { environment } from 'src/environments/environment';
import {
  AuthenticationHashedKeys,
  LoginSignupResponse,
  PasskeyEncryptedEncryptionKey,
  PasskeyEncryptedEncryptionKeyHTTPResponse,
  PreLoginResponse,
  UpdateAppLockoutTime,
  UserDataResponse,
} from 'index';
import { Location } from '@angular/common';
import { CryptoHelper } from '../shared/crypto-helper';
import { UserIdleService } from 'angular-user-idle';
import {
  DEFAULT_HASH_ITERATIONS,
  TwoFactorProviders,
  errTypes,
} from './auth-defaults.enum';
import { ToastrService } from 'ngx-toastr';
import { PasskeysAuthError, PasswordlessService } from 'passkeys-prf-client';
import { handleError } from '../shared/PassskeyAuthErrorHandler';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User = null;
  private encryptionKey: string = null;
  isAuthenticatedEvent: Subject<User> = new Subject<User>();
  isAuthenticationFailed: Subject<boolean> = new Subject<boolean>();
  authWorker: Worker = null;
  passkeyAuthWorker: Worker = null;
  private token: string = null;
  private localAuthorizationHash: string = null;
  isUnlockEventStarted: Subject<boolean> = new Subject<boolean>();
  isLockedEvent: Subject<boolean> = new Subject<boolean>();
  isProfileUpdateEventStarted: Subject<boolean> = new Subject<boolean>();
  private onTimerStartSubscription: Subscription;
  private onTimeoutSubscription: Subscription;
  private hashIterations: number = null;
  isLockTimeUpdateInProgress: Subject<boolean> = new Subject<boolean>();
  private tempEmail: string = null;
  private tempLoginHash: string = null;
  private twoFactorSessionTimeout: NodeJS.Timeout = null;
  private signedInUsingPasskey = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private _location: Location,
    private userIdle: UserIdleService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private passwordlessService: PasswordlessService
  ) {}

  autoLogin = new Observable((subscriber) => {
    if (sessionStorage.getItem('token')) {
      this.token = 'Bearer ' + sessionStorage.getItem('token');
      this.localAuthorizationHash = sessionStorage.getItem(
        'localAuthorizationHash'
      );
      this.hashIterations = +sessionStorage.getItem('hashIterations');
      this.signedInUsingPasskey =
        sessionStorage.getItem('signedInUsingPasskey') === 'true';

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

  async signInUsingPasskey(email: string) {
    try {
      clearTimeout(this.twoFactorSessionTimeout);
      this.tempEmail = null;
      this.tempLoginHash = null;

      const { prfKey, passkeyCredentialId, authToken, username, error } =
        await this.passwordlessService.signinWithAlias(email, true);

      if (error) throw error;

      this.token = 'Bearer ' + authToken;
      sessionStorage.setItem('token', authToken);

      await this.generateEncyptionKeyUsingPasskey(
        prfKey,
        passkeyCredentialId,
        username,
        true
      );

      this.hashIterations = await this.getUserHashIterations(username);
      sessionStorage.setItem('hashIterations', this.hashIterations.toString());
      this.signedInUsingPasskey = true;
      sessionStorage.setItem(
        'signedInUsingPasskey',
        this.signedInUsingPasskey.toString()
      );

      this.initAppAfterAuthentication();
    } catch (err: any) {
      this.isAuthenticationFailed.next(true);

      let errMsg;
      if (err instanceof PasskeysAuthError) {
        errMsg = handleError(err);
      } else if (err?.status) {
        errMsg = err.error.message;
      } else if (err?.message) {
        errMsg = err.message;
      } else {
        errMsg = 'Something went wrong! Please try again.';
      }

      this.toastr.error(errMsg);
      this.removeSensitiveInfoWhenAuthFails();
    }
  }

  private getUserHashIterations(email: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.getPreLoginConfig(email).subscribe({
        next: (data: PreLoginResponse) => {
          resolve(data.data.hashIterations);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  authenticate(
    email: string,
    password: string,
    localAuthorization: boolean,
    isSignUp: boolean = false
  ) {
    clearTimeout(this.twoFactorSessionTimeout);
    this.tempEmail = null;
    this.tempLoginHash = null;

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

  private async storeHashesAndKeysAndDoFuthurAuthentication(
    data: AuthenticationHashedKeys,
    localAuthorization: boolean,
    isSignUp: boolean,
    email: string
  ) {
    if (localAuthorization || this.signedInUsingPasskey) {
      const loginHash = data.localLoginHash;

      if (
        this.signedInUsingPasskey
          ? await this.veryLoginHash(data.loginHash)
          : loginHash === sessionStorage.getItem('localAuthorizationHash')
      ) {
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
    isSignUp = false,
    twoFactorProvider?: TwoFactorProviders,
    twoFactorVerificationCode?: string,
    isTwoFactorAuth = false
  ) {
    const authRequestBody: any = {
      email,
      password: loginHash,
      hashIterations: this.hashIterations,
    };

    if (twoFactorProvider && twoFactorVerificationCode) {
      authRequestBody.twoFactorProvider = twoFactorProvider;
      authRequestBody.twoFactorVerificationCode = twoFactorVerificationCode;
    }

    this.http
      .post<LoginSignupResponse>(
        `${environment.serverBaseUrl}/api/v1/${isSignUp ? 'signup' : 'login'}`,
        authRequestBody
      )
      .subscribe({
        next: (data: LoginSignupResponse) => {
          this.tempEmail = null;
          this.tempLoginHash = null;
          clearTimeout(this.twoFactorSessionTimeout);

          this.token = 'Bearer ' + data.token;
          sessionStorage.setItem('token', data.token);
          this.signedInUsingPasskey = false;
          sessionStorage.setItem(
            'signedInUsingPasskey',
            this.signedInUsingPasskey.toString()
          );
          this.initAppAfterAuthentication(isSignUp);
        },
        error: (error) => {
          if (error.error.errType === errTypes.twoFactorRequired) {
            return this.setTempAuthInfoAndNavigateTo2faAuth(loginHash, email);
          }

          if (!isTwoFactorAuth) {
            this.removeSensitiveInfoWhenAuthFails();
          }
          this.isAuthenticationFailed.next(true);
          this.toastr.error(error.error.message);
        },
      });
  }

  canceltwoFactorAuthentication() {
    clearTimeout(this.twoFactorSessionTimeout);
    this.removeSensitiveInfoWhenAuthFails();
    this.router.navigate(['auth']);
  }

  canNavigateFor2fa(): boolean {
    return this.tempEmail !== null && this.tempLoginHash !== null;
  }

  twoFactorAuthentication(
    twoFactorProvider: TwoFactorProviders,
    twoFactorVerificationCode: string
  ) {
    if (this.tempEmail === null && this.tempLoginHash === null) {
      this.isAuthenticationFailed.next(true);
      this.toastr.error(
        'Your session has timed out. Please go back and try logging in again.'
      );
      return;
    }
    this.sendAuthenticationRequest(
      this.tempEmail,
      this.tempLoginHash,
      false,
      twoFactorProvider,
      twoFactorVerificationCode,
      true
    );
  }

  private setTempAuthInfoAndNavigateTo2faAuth(
    loginHash: string,
    email: string
  ) {
    this.tempEmail = email;
    this.tempLoginHash = loginHash;
    this.router.navigate(['2fa']);
    this.twoFactorSessionTimeout = setTimeout(() => {
      this.removeSensitiveInfoWhenAuthFails();
    }, 2 * 60 * 1000);
  }

  private removeSensitiveInfoWhenAuthFails() {
    this.tempEmail = null;
    this.tempLoginHash = null;
    this.user = null;
    this.encryptionKey = null;
    this.token = null;
    this.hashIterations = null;
    this.localAuthorizationHash = null;
    this.signedInUsingPasskey = false;
    sessionStorage.clear();
  }

  getUserData(): Observable<UserDataResponse> {
    return this.http.get<UserDataResponse>(
      `${environment.serverBaseUrl}/api/v1/user`,
      {
        headers: { Authorization: this.token },
      }
    );
  }

  verifyMasterPassword(password: string, email: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (typeof Worker !== 'undefined') {
        if (!this.authWorker) {
          this.authWorker = new Worker(
            new URL('./auth.worker', import.meta.url)
          );
        }

        this.authWorker.onmessage = async ({ data }) => {
          if (
            this.signedInUsingPasskey
              ? await this.veryLoginHash(data.keys.loginHash)
              : data.keys.localLoginHash === this.localAuthorizationHash
          ) {
            resolve(data.keys.loginHash);
          } else {
            reject();
          }
        };
        this.authWorker.postMessage({
          password,
          username: email,
          iterations: this.hashIterations,
          localAuthorizationHash: false,
        });
      } else {
        const keys = CryptoHelper.generateEncryptionKeyAndLoginHash(
          password,
          email,
          this.hashIterations,
          false
        );

        if (
          this.signedInUsingPasskey
            ? await this.veryLoginHash(keys.loginHash)
            : keys.localLoginHash === this.localAuthorizationHash
        ) {
          resolve(keys.loginHash);
        } else {
          reject();
        }
      }
    });
  }

  updateUserData(firstName: string, lastName: string) {
    this.isProfileUpdateEventStarted.next(true);
    this.http
      .patch<UserDataResponse>(
        `${environment.serverBaseUrl}/api/v1/user`,
        { firstName, lastName },
        {
          headers: { Authorization: this.token },
        }
      )
      .subscribe({
        next: (userData: UserDataResponse) => {
          this.user = userData.data.user;
          this.isAuthenticatedEvent.next(Object.create(this.user));

          this.toastr.success('Profile Updated Successfully!');
          this.isProfileUpdateEventStarted.next(false);
        },
        error: (error) => {
          if (error.status == 401) {
            this.logout();
            return;
          }
          this.isProfileUpdateEventStarted.next(false);
          this.toastr.error(error.error.message);
        },
      });
  }

  updateUserObject(user: User) {
    this.user = user;
  }

  initAppAfterAuthentication(isSignUp = false) {
    this.getUserData().subscribe({
      next: (userData: { status: string; data: { user: User } }) => {
        this.user = userData.data.user;
        this.isAuthenticatedEvent.next(Object.create(this.user));
        this.startInactivityLockTimer();

        isSignUp
          ? this.router.navigate(['settings'])
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
      .subscribe();

    this.user = null;
    this.encryptionKey = null;
    this.token = null;
    this.hashIterations = null;
    this.localAuthorizationHash = null;
    this.signedInUsingPasskey = false;
    sessionStorage.clear();

    if (this.onTimeoutSubscription || this.onTimerStartSubscription) {
      this.stopInactivityLockTimer();
    }

    this.router.navigate(['auth']);
    this.isAuthenticatedEvent.next(null);
    this.isLockedEvent.next(false);
  }

  regenerateEncryptionKeyAndUnlock(password: string, email: string) {
    this.isUnlockEventStarted.next(true);
    this.authenticate(email, password, !this.signedInUsingPasskey);
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
          this.toastr.success('Updated Lock Time Successfully!');
          this.isLockTimeUpdateInProgress.next(false);
        },
        error: (error) => {
          this.startInactivityLockTimer();
          if (error.status == 401) {
            this.logout();
            return;
          }
          this.isLockTimeUpdateInProgress.next(false);
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

  async generateEncyptionKeyUsingPasskey(
    prfkey: string,
    credentialId: string,
    email: string,
    isSignIn = false
  ) {
    try {
      const passkeyEncryptedEncryptionKey =
        await this.getPasskeyEncryptedEncryptionKey(credentialId);

      this.encryptionKey = await this.decryptVaultKeyUsingPrfKey(
        prfkey,
        passkeyEncryptedEncryptionKey,
        email
      );

      if (!this.encryptionKey)
        throw new Error('Error generating encryption key!');

      if (!isSignIn) {
        this.startInactivityLockTimer();
        this.isLockedEvent.next(false);
        this.isUnlockEventStarted.next(false);
        this._location.back();
        return;
      }
    } catch (err: any) {
      if (!isSignIn) {
        this.isUnlockEventStarted.next(false);
      } else {
        throw err;
      }

      if (err.status) {
        if (err.status == 401) {
          this.logout();
          return;
        }
        this.toastr.error(err.error.message);
      } else {
        this.toastr.error(err.message);
      }
    }
  }

  private async decryptVaultKeyUsingPrfKey(
    prfKey: string,
    passkeyEncryptedEncryptionKey: PasskeyEncryptedEncryptionKey,
    email: string
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (typeof Worker !== 'undefined') {
        if (!this.passkeyAuthWorker) {
          this.passkeyAuthWorker = new Worker(
            new URL('./passkeyAuth.worker.ts', import.meta.url)
          );
        }

        this.passkeyAuthWorker.onmessage = ({ data }) => {
          resolve(data.result);
        };
        this.passkeyAuthWorker.onerror = (err) => {
          reject(err);
        };
        this.passkeyAuthWorker.postMessage({
          prfKey,
          passkeyEncryptedEncryptionKey,
          salt: email,
          hashIterations: DEFAULT_HASH_ITERATIONS,
        });
      } else {
        try {
          const result =
            await CryptoHelper.decryptVaultEncryptionKeyUsingPasskeyPrfKey(
              prfKey,
              passkeyEncryptedEncryptionKey,
              this.getUser().email,
              DEFAULT_HASH_ITERATIONS
            );

          resolve(result);
        } catch (err: any) {
          reject(err);
        }
      }
    });
  }

  private getPasskeyEncryptedEncryptionKey(
    credentialId: string
  ): Promise<PasskeyEncryptedEncryptionKey> {
    return new Promise((resolve, reject) => {
      this.http
        .get<PasskeyEncryptedEncryptionKeyHTTPResponse>(
          `${environment.serverBaseUrl}/api/v1/passkeys-auth/passkey-encrypted-encryption-key/${credentialId}`,
          {
            headers: { Authorization: this.token },
          }
        )
        .subscribe({
          next: (data) => {
            resolve(data.data);
          },
          error: (err: any) => {
            reject(err);
          },
        });
    });
  }

  isUserSignedInUsingPasskey(): boolean {
    return this.signedInUsingPasskey ?? false;
  }

  abortPasskeyAuth() {
    this.passwordlessService.signupOrSigninAbort();
  }

  private async veryLoginHash(loginHash: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.http
        .post(
          `${environment.serverBaseUrl}/api/v1/verify-password`,
          {
            password: loginHash,
          },
          {
            headers: { Authorization: this.token },
          }
        )
        .subscribe({
          next: () => {
            resolve(true);
          },
          error: () => {
            resolve(false);
          },
        });
    });
  }
}
