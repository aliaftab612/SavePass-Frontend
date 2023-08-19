import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-update-profile',
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css'],
})
export class UpdateProfileComponent implements OnInit, OnDestroy {
  isSignUp: boolean = false;
  user: User;
  authEventSubscription: Subscription;
  isProfileUpdateEventStartedSubscription: Subscription;
  updateInProgress: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private _location: Location
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.isSignUp = Boolean(params['issignup']);
    });

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
        form.value.profilePhotoURL,
        this.isSignUp
      );
    }
  }

  cancel() {
    if (this.isSignUp) {
      this.router.navigate(['general-passwords']);
    } else {
      this._location.back();
    }
  }

  ngOnDestroy(): void {
    this.authEventSubscription.unsubscribe();
    this.isProfileUpdateEventStartedSubscription.unsubscribe();
  }
}
