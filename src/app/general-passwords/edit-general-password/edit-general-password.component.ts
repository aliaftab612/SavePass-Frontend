import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgForm } from '@angular/forms';
import { GeneralPassword } from '../general-password.model';
import { GeneralPasswordsDataStorageService } from '../general-passwords-data-storage.service';

import { v4 as uuidv4 } from 'uuid';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-edit-general-password',
  templateUrl: './edit-general-password.component.html',
  styleUrls: ['./edit-general-password.component.css'],
})
export class EditGeneralPasswordComponent implements OnInit {
  generalPassword: GeneralPassword = new GeneralPassword('', '', '', '');
  editMode: boolean = false;

  constructor(
    private generalPasswordDataStorageService: GeneralPasswordsDataStorageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    let generalPasswordId: string;

    if (this.router.url.includes('edit')) {
      this.editMode = true;
      generalPasswordId = this.route.snapshot.params['id'];

      this.generalPasswordDataStorageService
        .getGeneralPassword(generalPasswordId)
        .subscribe((generalPassword) => {
          if (generalPassword != null) {
            this.generalPassword = generalPassword;
          } else {
            this.router.navigate(['/not-found'], {
              queryParams: {
                message: `General Password with ID: ${generalPasswordId} Not Found!`,
              },
            });
          }
        });
    }
  }

  saveGeneralPassword(form: NgForm) {
    if (form.valid === true) {
      if (this.generalPassword.id === '') {
        this.generalPasswordDataStorageService
          .addGeneralPassword(
            new GeneralPassword(
              uuidv4(),
              form.value.website,
              form.value.username,
              form.value.password
            )
          )
          .subscribe(() => {
            this.router.navigate(['/general-passwords']);
          });
      } else {
        this.generalPasswordDataStorageService
          .addGeneralPassword(
            new GeneralPassword(
              this.generalPassword.id,
              form.value.website,
              form.value.username,
              form.value.password
            )
          )
          .subscribe(() => {
            this.router.navigate(['/general-passwords']);
          });
      }
    }
  }

  onCancel() {
    this.router.navigate(['/general-passwords']);
  }
}
