import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';

@Component({
  selector: 'app-update-profile',
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css'],
})
export class UpdateProfileComponent implements OnInit, OnDestroy {
  isSignUp: boolean = false;
  user: User;
  authEventSubscription: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
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
  }

  updateProfile(form: NgForm) {
    if (form.valid) {
      this.authService.updateUserData(
        form.value.firstname,
        form.value.lastname,
        form.value.profilePhotoURL
      );
    }
  }

  cancel() {
    this.router.navigate(['general-passwords']);
  }

  ngOnDestroy(): void {
    this.authEventSubscription.unsubscribe();
  }
}
