import {
  Component,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ModalOutput } from 'index';
import { ModalContent } from 'src/app/modal/modal-content.interface';
import { ModalComponent } from 'src/app/modal/modal.component';
import { AuthService } from 'src/app/auth/auth.service';
import { NgForm } from '@angular/forms';
import { TotpAuthenticationSetupService } from './totp-authenticator-setup.service';
import { ToastrService } from 'ngx-toastr';
import { IconDefinition, faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-totp-authentication-setup',
  templateUrl: './totp-authentication-setup.component.html',
  styleUrls: ['./totp-authentication-setup.component.css'],
})
export class TotpAuthenticationSetupComponent
  implements ModalContent, OnInit, OnDestroy
{
  @ViewChild('form') form: NgForm;
  modalData: any;
  modalComponentRef: ComponentRef<ModalComponent>;
  formSubmitted = false;
  secret: string;
  isAuthenticatorEnabled: boolean;
  spinnerIcon: IconDefinition = faSpinner;
  getAuthenticatorInProgress = true;
  secretQrCode: string;

  constructor(
    private authService: AuthService,
    private totpAuthSetupService: TotpAuthenticationSetupService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.getAuthenticator();
  }

  getAuthenticator() {
    this.totpAuthSetupService
      .getAuthenticator(this.modalData.loginHash)
      .subscribe({
        next: (data) => {
          this.secret = data.data.secret;
          this.isAuthenticatorEnabled = data.data.enabled;
          this.getAuthenticatorInProgress = false;
          this.secretQrCode = `otpauth://totp/SavePass:${
            this.authService.getUser().email
          }?secret=${this.secret}&issuer=SavePass`;

          this.modalComponentRef.instance.submitButtonName = this
            .isAuthenticatorEnabled
            ? 'Disable'
            : 'Enable';
          this.modalComponentRef.instance.submitEnabled = true;
        },
        error: (err) => {
          if (err.status == 401) {
            this.authService.logout();
            return;
          }
          this.toastr.error(err.error.message);
        },
      });
  }

  async submit(): Promise<ModalOutput> {
    this.formSubmitted = true;

    if (this.form.valid) {
      if (this.isAuthenticatorEnabled) {
        try {
          const status = await this.disableAuthenticator();
          return { action: true, data: { authenticatorAppEnabled: status } };
        } catch {
          return { action: false };
        }
      } else {
        try {
          const status = await this.enableAuthenticator(this.form.value.token);
          return { action: true, data: { authenticatorAppEnabled: status } };
        } catch {
          return { action: false };
        }
      }
    } else {
      return { action: false };
    }
  }

  disableAuthenticator() {
    return new Promise((resolve, reject) => {
      this.totpAuthSetupService
        .disableAuthenticator(this.modalData.loginHash)
        .subscribe({
          next: (data) => {
            this.toastr.success('2FA with Authenticator App Disabled!');
            resolve(data.data.enabled);
          },
          error: (err) => {
            if (err.status == 401) {
              this.authService.logout();
              return;
            }
            this.toastr.error(err.error.message);
            reject();
          },
        });
    });
  }

  enableAuthenticator(token: string) {
    return new Promise((resolve, reject) => {
      this.totpAuthSetupService
        .enableAuthenticator(this.modalData.loginHash, this.secret, token)
        .subscribe({
          next: (data) => {
            this.toastr.success('2FA with Authenticator App Enabled!');
            resolve(data.data.enabled);
          },
          error: (err) => {
            if (err.status == 401) {
              this.authService.logout();
              return;
            }
            this.toastr.error(err.error.message);
            reject();
          },
        });
    });
  }

  ngOnDestroy(): void {
    this.modalData = null;
    this.secret = null;
    this.secretQrCode = null;
  }
}
