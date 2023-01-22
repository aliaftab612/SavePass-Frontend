import { Component, EventEmitter, Output } from '@angular/core';
import { NgForm } from '@angular/forms';
import { GeneralPassword } from '../general-password.model';
import { GeneralPasswordsDataStorageService } from '../general-passwords-data-storage.service';

import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-edit-general-password',
  templateUrl: './edit-general-password.component.html',
  styleUrls: ['./edit-general-password.component.css'],
})
export class EditGeneralPasswordComponent {
  @Output() switchToDisplayListMode = new EventEmitter();
  constructor(
    private generalPasswordDataStorageService: GeneralPasswordsDataStorageService
  ) {}

  saveGeneralPassword(form: NgForm) {
    if (form.valid === true) {
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
          this.switchToDisplayListMode.emit();
        });
    }
  }

  onCancel() {
    this.switchToDisplayListMode.emit();
  }
}
