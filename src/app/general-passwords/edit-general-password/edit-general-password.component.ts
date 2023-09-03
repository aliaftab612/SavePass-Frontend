import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';
import { GeneralPassword } from '../general-password.model';
import { GeneralPasswordsDataStorageService } from '../general-passwords-data-storage.service';
import { AuthService } from 'src/app/auth/auth.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { GeneralPasswordResponse } from 'index';
import { CryptoHelper } from 'src/app/shared/crypto-helper';
import {
  faEye,
  faEyeSlash,
  IconDefinition,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-general-password',
  templateUrl: './edit-general-password.component.html',
  styleUrls: ['./edit-general-password.component.css'],
})
export class EditGeneralPasswordComponent implements OnInit, OnDestroy {
  generalPassword: GeneralPassword = new GeneralPassword('', '', '', '');
  editMode: boolean = false;
  generalPasswordId: string = '';
  passwordHiddenImg: IconDefinition = faEye;
  passwordCopyImg: IconDefinition = faCopy;
  hidePassword: boolean = true;
  savingInProgress: boolean = false;

  constructor(
    private generalPasswordDataStorageService: GeneralPasswordsDataStorageService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private _location: Location,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes('edit')) {
      this.editMode = true;
      this.generalPasswordId = this.route.snapshot.params['id'];

      this.populateGeneralPasswordDetailsInEditMode();
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

  private populateGeneralPasswordDetailsInEditMode() {
    if (
      this.generalPasswordDataStorageService.encryptedGeneralPasswords !== null
    ) {
      const index =
        this.generalPasswordDataStorageService.encryptedGeneralPasswords.findIndex(
          (ele) => ele._id === this.generalPasswordId
        );

      if (index === -1) {
        this.router.navigate(['/not-found'], {
          queryParams: {
            message: `General Password with ID: ${this.generalPasswordId} Not Found!`,
          },
        });
      } else {
        const encryptedGeneralPassword = {
          ...this.generalPasswordDataStorageService.encryptedGeneralPasswords[
            index
          ],
        };

        this.generalPassword = CryptoHelper.decryptGeneralPassword(
          encryptedGeneralPassword,
          this.authService.getEncryptionKey()
        );
      }
    } else {
      this.generalPasswordDataStorageService
        .getGeneralPassword(this.generalPasswordId)
        .subscribe({
          next: (generalPassword: GeneralPasswordResponse) => {
            if (generalPassword != null) {
              this.generalPassword = CryptoHelper.decryptGeneralPassword(
                generalPassword.data.generalPassword,
                this.authService.getEncryptionKey()
              );
            } else {
              this.router.navigate(['/not-found'], {
                queryParams: {
                  message: `General Password with ID: ${this.generalPasswordId} Not Found!`,
                },
              });
            }
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
  }

  saveGeneralPassword(form: NgForm) {
    if (form.valid === true) {
      if (this.savingInProgress) return;

      this.savingInProgress = true;
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
              this.router.navigate(['/general-passwords']);
              this.toastr.success('Created Successfully!');
            },
            error: (error) => {
              if (error.status == 401) {
                this.authService.logout();
                return;
              }
              this.savingInProgress = false;
              this.toastr.error(error.error.message);
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
              this._location.back();
              this.toastr.success('Updated Successfully!');
            },
            error: (error) => {
              if (error.status == 401) {
                this.authService.logout();
                return;
              }
              this.savingInProgress = false;
              this.toastr.error(error.error.message);
            },
          });
      }
    }
  }

  onCancel() {
    this._location.back();
  }

  ngOnDestroy(): void {
    this.generalPassword = null;
  }
}
