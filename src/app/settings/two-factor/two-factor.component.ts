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
import { TotpAuthenticationSetupService } from './totp-authentication-setup/totp-authenticator-setup.service';

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

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private toastr: ToastrService,
    private modalService: ModalService,
    private totpAuthSetupService: TotpAuthenticationSetupService
  ) {}

  ngOnInit(): void {
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

  manageAuthenticatorAppSetup() {
    this.modalService
      .open(VerifyMasterPasswordComponent, {
        size: 'lg',
        title: 'Verify Password',
        submitButtonName: 'Continue',
        closeButtonName: 'Close',
      })
      .subscribe({
        next: (modalData) => {
          if (modalData.action) {
            this.totpAuthSetupService
              .getAuthenticator(modalData.data)
              .subscribe({
                next: (data) => {
                  this.modalService
                    .open(TotpAuthenticationSetupComponent, {
                      size: 'lg',
                      title: 'Two Factor Authentication (Authenticator App)',
                      submitButtonName: data.data.enabled
                        ? 'Disable'
                        : 'Enable',
                      closeButtonName: 'Close',
                      data: {
                        loginHash: modalData.data,
                        isAuthenticatorEnabled: data.data.enabled,
                        secret: data.data.secret,
                      },
                    })
                    .subscribe({
                      next: (modalData) => {
                        if (modalData.action) {
                          this.twoFactorProvidersEnabledStatus = modalData.data;
                        }
                      },
                    });
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
        },
      });
  }
}
