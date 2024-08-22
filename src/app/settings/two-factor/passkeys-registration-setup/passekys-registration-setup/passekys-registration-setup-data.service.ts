import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PassekysRegistrationSetupDataService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  public async savePasskeyPrfEncryptedVaultEncryptionKey(
    credentialId: string,
    publicRSAKey: string,
    encryptedPrivateRSAKey: string,
    encryptedVaultEncryptionKey: string,
    loginHash: string,
    isPasskeyReAuth: boolean
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.http
        .post<{
          status: string;
          data: { passkeyEncryptedEncryptionKeyId: string };
        }>(
          `${environment.serverBaseUrl}/api/v1/passkeys-auth/passkey-encrypted-encryption-key`,
          {
            credentialId,
            publicRSAKey,
            encryptedPrivateRSAKey,
            encryptedVaultEncryptionKey,
            password: loginHash,
            isPasskeyReAuth,
          },
          {
            headers: { Authorization: this.authService.getToken() },
          }
        )
        .subscribe({
          next: (value) => {
            resolve(value.data.passkeyEncryptedEncryptionKeyId);
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }
}
