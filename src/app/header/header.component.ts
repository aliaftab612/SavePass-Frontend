import { Component, OnDestroy, OnInit } from '@angular/core';
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

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authenticated = this.authService.getUser() !== null ? true : false;

    this.authService.isAuthenticatedEvent.subscribe((userData: User) => {
      this.authenticated = userData !== null ? true : false;
    });
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.isAuthenticatedEventSubscription.unsubscribe();
  }
}
