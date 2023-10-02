import {
  Component,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { GeneralPassword } from '../general-password.model';
import { GeneralPasswordsDataStorageService } from '../general-passwords-data-storage.service';
import { AuthService } from 'src/app/auth/auth.service';
import { GeneralPasswordResponse, ModalOutput } from 'index';
import {
  faEye,
  faEyeSlash,
  IconDefinition,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { ModalComponent } from 'src/app/modal/modal.component';
import { ModalContent } from 'src/app/modal/modal-content.interface';

@Component({
  selector: 'app-edit-general-password',
  templateUrl: './edit-general-password.component.html',
  styleUrls: ['./edit-general-password.component.css'],
})
export class EditGeneralPasswordComponent
  implements OnInit, OnDestroy, ModalContent
{
  @ViewChild('form') form: NgForm;
  generalPassword: GeneralPassword = new GeneralPassword('', '', '', '');
  generalPasswordId: string = '';
  passwordHiddenImg: IconDefinition = faEye;
  passwordCopyImg: IconDefinition = faCopy;
  hidePassword: boolean = true;
  modalData: { generalPassword: GeneralPassword };
  modalComponentRef: ComponentRef<ModalComponent>;
  formSubmitted = false;

  constructor(
    private generalPasswordDataStorageService: GeneralPasswordsDataStorageService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  private submitGeneralPassword(form: NgForm): Promise<boolean> {
    return new Promise((resolve) => {
      const generalPassword = new GeneralPassword(
        null,
        form.value.website,
        form.value.username,
        form.value.password
      );

      if (this.generalPasswordId === '') {
        this.generalPasswordDataStorageService
          .addGeneralPassword(generalPassword)
          .subscribe({
            next: (data: GeneralPasswordResponse) => {
              if (
                this.generalPasswordDataStorageService
                  .encryptedGeneralPasswords !== null
              ) {
                this.generalPasswordDataStorageService.encryptedGeneralPasswords.unshift(
                  data.data.generalPassword
                );
              }
              this.toastr.success('Created Successfully!');
              this.generalPasswordDataStorageService.encryptedGeneralPasswordsChangedEvent.next();
              resolve(true);
            },
            error: (error) => {
              if (error.status == 401) {
                this.authService.logout();
                return;
              }
              this.toastr.error(error.error.message);
              resolve(false);
            },
          });
      } else {
        this.generalPasswordDataStorageService
          .updateGeneralPassword(this.generalPasswordId, { ...generalPassword })
          .subscribe({
            next: (data: GeneralPasswordResponse) => {
              if (
                this.generalPasswordDataStorageService
                  .encryptedGeneralPasswords !== null
              ) {
                const generalPasswordIndex =
                  this.generalPasswordDataStorageService.encryptedGeneralPasswords.findIndex(
                    (ele: GeneralPassword) => ele._id === this.generalPasswordId
                  );

                this.generalPasswordDataStorageService.encryptedGeneralPasswords[
                  generalPasswordIndex
                ] = data.data.generalPassword;
              }
              this.toastr.success('Updated Successfully!');
              this.generalPasswordDataStorageService.encryptedGeneralPasswordsChangedEvent.next();
              resolve(true);
            },
            error: (error) => {
              if (error.status == 401) {
                this.authService.logout();
                return;
              }
              this.toastr.error(error.error.message);
              resolve(false);
            },
          });
      }
    });
  }

  ngOnInit(): void {
    if (this.modalData?.generalPassword) {
      this.generalPasswordId = this.modalData.generalPassword._id;
      this.generalPassword = this.modalData.generalPassword;
    }
  }

  copyPassword(password: string) {
    navigator.clipboard.writeText(password);
    this.toastr.info('Password copied');
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
    this.passwordHiddenImg =
      this.passwordHiddenImg === faEye ? faEyeSlash : faEye;
  }

  async submit(): Promise<ModalOutput> {
    this.formSubmitted = true;
    if (this.form.valid === true) {
      const action = await this.submitGeneralPassword(this.form);
      return { action };
    }
    return { action: false };
  }

  ngOnDestroy(): void {
    this.generalPassword = null;
  }
}
