import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  authenticated = false;
  isAuthenticatedEventSubscription: Subscription;
  isMobileViewHamburgerClicked = false;
  user: User;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.authenticated = this.user != null ? true : false;

    this.authService.isAuthenticatedEvent.subscribe((userData: User) => {
      this.authenticated = userData !== null ? true : false;
      this.user = userData;
    });
  }

  updateProfile() {
    this.router.navigate(['update-profile']);
    this.mobileViewHamburgerClose();
  }

  logout() {
    this.authService.logout();
    this.mobileViewHamburgerClose();
  }

  mobileViewHamburgerClicked() {
    this.isMobileViewHamburgerClicked = true;
  }

  mobileViewHamburgerClose() {
    this.isMobileViewHamburgerClicked = false;
  }

  ngOnDestroy(): void {
    this.isAuthenticatedEventSubscription.unsubscribe();
  }
}
