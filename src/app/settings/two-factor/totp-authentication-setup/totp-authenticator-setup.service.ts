import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DisableAuthenticatorResponse,
  GetOrEnableAuthenticatorResponse,
} from 'index';
import { AuthService } from 'src/app/auth/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class TotpAuthenticationSetupService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  getAuthenticator(loginHash: string, isPasskeyReAuth: boolean) {
    return this.http.post<GetOrEnableAuthenticatorResponse>(
      `${environment.serverBaseUrl}/api/v1/two-factor/get-authenticator`,
      {
        password: loginHash,
        isPasskeyReAuth,
      },
      {
        headers: { Authorization: this.authService.getToken() },
      }
    );
  }

  enableAuthenticator(
    loginHash: string,
    secret: string,
    token: string,
    isPasskeyReAuth: boolean
  ) {
    return this.http.patch<GetOrEnableAuthenticatorResponse>(
      `${environment.serverBaseUrl}/api/v1/two-factor/authenticator`,
      {
        password: loginHash,
        secret,
        token,
        isPasskeyReAuth,
      },
      {
        headers: { Authorization: this.authService.getToken() },
      }
    );
  }

  disableAuthenticator(loginHash: string, isPasskeyReAuth: boolean) {
    return this.http.patch<DisableAuthenticatorResponse>(
      `${environment.serverBaseUrl}/api/v1/two-factor/disable-authenticator`,
      {
        password: loginHash,
        isPasskeyReAuth,
      },
      {
        headers: { Authorization: this.authService.getToken() },
      }
    );
  }
}
