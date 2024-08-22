import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  IconDefinition,
  faCheck,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import {
  TwoFactorProvidersEnabledStatusResponse,
  TwoFactorProvidersEnabledStatus,
} from 'index';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/auth/auth.service';
import { ModalService } from 'src/app/modal/modal.service';
import { VerifyMasterPasswordComponent } from 'src/app/verify-master-password/verify-master-password.component';
import { environment } from 'src/environments/environment';
import { TotpAuthenticationSetupComponent } from './totp-authentication-setup/totp-authentication-setup.component';
import { PassekysRegistrationSetupComponent } from './passkeys-registration-setup/passekys-registration-setup/passekys-registration-setup.component';
import { PasswordlessService } from 'passkeys-prf-client';
import { PasskeyCredential } from 'passkeys-prf-client/dist/types';
import { handleError } from 'src/app/shared/PassskeyAuthErrorHandler';
import aaguids from './../../../assets/aaguid.json';
import PasskeyReAuthScopes from 'src/app/shared/passkeyReAuthScopes';

@Component({
  selector: 'app-two-factor',
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.css'],
  host: {
    class: 'ml-8 w-full',
  },
  providers: [ModalService],
})
export class TwoFactorComponent implements OnInit {
  checkIcon: IconDefinition = faCheck;
  spinnerIcon: IconDefinition = faSpinner;
  twoFactorProvidersEnabledStatus: TwoFactorProvidersEnabledStatus;
  isPasskeysSupportedByBrowser = true;
  userPasskeyCredentials: PasskeyCredential[];
  isPasskeyCredentialsLoading: boolean = true;
  passkeyProviderDetails: any = aaguids;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private toastr: ToastrService,
    private modalService: ModalService,
    private passwordlessService: PasswordlessService
  ) {}

  ngOnInit() {
    try {
      this.passwordlessService.isBrowserSupported();
    } catch {
      this.isPasskeysSupportedByBrowser = false;
    }

    this.getPasskeyCredentials();

    this.http
      .get<TwoFactorProvidersEnabledStatusResponse>(
        `${environment.serverBaseUrl}/api/v1/two-factor`,
        {
          headers: { Authorization: this.authService.getToken() },
        }
      )
      .subscribe({
        next: (response) => {
          this.twoFactorProvidersEnabledStatus = { ...response.data };
        },
        error: (error) => {
          if (error.status == 401) {
            this.authService.logout();
            return;
          }
          this.toastr.error(error.error.message);
        },
      });
  }

  registerPasskey() {
    this.modalService
      .open(VerifyMasterPasswordComponent, {
        size: 'lg',
        title: 'Confirm Your Identity',
        submitButtonName: 'Continue',
        closeButtonName: 'Close',
        data: {
          scope: PasskeyReAuthScopes.CREATE_PASSKEY,
        },
      })
      .subscribe({
        next: (modalData) => {
          if (modalData.action) {
            this.modalService
              .open(PassekysRegistrationSetupComponent, {
                size: 'lg',
                title: 'Create a Passkey',
                submitButtonName: 'Create',
                data: {
                  loginHash: modalData.data.loginHash,
                  isPasskeyReAuth: modalData.data.isPasskeyReAuth,
                },
              })
              .subscribe({
                next: (modalData) => {
                  if (modalData.action) {
                    this.getPasskeyCredentials();
                  }
                },
              });
          }
        },
      });
  }

  private async getPasskeyCredentials() {
    this.isPasskeyCredentialsLoading = true;

    const { credentials, error } =
      await this.passwordlessService.getUserPasskeyCredentials(
        this.authService.getToken().split(' ')[1]
      );

    if (error) {
      this.toastr.error(handleError(error));
    }

    this.userPasskeyCredentials = credentials.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    this.isPasskeyCredentialsLoading = false;
  }

  deletePasskeyCredential(credentialId: string, index: number) {
    const helperText =
      this.userPasskeyCredentials.length > 1
        ? `Are you sure you want to remove (${
            this.userPasskeyCredentials.find(
              (x) => x.descriptor.id === credentialId
            ).nickname
          }) Passkey ?`
        : `You are about to remove your last passkey (${
            this.userPasskeyCredentials.find(
              (x) => x.descriptor.id === credentialId
            ).nickname
          }). You will only be able to sign in with a password`;

    this.modalService
      .open(VerifyMasterPasswordComponent, {
        title: 'Remove Passkey',
        size: 'lg',
        submitButtonName: 'Remove',
        closeButtonName: 'Cancel',
        data: {
          helperText,
          scope: PasskeyReAuthScopes.REMOVE_PASSKEY,
        },
      })
      .subscribe({
        next: async (modalData) => {
          if (modalData.action) {
            this.isPasskeyCredentialsLoading = true;

            const { error } =
              await this.passwordlessService.deleteUserPasskeyCredential(
                credentialId,
                {
                  password: modalData.data.loginHash,
                  isPasskeyReAuth: modalData.data.isPasskeyReAuth,
                },
                this.authService.getToken().split(' ')[1]
              );

            if (error) {
              this.toastr.error(handleError(error));
              this.isPasskeyCredentialsLoading = false;
              return;
            }

            this.userPasskeyCredentials.splice(index, 1);
            this.toastr.success('Passkey Deleted!');
            this.isPasskeyCredentialsLoading = false;
          }
        },
      });
  }

  manageAuthenticatorAppSetup() {
    this.modalService
      .open(VerifyMasterPasswordComponent, {
        size: 'lg',
        title: 'Confirm Your Identity',
        submitButtonName: 'Continue',
        closeButtonName: 'Close',
        data: {
          scope: PasskeyReAuthScopes.MANAGE_TOTP_2FA,
        },
      })
      .subscribe({
        next: (modalData) => {
          if (modalData.action) {
            this.modalService
              .open(TotpAuthenticationSetupComponent, {
                size: 'lg',
                title: 'Two Factor Authentication (Authenticator App)',
                closeButtonName: 'Close',
                submitEnabled: false,
                data: {
                  loginHash: modalData.data.loginHash,
                  isPasskeyReAuth: modalData.data.isPasskeyReAuth,
                },
              })
              .subscribe({
                next: (modalData) => {
                  if (modalData.action) {
                    this.twoFactorProvidersEnabledStatus = modalData.data;
                  }
                },
              });
          }
        },
      });
  }

  formatDateString(dateString: string): string {
    const date: Date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };

    let formattedDate: string = date.toLocaleString('en-US', options);

    return formattedDate;
  }
}
