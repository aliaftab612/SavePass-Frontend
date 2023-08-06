import { Component, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertService } from '../alert/alert.service';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';
import { faSpinner, IconDefinition } from '@fortawesome/free-solid-svg-icons';

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

  constructor(
    private authService: AuthService,
    private alertService: AlertService
  ) {}
  ngOnDestroy(): void {
    if (this.isAuthenticationFailedSubscription) {
      this.isAuthenticationFailedSubscription.unsubscribe();
    }
  }

  SwitchAuthMode(form: NgForm) {
    this.alertService.resetAlertEvent.next();
    form.reset();
    this.loginMode = !this.loginMode;
  }

  onAuthenticationClick(form: NgForm) {
    if (form.valid) {
      this.authService.authenticate(
        form.value.username,
        form.value.password,
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
