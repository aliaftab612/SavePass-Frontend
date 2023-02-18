import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';

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
    this.authenticated = this.authService.isAuthenticated();

    this.authService.isAuthenticatedEvent.subscribe((authStatus: boolean) => {
      this.authenticated = authStatus;
    });
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.isAuthenticatedEventSubscription.unsubscribe();
  }
}
