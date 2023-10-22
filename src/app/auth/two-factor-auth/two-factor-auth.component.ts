import { Component, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { NgForm } from '@angular/forms';
import { TwoFactorProviders } from '../auth-defaults.enum';
import { faSpinner, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-two-factor-auth',
  templateUrl: './two-factor-auth.component.html',
  styleUrls: ['./two-factor-auth.component.css'],
})
export class TwoFactorAuthComponent implements OnDestroy {
  showLoadingSpinner: boolean = false;
  loadingSpinnerIcon: IconDefinition = faSpinner;
  isAuthenticationFailedSubscription: Subscription;

  constructor(private authService: AuthService) {}

  submit(form: NgForm) {
    if (this.showLoadingSpinner) return;
    if (form.valid) {
      this.showLoadingSpinner = true;
      this.isAuthenticationFailedSubscription =
        this.authService.isAuthenticationFailed.subscribe({
          next: () => {
            this.showLoadingSpinner = false;
            this.isAuthenticationFailedSubscription.unsubscribe();
          },
        });

      this.authService.twoFactorAuthentication(
        TwoFactorProviders.authenticatorApp,
        form.value.token
      );
    }
  }

  ngOnDestroy(): void {
    if (this.isAuthenticationFailedSubscription) {
      this.isAuthenticationFailedSubscription.unsubscribe();
    }
  }

  cancel() {
    this.authService.canceltwoFactorAuthentication();
  }
}
