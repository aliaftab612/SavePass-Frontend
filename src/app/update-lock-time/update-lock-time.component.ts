import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-update-lock-time',
  templateUrl: './update-lock-time.component.html',
  styleUrls: ['./update-lock-time.component.css'],
})
export class UpdateLockTimeComponent implements OnInit {
  appLockTime: number = 1;

  constructor(private _location: Location, private authService: AuthService) {}

  ngOnInit(): void {
    this.appLockTime =
      this.authService.getUser().userSettings.appLockoutMinutes;
  }

  updateLockTime(autoLockTimeDropDownElement: HTMLSelectElement) {
    this.authService.updateInactivityLockTime(
      Number(autoLockTimeDropDownElement.value)
    );
  }
  cancel() {
    this._location.back();
  }
}
