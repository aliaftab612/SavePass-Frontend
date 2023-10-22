import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';
import { faSpinner, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-update-profile',
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css'],
  host: {
    class: 'ml-8 w-full',
  },
})
export class UpdateProfileComponent implements OnInit, OnDestroy {
  user: User;
  authEventSubscription: Subscription;
  isProfileUpdateEventStartedSubscription: Subscription;
  updateInProgress: boolean = false;
  loadingSpinnerIcon: IconDefinition = faSpinner;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.authEventSubscription =
      this.authService.isAuthenticatedEvent.subscribe((user) => {
        this.user = user;
      });

    this.isProfileUpdateEventStartedSubscription =
      this.authService.isProfileUpdateEventStarted.subscribe({
        next: (data: boolean) => {
          if (data) {
            this.updateInProgress = true;
          } else {
            this.updateInProgress = false;
          }
        },
      });
  }

  updateProfile(form: NgForm) {
    if (this.updateInProgress) return;
    if (form.valid) {
      this.authService.updateUserData(
        form.value.firstname,
        form.value.lastname,
        form.value.profilePhotoURL
      );
    }
  }

  ngOnDestroy(): void {
    this.authEventSubscription.unsubscribe();
    this.isProfileUpdateEventStartedSubscription.unsubscribe();
  }
}
