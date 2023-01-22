import { Component, OnInit } from '@angular/core';
import { GeneralPassword } from '../general-password.model';
import { GeneralPasswordsDataStorageService } from '../general-passwords-data-storage.service';

@Component({
  selector: 'app-general-passwords',
  templateUrl: './general-passwords.component.html',
  styleUrls: ['./general-passwords.component.css'],
})
export class GeneralPasswordsComponent implements OnInit {
  generalPasswords: GeneralPassword[] = [];

  constructor(
    private generalPasswordDataStorageService: GeneralPasswordsDataStorageService
  ) {}

  ngOnInit(): void {
    this.generalPasswordDataStorageService
      .getGeneralPasswords()
      .subscribe((data) => {
        this.generalPasswords = data;
      });
  }

  copyPassword(password: string) {
    navigator.clipboard.writeText(password);
  }

  togglePasswordVisibility(passwordField: HTMLInputElement, password: string) {
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      passwordField.value = password;
    } else {
      passwordField.type = 'password';
      passwordField.value = '..........';
    }
  }

  onDelete(id: string) {
    this.generalPasswordDataStorageService
      .deleteGeneralPassword(id)
      .subscribe(() => {
        this.generalPasswords = this.generalPasswords.filter(
          (x) => x.id !== id
        );
      });
  }
}
