import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertService } from '../alert/alert.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {
  loginMode: boolean = true;

  constructor(
    private authService: AuthService,
    private alertService: AlertService
  ) {}

  SwitchAuthMode(form: NgForm) {
    this.alertService.resetAlertEvent.next();
    form.reset();
    this.loginMode = !this.loginMode;
  }

  onAuthenticationClick(form: NgForm) {
    if (form.valid) {
      if (this.loginMode) {
        this.authService.login(form.value.username, form.value.password);
      } else {
        this.authService.signUp(form.value.username, form.value.password);
      }
    }
  }
}
