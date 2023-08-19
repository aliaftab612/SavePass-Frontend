import { Component, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertService } from '../alert/alert.service';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';
import {
  faEye,
  faSpinner,
  faEyeSlash,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnDestroy {
  loginMode: boolean = true;
  isPasswordAndConfrimPasswordMaching = true;
  isAuthenticationFailedSubscription: Subscription;
  showLoadingSpinner: boolean = false;
  loadingSpinnerIcon: IconDefinition = faSpinner;
  passwordHiddenImg: IconDefinition = faEye;
  hidePassword: boolean = true;

  constructor(
    private authService: AuthService,
    private alertService: AlertService
  ) {}
  ngOnDestroy(): void {
    if (this.isAuthenticationFailedSubscription) {
      this.isAuthenticationFailedSubscription.unsubscribe();
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
    this.passwordHiddenImg =
      this.passwordHiddenImg === faEye ? faEyeSlash : faEye;
  }

  SwitchAuthMode(form: NgForm) {
    this.alertService.resetAlertEvent.next();
    form.reset();
    this.passwordHiddenImg = faEye;
    this.hidePassword = true;
    this.loginMode = !this.loginMode;
  }

  onAuthenticationClick(form: NgForm) {
    if (this.showLoadingSpinner) return;
    if (form.valid) {
      this.authService.authenticate(
        form.value.username,
        form.value.password,
        false,
        !this.loginMode
      );
      this.showLoadingSpinner = true;

      this.isAuthenticationFailedSubscription =
        this.authService.isAuthenticationFailed.subscribe({
          next: () => {
            this.showLoadingSpinner = false;
            this.isAuthenticationFailedSubscription.unsubscribe();
          },
        });
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
