import { Component, ComponentRef, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { EncryptVaultEncryptionKeyResult, ModalOutput } from 'index';
import { ModalContent } from 'src/app/modal/modal-content.interface';
import { ModalComponent } from 'src/app/modal/modal.component';
import { AuthService } from 'src/app/auth/auth.service';
import { PasswordlessService } from 'passkeys-prf-client';
import { ToastrService } from 'ngx-toastr';
import { handleError } from '../../../../shared/PassskeyAuthErrorHandler';
import { CryptoHelper } from 'src/app/shared/crypto-helper';
import { DEFAULT_HASH_ITERATIONS } from 'src/app/auth/auth-defaults.enum';
import { PassekysRegistrationSetupDataService } from './passekys-registration-setup-data.service';

@Component({
  selector: 'app-passekys-registration-setup',
  templateUrl: './passekys-registration-setup.component.html',
  styleUrls: ['./passekys-registration-setup.component.css'],
})
export class PassekysRegistrationSetupComponent
  implements ModalContent, OnDestroy
{
  modalData: any;
  modalComponentRef: ComponentRef<ModalComponent>;
  @ViewChild('form') form: NgForm;
  formSubmitted = false;
  worker: Worker = null;

  constructor(
    private authService: AuthService,
    private passwordlessService: PasswordlessService,
    private toaster: ToastrService,
    private dataService: PassekysRegistrationSetupDataService
  ) {}
  ngOnDestroy(): void {
    this.modalData = null;
    this.passwordlessService.signupOrSigninAbort();
  }

  async submit(): Promise<ModalOutput> {
    this.formSubmitted = true;

    if (this.form.valid) {
      const { error, prfKey, passkeyCredentialId } =
        await this.passwordlessService.signup(
          '',
          '',
          true,
          this.authService.getToken().split(' ')[1],
          this.form.value.passkeyNickname,
          {
            password: this.modalData.loginHash,
            isPasskeyReAuth: this.modalData.isPasskeyReAuth,
          }
        );

      if (error) {
        const errMessage = handleError(error);

        if (errMessage) {
          this.toaster.error(errMessage);
        }
        return { action: false };
      }

      try {
        const {
          publicRSAKey,
          encryptedPrivateRSAKey,
          encryptedVaultEncryptionKey,
        } = await this.encryptVaultKeyUsingPrfKey(prfKey);

        const passkeyEncryptedEncryptionKeyId =
          await this.dataService.savePasskeyPrfEncryptedVaultEncryptionKey(
            passkeyCredentialId,
            publicRSAKey,
            encryptedPrivateRSAKey,
            encryptedVaultEncryptionKey,
            this.modalData.loginHash,
            this.modalData.isPasskeyReAuth
          );
      } catch (err: any) {
        if (err?.status == 401) {
          this.authService.logout();
          return { action: false };
        }

        const { error: passkeyDeletionError } =
          await this.passwordlessService.deleteUserPasskeyCredential(
            passkeyCredentialId,
            {
              password: this.modalData.loginHash,
              isPasskeyReAuth: this.modalData.isPasskeyReAuth,
            },
            this.authService.getToken().split(' ')[1]
          );

        if (passkeyDeletionError) handleError(passkeyDeletionError);

        this.toaster.error(err.error ? err.error.message : err.message);
        return { action: false };
      }

      this.toaster.success('Passkey Created!');

      return { action: true };
    } else {
      return { action: false };
    }
  }

  private async encryptVaultKeyUsingPrfKey(
    prfKey: string
  ): Promise<EncryptVaultEncryptionKeyResult> {
    return new Promise(async (resolve, reject) => {
      if (typeof Worker !== 'undefined') {
        if (!this.worker) {
          this.worker = new Worker(
            new URL('./passkeys-registration-setup.worker', import.meta.url)
          );
        }

        this.worker.onmessage = ({ data }) => {
          resolve(data.result);
        };
        this.worker.onerror = (err) => {
          reject(err);
        };
        this.worker.postMessage({
          prfKey,
          vaultEncryptionKey: this.authService.getEncryptionKey(),
          salt: this.authService.getUser().email,
          hashIterations: DEFAULT_HASH_ITERATIONS,
        });
      } else {
        try {
          const result =
            await CryptoHelper.encryptVaultEncryptionKeyUsingPasskeyPrfKey(
              prfKey,
              this.authService.getEncryptionKey(),
              this.authService.getUser().email,
              DEFAULT_HASH_ITERATIONS
            );

          resolve(result);
        } catch (err: any) {
          reject(err);
        }
      }
    });
  }
}
