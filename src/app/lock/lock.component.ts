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
import { PasswordlessService } from 'passkeys-prf-client';
import { handleError } from '../shared/PassskeyAuthErrorHandler';
import { ToastrService } from 'ngx-toastr';

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
  reAuthUsingPasskey = false;
  noPasskeyRegistered = true;
  pageLoading = true;

  constructor(
    private authService: AuthService,
    private passwordlessService: PasswordlessService,
    private toaster: ToastrService
  ) {}

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

  async ngOnInit() {
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

    const { credentials, error } =
      await this.passwordlessService.getUserPasskeyCredentials(
        this.authService.getToken().split(' ')[1]
      );

    this.pageLoading = false;
    if (error) {
      const errMessage = handleError(error);

      if (errMessage) {
        this.toaster.error(errMessage);
      }
      this.reAuthUsingPasskey = false;
      return;
    }

    if (credentials.length) {
      this.noPasskeyRegistered = false;
    } else {
      this.reAuthUsingPasskey = false;
    }
  }

  logout() {
    this.authService.logout();
  }

  async unlock(form: NgForm) {
    if (this.unlockStarted) return;
    if (form.valid) {
      if (!this.reAuthUsingPasskey) {
        this.authService.regenerateEncryptionKeyAndUnlock(
          form.value.password,
          this.username
        );
      } else {
        this.authService.isUnlockEventStarted.next(true);
        const { prfKey, passkeyCredentialId, error } =
          await this.passwordlessService.reAuthWithAlias(
            this.authService.getUser().email,
            true,
            this.authService.getToken().split(' ')[1]
          );

        if (error) {
          this.authService.isUnlockEventStarted.next(false);
          this.toaster.error(handleError(error));
          return;
        }

        await this.authService.generateEncyptionKeyUsingPasskey(
          prfKey,
          passkeyCredentialId
        );
      }
    }
  }

  changeReAuthMethod() {
    this.reAuthUsingPasskey = !this.reAuthUsingPasskey;
  }
}
