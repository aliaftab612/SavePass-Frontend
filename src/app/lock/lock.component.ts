import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  faLock,
  faSpinner,
  IconDefinition,
  faLockOpen,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth/auth.service';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lock',
  templateUrl: './lock.component.html',
  styleUrls: ['./lock.component.css'],
})
export class LockComponent implements OnInit, OnDestroy {
  closedLockIcon: IconDefinition = faLock;
  openLockIcon: IconDefinition = faLockOpen;
  username: string = null;
  unlockStarted: boolean = false;
  loadingSpinnerIcon: IconDefinition = faSpinner;
  isUnlockEventStartedSubscription: Subscription;
  passwordHiddenImg: IconDefinition = faEye;
  hidePassword: boolean = true;

  constructor(private authService: AuthService) {}

  ngOnDestroy(): void {
    if (this.isUnlockEventStartedSubscription) {
      this.isUnlockEventStartedSubscription.unsubscribe();
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
    this.passwordHiddenImg =
      this.passwordHiddenImg === faEye ? faEyeSlash : faEye;
  }

  ngOnInit(): void {
    this.authService.isLockedEvent.next(true);

    this.username = this.authService.getUser().email;

    this.isUnlockEventStartedSubscription =
      this.authService.isUnlockEventStarted.subscribe({
        next: (data: boolean) => {
          if (data) {
            this.unlockStarted = true;
          } else {
            this.unlockStarted = false;
          }
        },
      });
  }

  logout() {
    this.authService.logout();
  }

  unlock(form: NgForm) {
    if (this.unlockStarted) return;
    if (form.valid) {
      this.authService.regenerateEncryptionKeyAndUnlock(
        form.value.password,
        this.username
      );
    }
  }
}
