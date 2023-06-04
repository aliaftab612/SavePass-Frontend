import { Component, OnInit } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { AlertService } from '../alert/alert.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {
  loginMode: boolean = true;
  isPasswordAndConfrimPasswordMaching = true;

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
        this.authService.authenticate(form.value.username, form.value.password);
      } else {
        this.authService.authenticate(
          form.value.username,
          form.value.password,
          true
        );
      }
    }
  }

  setIsPasswordAndConfrimPasswordMaching(formData: NgForm) {
    if (formData.value.password === formData.value.confirmPassword) {
      this.isPasswordAndConfrimPasswordMaching = true;
    } else {
      this.isPasswordAndConfrimPasswordMaching = false;
    }
  }
}
