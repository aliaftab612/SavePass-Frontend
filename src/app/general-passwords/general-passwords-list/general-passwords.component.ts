import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
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
    private generalPasswordDataStorageService: GeneralPasswordsDataStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.generalPasswordDataStorageService
      .getGeneralPasswords()
      .subscribe((data) => {
        this.generalPasswords = Object.values(data);
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

  addNewGeneralPassword() {
    this.router.navigate(['/general-passwords', 'new']);
  }

  onEdit(id: string) {
    this.router.navigate(['/general-passwords', id, 'edit']);
  }
}
