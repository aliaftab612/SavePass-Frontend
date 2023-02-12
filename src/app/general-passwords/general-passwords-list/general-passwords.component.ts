import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/alert/alert.service';
import { GeneralPassword } from '../general-password.model';
import { GeneralPasswordsDataStorageService } from '../general-passwords-data-storage.service';
import {
  faEye,
  faEyeSlash,
  IconDefinition,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-general-passwords',
  templateUrl: './general-passwords.component.html',
  styleUrls: ['./general-passwords.component.css'],
})
export class GeneralPasswordsComponent implements OnInit, OnDestroy {
  generalPasswords: GeneralPassword[] = [];

  passwordHiddenImg: IconDefinition = faEye;
  passwordCopyImg: IconDefinition = faCopy;

  constructor(
    private generalPasswordDataStorageService: GeneralPasswordsDataStorageService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.generalPasswordDataStorageService.getGeneralPasswords().subscribe(
      (data) => {
        if (data != null) this.generalPasswords = Object.values(data);
      },
      (error) => {
        this.alertService.failureAlertEvent.next(error.message);
      }
    );
  }

  copyPassword(password: string) {
    navigator.clipboard.writeText(password);
  }

  togglePasswordVisibility(passwordField: HTMLInputElement, password: string) {
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      passwordField.value = password;
      this.passwordHiddenImg = faEyeSlash;
    } else {
      passwordField.type = 'password';
      passwordField.value = '..........';
      this.passwordHiddenImg = faEye;
    }
  }

  onDelete(id: string) {
    this.generalPasswordDataStorageService.deleteGeneralPassword(id).subscribe(
      () => {
        this.generalPasswords = this.generalPasswords.filter(
          (x) => x.id !== id
        );
        this.alertService.successAlertEvent.next('Deleted Successfully!');
      },
      (error) => {
        this.alertService.failureAlertEvent.next(error.message);
      }
    );
  }

  addNewGeneralPassword() {
    this.router.navigate(['/general-passwords', 'new']);
  }

  onEdit(id: string) {
    this.router.navigate(['/general-passwords', id, 'edit']);
  }

  ngOnDestroy(): void {
    this.alertService.resetAlertEvent.next();
  }
}
