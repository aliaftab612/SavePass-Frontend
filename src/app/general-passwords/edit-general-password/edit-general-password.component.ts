import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { GeneralPassword } from '../general-password.model';
import { GeneralPasswordsDataStorageService } from '../general-passwords-data-storage.service';

import { v4 as uuidv4 } from 'uuid';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AlertService } from 'src/app/alert/alert.service';

@Component({
  selector: 'app-edit-general-password',
  templateUrl: './edit-general-password.component.html',
  styleUrls: ['./edit-general-password.component.css'],
})
export class EditGeneralPasswordComponent implements OnInit, OnDestroy {
  generalPassword: GeneralPassword = new GeneralPassword('', '', '', '');
  editMode: boolean = false;
  generalPasswordId: string = '';

  constructor(
    private generalPasswordDataStorageService: GeneralPasswordsDataStorageService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes('edit')) {
      this.editMode = true;
      this.generalPasswordId = this.route.snapshot.params['id'];

      this.generalPasswordDataStorageService
        .getGeneralPassword(this.generalPasswordId)
        .subscribe(
          (generalPassword) => {
            if (generalPassword != null) {
              this.generalPassword = generalPassword;
            } else {
              this.router.navigate(['/not-found'], {
                queryParams: {
                  message: `General Password with ID: ${this.generalPasswordId} Not Found!`,
                },
              });
            }
          },
          (error) => {
            this.alertService.failureAlertEvent.next(error.message);
          }
        );
    }
  }

  saveGeneralPassword(form: NgForm) {
    if (form.valid === true) {
      if (this.generalPasswordId === '') {
        this.generalPasswordDataStorageService
          .addGeneralPassword(
            new GeneralPassword(
              uuidv4(),
              form.value.website,
              form.value.username,
              form.value.password
            )
          )
          .subscribe(
            () => {
              this.router.navigate(['/general-passwords']);
              this.alertService.successAlertEvent.next('Created Successfully!');
            },
            (error) => {
              this.alertService.failureAlertEvent.next(error.message);
            }
          );
      } else {
        this.generalPasswordDataStorageService
          .addGeneralPassword(
            new GeneralPassword(
              this.generalPasswordId,
              form.value.website,
              form.value.username,
              form.value.password
            )
          )
          .subscribe(
            (data) => {
              this.router.navigate(['/general-passwords']);
              this.alertService.successAlertEvent.next('Updated Successfully!');
            },
            (error) => {
              this.alertService.failureAlertEvent.next(error.message);
            }
          );
      }
    }
  }

  onCancel() {
    this.router.navigate(['/general-passwords']);
  }

  ngOnDestroy(): void {
    if (
      this.alertService.getDisplayAlert() &&
      !this.alertService.getSuccessAlert()
    ) {
      this.alertService.resetAlertEvent.next();
    }
  }
}
