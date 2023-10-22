import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { faSpinner, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-update-lock-time',
  templateUrl: './update-lock-time.component.html',
  styleUrls: ['./update-lock-time.component.css'],
  host: {
    class: 'ml-8 w-full',
  },
})
export class UpdateLockTimeComponent implements OnInit {
  appLockTime: number = 1;
  lockTimeUpdateInProgress: boolean = false;
  loadingSpinnerIcon: IconDefinition = faSpinner;

  constructor(private _location: Location, private authService: AuthService) {}

  ngOnInit(): void {
    this.appLockTime =
      this.authService.getUser().userSettings.appLockoutMinutes;

    this.authService.isLockTimeUpdateInProgress.subscribe({
      next: (data: boolean) => {
        if (data) {
          this.lockTimeUpdateInProgress = true;
        } else {
          this.lockTimeUpdateInProgress = false;
        }
      },
    });
  }

  updateLockTime(autoLockTimeDropDownElement: HTMLSelectElement) {
    if (this.lockTimeUpdateInProgress) return;
    this.authService.updateInactivityLockTime(
      Number(autoLockTimeDropDownElement.value)
    );
  }
}
