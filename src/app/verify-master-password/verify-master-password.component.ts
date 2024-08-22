import {
  Component,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ModalContent } from '../modal/modal-content.interface';
import { ModalOutput } from 'index';
import { ModalComponent } from '../modal/modal.component';
import {
  IconDefinition,
  faEye,
  faEyeSlash,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth/auth.service';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PasswordlessService } from 'passkeys-prf-client';
import { handleError } from '../shared/PassskeyAuthErrorHandler';

@Component({
  selector: 'app-verify-master-password',
  templateUrl: './verify-master-password.component.html',
  styleUrls: ['./verify-master-password.component.css'],
})
export class VerifyMasterPasswordComponent
  implements ModalContent, OnDestroy, OnInit
{
  @ViewChild('form') form: NgForm;
  modalData: any;
  modalComponentRef: ComponentRef<ModalComponent>;
  passwordHiddenImg: IconDefinition = faEye;
  spinnerIcon: IconDefinition = faSpinner;
  hidePassword: boolean = true;
  formSubmitted = false;
  reAuthUsingPasskey = false;
  noPasskeyRegistered = true;
  pageLoading = true;

  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
    private passwordlessService: PasswordlessService
  ) {}
  async ngOnInit(): Promise<void> {
    this.modalComponentRef.instance.submitEnabled = false;
    const { credentials, error } =
      await this.passwordlessService.getUserPasskeyCredentials(
        this.authService.getToken().split(' ')[1]
      );
    this.pageLoading = false;
    if (error) {
      const errMessage = handleError(error);

      if (errMessage) {
        this.toastr.error(errMessage);
      }
    }

    this.modalComponentRef.instance.submitEnabled = true;

    if (credentials.length) {
      this.noPasskeyRegistered = false;
    } else {
      this.reAuthUsingPasskey = false;
    }
  }
  ngOnDestroy(): void {
    this.modalData = null;
    this.passwordlessService.signupOrSigninAbort();
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
    this.passwordHiddenImg =
      this.passwordHiddenImg === faEye ? faEyeSlash : faEye;
  }

  async submit(): Promise<ModalOutput> {
    this.formSubmitted = true;
    if (!this.reAuthUsingPasskey) {
      if (this.form.valid === true) {
        try {
          const loginHash = await this.authService.verifyMasterPassword(
            this.form.value.password,
            this.authService.getUser().email
          );
          return { action: true, data: { loginHash, isPasskeyReAuth: false } };
        } catch {
          this.toastr.error('Password verification failed!');
          return { action: false };
        }
      }
    } else {
      const { error, verifyToken } =
        await this.passwordlessService.reAuthWithAlias(
          this.authService.getUser().email,
          true,
          this.authService.getToken().split(' ')[1],
          { scope: this.modalData.scope }
        );

      if (error) {
        const errMessage = handleError(error);

        if (errMessage) {
          this.toastr.error(errMessage);
        }
        return { action: false };
      }

      return {
        action: true,
        data: { loginHash: verifyToken, isPasskeyReAuth: true },
      };
    }

    return { action: false };
  }

  changeReAuthMethod() {
    this.reAuthUsingPasskey = !this.reAuthUsingPasskey;
  }
}
