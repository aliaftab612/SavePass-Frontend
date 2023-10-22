import { Component, ComponentRef, ViewChild } from '@angular/core';
import { ModalContent } from '../modal/modal-content.interface';
import { ModalOutput } from 'index';
import { ModalComponent } from '../modal/modal.component';
import {
  IconDefinition,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth/auth.service';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-verify-master-password',
  templateUrl: './verify-master-password.component.html',
  styleUrls: ['./verify-master-password.component.css'],
})
export class VerifyMasterPasswordComponent implements ModalContent {
  @ViewChild('form') form: NgForm;
  modalData: any;
  modalComponentRef: ComponentRef<ModalComponent>;
  passwordHiddenImg: IconDefinition = faEye;
  hidePassword: boolean = true;
  formSubmitted = false;

  constructor(
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
    this.passwordHiddenImg =
      this.passwordHiddenImg === faEye ? faEyeSlash : faEye;
  }

  async submit(): Promise<ModalOutput> {
    this.formSubmitted = true;
    if (this.form.valid === true) {
      try {
        const loginHash = await this.authService.verifyMasterPassword(
          this.form.value.password,
          this.authService.getUser().email
        );
        return { action: true, data: loginHash };
      } catch {
        this.toastr.error('Password verification failed!');
        return { action: false };
      }
    }
    return { action: false };
  }
}
