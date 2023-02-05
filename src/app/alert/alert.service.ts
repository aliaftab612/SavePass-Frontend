import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  successAlertEvent: Subject<string> = new Subject<string>();
  failureAlertEvent: Subject<string> = new Subject<string>();
  resetAlertEvent: Subject<void> = new Subject<void>();
  displayAlertVariableChanged: Subject<boolean> = new Subject<boolean>();
  successAlertVariableChanged: Subject<boolean> = new Subject<boolean>();

  private displayAlert: boolean = false;
  private successAlert = true;

  getDisplayAlert(): boolean {
    return this.displayAlert;
  }

  getSuccessAlert(): boolean {
    return this.successAlert;
  }

  setDisplayAlert(value: boolean) {
    this.displayAlert = value;
    this.displayAlertVariableChanged.next(value);
  }

  setSuccessAlert(value: boolean) {
    this.successAlert = value;
    this.successAlertVariableChanged.next(value);
  }
}
