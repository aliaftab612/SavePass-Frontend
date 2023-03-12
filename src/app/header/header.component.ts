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
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.isAuthenticatedEventSubscription.unsubscribe();
  }
}
